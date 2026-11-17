alter table public.timeline_events add constraint timeline_events_id_owner_id_key unique (id, owner_id);

alter table public.extra_cards add column timeline_event_id uuid;
alter table public.extra_cards add constraint extra_cards_timeline_event_id_owner_id_fkey
  foreign key (timeline_event_id, owner_id) references public.timeline_events (id, owner_id)
  on delete cascade;

do $$
declare
  reference_check text;
begin
  select constraint_row.conname into reference_check
    from pg_constraint as constraint_row
    where constraint_row.conrelid = 'public.extra_cards'::regclass
      and constraint_row.contype = 'c'
      and pg_get_constraintdef(constraint_row.oid) like '%num_nonnulls%';
  execute format('alter table public.extra_cards drop constraint %I', reference_check);
end;
$$;

alter table public.extra_cards add constraint extra_cards_one_reference_check
  check (num_nonnulls(glossary_entry_id, symbol_id, timeline_event_id) = 1);

create unique index extra_cards_timeline_event_id_key on public.extra_cards (timeline_event_id)
  where timeline_event_id is not null;

grant insert (timeline_event_id) on public.extra_cards to authenticated;

alter table public.extra_review_log drop constraint extra_review_log_mode_check;
alter table public.extra_review_log add constraint extra_review_log_mode_check
  check (mode in (
    'quiz_definition', 'symbol_symbol', 'symbol_meaning', 'symbol_attribute',
    'event_year', 'event_start', 'event_end'
  ));

alter table public.profiles
  add column review_events_on boolean not null default true,
  add column review_event_questions smallint not null default 1
    constraint profiles_review_event_questions_check check (review_event_questions between 1 and 3);

grant insert (review_events_on, review_event_questions) on public.profiles to authenticated;
grant update (review_events_on, review_event_questions) on public.profiles to authenticated;

drop function public.record_extra_review(uuid, uuid, jsonb, jsonb, timestamptz);

create function public.record_extra_review(
  target_term uuid,
  target_symbol uuid,
  card jsonb,
  answer jsonb,
  day_start timestamptz default null,
  target_event uuid default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_card public.extra_cards := jsonb_populate_record(null::public.extra_cards, card);
  given public.extra_review_log := jsonb_populate_record(null::public.extra_review_log, answer);
  existing public.extra_cards;
  only_practice boolean := false;
begin
  if num_nonnulls(target_term, target_symbol, target_event) <> 1 then
    raise exception using errcode = '22023',
      message = 'an answer belongs to one term, one symbol or one event';
  end if;

  if not exists (select 1 from public.glossary_entries as term where term.id = target_term)
    and not exists (select 1 from public.symbols as symbol where symbol.id = target_symbol)
    and not exists (select 1 from public.timeline_events as event where event.id = target_event)
  then
    raise exception using errcode = '23503',
      message = 'the term, symbol or event is not in the atelier';
  end if;

  select stored.* into existing
    from public.extra_cards as stored
    where stored.owner_id = (select auth.uid())
      and (stored.glossary_entry_id = target_term
        or stored.symbol_id = target_symbol
        or stored.timeline_event_id = target_event)
    for update;

  only_practice := existing.id is not null and day_start is not null and exists (
    select 1 from public.extra_review_log as earlier
      where earlier.card_id = existing.id
        and not earlier.practice
        and earlier.reviewed_at >= day_start
        and earlier.reviewed_at < day_start + interval '1 day'
  );

  if existing.id is null then
    insert into public.extra_cards (
      glossary_entry_id, symbol_id, timeline_event_id, due, stability, difficulty, state, reps,
      lapses, scheduled_days, learning_steps, last_review, last_rating
    )
    values (
      target_term, target_symbol, target_event, next_card.due, next_card.stability,
      next_card.difficulty, next_card.state, coalesce(next_card.reps, 0),
      coalesce(next_card.lapses, 0), coalesce(next_card.scheduled_days, 0),
      coalesce(next_card.learning_steps, 0), next_card.last_review, given.rating
    )
    returning * into existing;
    existing.due := null;
  elsif not only_practice then
    update public.extra_cards
      set due = next_card.due,
        stability = next_card.stability,
        difficulty = next_card.difficulty,
        state = next_card.state,
        reps = coalesce(next_card.reps, 0),
        lapses = coalesce(next_card.lapses, 0),
        scheduled_days = coalesce(next_card.scheduled_days, 0),
        learning_steps = coalesce(next_card.learning_steps, 0),
        last_review = next_card.last_review,
        last_rating = given.rating
      where id = existing.id;
  end if;

  insert into public.extra_review_log (
    card_id, mode, rating, correct, answer_ms, wrong_answer, due_before, practice
  )
  values (
    existing.id, given.mode, given.rating, coalesce(given.correct, false), given.answer_ms,
    case when given.correct is false then nullif(left(btrim(given.wrong_answer), 500), '') end,
    existing.due, only_practice
  );

  return not only_practice;
end;
$$;

revoke all on function public.record_extra_review(uuid, uuid, jsonb, jsonb, timestamptz, uuid)
  from public, anon;
grant execute on function public.record_extra_review(uuid, uuid, jsonb, jsonb, timestamptz, uuid)
  to authenticated;

create or replace function public.extra_round(day_start timestamptz, reserve integer default 2)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  min_terms constant integer := 4;
  other_answers constant integer := 3;
  day_end timestamptz := day_start + interval '1 day';
  term_count integer := 1;
  symbol_count integer := 1;
  event_count integer := 1;
  preferences record;
  picked_terms jsonb;
  picked_symbols jsonb;
  picked_events jsonb;
begin
  if day_start is null or reserve is null or reserve < 0 then
    raise exception using errcode = '22023', message = 'unknown extra round';
  end if;

  select profile.review_glossary_on, profile.review_glossary_questions,
      profile.review_symbols_on, profile.review_symbol_questions,
      profile.review_events_on, profile.review_event_questions
    into preferences
    from public.profiles as profile;
  if found then
    term_count := case when preferences.review_glossary_on then preferences.review_glossary_questions else 0 end;
    symbol_count := case when preferences.review_symbols_on then preferences.review_symbol_questions else 0 end;
    event_count := case when preferences.review_events_on then preferences.review_event_questions else 0 end;
  end if;
  term_count := case when term_count > 0 then term_count + reserve else 0 end;
  symbol_count := case when symbol_count > 0 then symbol_count + reserve else 0 end;
  event_count := case when event_count > 0 then event_count + reserve else 0 end;

  if (select count(distinct lower(entry.name)) from public.glossary_entries as entry where entry.has_definition)
      < min_terms then
    term_count := 0;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', picked.id, 'card', picked.card) order by picked.place), '[]')
    into picked_terms
    from (
      select entry.id,
          case when card.id is null then null else to_jsonb(card) - 'owner_id' - 'created_at' end as card,
          row_number() over (order by card.id is null, card.due, random()) as place
        from public.glossary_entries as entry
        left join public.extra_cards as card on card.glossary_entry_id = entry.id
        where entry.has_definition
          and (card.id is null or card.due < day_end)
          and not exists (
            select 1 from public.learner_flags as flag where flag.term_id = entry.id and flag.holds
          )
        order by place
        limit term_count
    ) as picked;

  with question_pins as (
    select pin.id as pin_id, pin.symbol_id, pin.symbol_meaning_id, symbol.name
      from public.artwork_pins as pin
      join public.symbols as symbol on symbol.id = pin.symbol_id
      join public.artwork_images as image on image.id = pin.image_id
      join public.artworks as artwork on artwork.id = image.artwork_id and artwork.deleted_at is null
      where pin.crop_path is not null
        and pin.view_width is not null
        and not exists (
          select 1 from public.learner_flags as flag where flag.symbol_id = pin.symbol_id and flag.holds
        )
  ),
  own_persons as (
    select context.meaning_id, lower(entry.name) as name_key
      from public.symbol_meaning_contexts as context
      join public.glossary_entries as entry on entry.id = context.glossary_entry_id
      where entry.category = 'person'
  ),
  questions as (
    select question.pin_id, question.symbol_id, 'symbol' as kind
      from question_pins as question
      where (select count(distinct lower(other.name)) from public.symbols as other
        where lower(other.name) <> lower(question.name)) >= other_answers
    union all
    select question.pin_id, question.symbol_id, 'meaning'
      from question_pins as question
      join public.symbol_meanings as meaning on meaning.id = question.symbol_meaning_id
      where (select count(distinct lower(other.text)) from public.symbol_meanings as other
        where lower(other.text) <> lower(meaning.text)) >= other_answers
    union all
    select question.pin_id, question.symbol_id, 'attribute'
      from question_pins as question
      where exists (select 1 from own_persons as own where own.meaning_id = question.symbol_meaning_id)
        and (select count(distinct lower(person.name)) from public.glossary_entries as person
          where person.category = 'person'
            and lower(person.name) not in (
              select own.name_key from own_persons as own where own.meaning_id = question.symbol_meaning_id
            )) >= other_answers
  ),
  picked as (
    select candidate.symbol_id, card.id as card_id,
        case when card.id is null then null else to_jsonb(card) - 'owner_id' - 'created_at' end as card,
        row_number() over (order by card.id is null, card.due, random()) as place
      from (select distinct question.symbol_id from questions as question) as candidate
      left join public.extra_cards as card on card.symbol_id = candidate.symbol_id
      where card.id is null or card.due < day_end
      order by place
      limit symbol_count
  ),
  asked as (
    select log.card_id, replace(log.mode, 'symbol_', '') as kind, max(log.reviewed_at) as at
      from public.extra_review_log as log
      where not log.practice and log.mode like 'symbol\_%'
      group by log.card_id, log.mode
  ),
  kinds as (
    select distinct on (picked.symbol_id) picked.symbol_id, offered.kind
      from picked
      join (select distinct question.symbol_id, question.kind from questions as question) as offered
        on offered.symbol_id = picked.symbol_id
      left join asked on asked.card_id = picked.card_id and asked.kind = offered.kind
      order by picked.symbol_id, asked.at nulls first,
        array_position(array['symbol', 'meaning', 'attribute'], offered.kind)
  ),
  pins as (
    select distinct on (kinds.symbol_id) kinds.symbol_id, kinds.kind, question.pin_id
      from kinds
      join questions as question on question.symbol_id = kinds.symbol_id and question.kind = kinds.kind
      order by kinds.symbol_id, random()
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'symbol_id', picked.symbol_id, 'pin_id', pins.pin_id, 'kind', pins.kind, 'card', picked.card
    ) order by picked.place), '[]')
    into picked_symbols
    from picked
    join pins on pins.symbol_id = picked.symbol_id;

  with picked as (
    select event.id, event.year_from, card.id as card_id,
        case when card.id is null then null else to_jsonb(card) - 'owner_id' - 'created_at' end as card,
        row_number() over (order by card.id is null, card.due, random()) as place
      from public.timeline_events as event
      left join public.extra_cards as card on card.timeline_event_id = event.id
      where card.id is null or card.due < day_end
      order by place
      limit event_count
  ),
  asked as (
    select log.card_id,
        max(log.reviewed_at) filter (where log.mode = 'event_start') as started_at,
        max(log.reviewed_at) filter (where log.mode = 'event_end') as ended_at
      from public.extra_review_log as log
      where not log.practice and log.card_id in (select picked.card_id from picked)
      group by log.card_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', picked.id,
      'kind', case
        when picked.year_from is null then 'year'
        when asked.started_at is null then 'start'
        when asked.ended_at is null then 'end'
        when asked.ended_at < asked.started_at then 'end'
        else 'start'
      end,
      'card', picked.card
    ) order by picked.place), '[]')
    into picked_events
    from picked
    left join asked on asked.card_id = picked.card_id;

  return jsonb_build_object('terms', picked_terms, 'symbols', picked_symbols, 'events', picked_events);
end;
$$;

revoke all on function public.extra_round(timestamptz, integer) from public, anon;
grant execute on function public.extra_round(timestamptz, integer) to authenticated;
