alter table public.glossary_entries drop constraint glossary_entries_category_check;

update public.glossary_entries set category = 'scholar' where category = 'person';

alter table public.glossary_entries add constraint glossary_entries_category_check
  check (category in (
    'architecture', 'painting', 'sculpture', 'technique', 'iconography', 'general',
    'ruler', 'patron', 'artist', 'scholar', 'sacred', 'myth'
  ));

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
  event_count := greatest(event_count, 0);

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
          select 1 from public.learner_flags as flag
            where flag.holds
              and (
                flag.symbol_id = pin.symbol_id
                or flag.pin_id = pin.id
                or (flag.artwork_id = artwork.id and flag.reason not in ('pin', 'answers'))
              )
        )
  ),
  own_persons as (
    select context.meaning_id, lower(entry.name) as name_key
      from public.symbol_meaning_contexts as context
      join public.glossary_entries as entry on entry.id = context.glossary_entry_id
      where entry.category in ('ruler', 'patron', 'artist', 'scholar', 'sacred', 'myth')
  ),
  own_counts as (
    select own.meaning_id, count(distinct own.name_key) as names
      from own_persons as own
      group by own.meaning_id
  ),
  answer_counts as (
    select
      (select count(distinct lower(symbol.name)) from public.symbols as symbol) as symbols,
      (select count(distinct lower(meaning.text)) from public.symbol_meanings as meaning) as meanings,
      (select count(distinct lower(person.name)) from public.glossary_entries as person
        where person.category in ('ruler', 'patron', 'artist', 'scholar', 'sacred', 'myth')) as persons
  ),
  questions as (
    select question.pin_id, question.symbol_id, 'symbol' as kind
      from question_pins as question, answer_counts as counts
      where counts.symbols - 1 >= other_answers
    union all
    select question.pin_id, question.symbol_id, 'meaning'
      from question_pins as question
      join public.symbol_meanings as meaning on meaning.id = question.symbol_meaning_id,
      answer_counts as counts
      where counts.meanings - 1 >= other_answers
    union all
    select question.pin_id, question.symbol_id, 'attribute'
      from question_pins as question
      join own_counts as own on own.meaning_id = question.symbol_meaning_id,
      answer_counts as counts
      where counts.persons - own.names >= other_answers
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
        and log.card_id in (select picked.card_id from picked)
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
      where (card.id is null or card.due < day_end)
        and not exists (
          select 1 from public.learner_flags as flag where flag.event_id = event.id and flag.holds
        )
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
