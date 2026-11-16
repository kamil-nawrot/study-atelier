create table public.extra_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  glossary_entry_id uuid,
  symbol_id uuid,
  due timestamptz not null,
  stability double precision not null check (stability >= 0),
  difficulty double precision not null check (difficulty >= 0),
  state smallint not null check (state between 0 and 3),
  reps integer not null default 0 check (reps >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  scheduled_days integer not null default 0 check (scheduled_days >= 0),
  learning_steps integer not null default 0 check (learning_steps >= 0),
  last_review timestamptz,
  last_rating smallint check (last_rating between 1 and 3),
  created_at timestamptz not null default now(),
  unique (id, owner_id),
  foreign key (glossary_entry_id, owner_id) references public.glossary_entries (id, owner_id)
    on delete cascade,
  foreign key (symbol_id, owner_id) references public.symbols (id, owner_id) on delete cascade,
  check (num_nonnulls(glossary_entry_id, symbol_id) = 1)
);

create unique index extra_cards_glossary_entry_id_key on public.extra_cards (glossary_entry_id)
  where glossary_entry_id is not null;
create unique index extra_cards_symbol_id_key on public.extra_cards (symbol_id)
  where symbol_id is not null;
create index extra_cards_owner_id_due_idx on public.extra_cards (owner_id, due);

create trigger extra_cards_limit_rows
  after insert on public.extra_cards
  referencing new table as added
  for each statement execute function private.limit_rows('5000');

create table public.extra_review_log (
  id bigint generated always as identity primary key,
  card_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode text not null
    check (mode in ('quiz_definition', 'symbol_symbol', 'symbol_meaning', 'symbol_attribute')),
  rating smallint not null check (rating between 1 and 3),
  correct boolean not null,
  answer_ms integer check (answer_ms >= 0),
  wrong_answer text check (char_length(wrong_answer) <= 500),
  due_before timestamptz,
  practice boolean not null default false,
  reviewed_at timestamptz not null default now(),
  foreign key (card_id, owner_id) references public.extra_cards (id, owner_id) on delete cascade
);

create index extra_review_log_card_id_reviewed_at_idx on public.extra_review_log (card_id, reviewed_at);
create index extra_review_log_owner_id_reviewed_at_idx
  on public.extra_review_log (owner_id, reviewed_at);

create trigger extra_review_log_limit_rows
  after insert on public.extra_review_log
  referencing new table as added
  for each statement execute function private.limit_rows('1000', 'reviewed_at');

alter table public.extra_cards enable row level security;
alter table public.extra_review_log enable row level security;

create policy "Owners manage their extra cards"
  on public.extra_cards for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their extra review log"
  on public.extra_review_log for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.extra_cards, public.extra_review_log from anon, authenticated;

grant select on public.extra_cards, public.extra_review_log to authenticated;
grant insert (
  glossary_entry_id, symbol_id, due, stability, difficulty, state, reps, lapses, scheduled_days,
  learning_steps, last_review, last_rating
) on public.extra_cards to authenticated;
grant update (
  due, stability, difficulty, state, reps, lapses, scheduled_days, learning_steps, last_review,
  last_rating
) on public.extra_cards to authenticated;
grant insert (
  card_id, mode, rating, correct, answer_ms, wrong_answer, due_before, practice
) on public.extra_review_log to authenticated;

create function public.record_extra_review(
  target_term uuid,
  target_symbol uuid,
  card jsonb,
  answer jsonb,
  day_start timestamptz default null
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
  if num_nonnulls(target_term, target_symbol) <> 1 then
    raise exception using errcode = '22023', message = 'an answer belongs to one term or one symbol';
  end if;

  if not exists (select 1 from public.glossary_entries as term where term.id = target_term)
    and not exists (select 1 from public.symbols as symbol where symbol.id = target_symbol)
  then
    raise exception using errcode = '23503', message = 'the term or symbol is not in the atelier';
  end if;

  select stored.* into existing
    from public.extra_cards as stored
    where stored.owner_id = (select auth.uid())
      and (stored.glossary_entry_id = target_term or stored.symbol_id = target_symbol)
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
      glossary_entry_id, symbol_id, due, stability, difficulty, state, reps, lapses,
      scheduled_days, learning_steps, last_review, last_rating
    )
    values (
      target_term, target_symbol, next_card.due, next_card.stability, next_card.difficulty,
      next_card.state, coalesce(next_card.reps, 0), coalesce(next_card.lapses, 0),
      coalesce(next_card.scheduled_days, 0), coalesce(next_card.learning_steps, 0),
      next_card.last_review, given.rating
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

revoke all on function public.record_extra_review(uuid, uuid, jsonb, jsonb, timestamptz)
  from public, anon;
grant execute on function public.record_extra_review(uuid, uuid, jsonb, jsonb, timestamptz)
  to authenticated;

alter table public.profiles drop constraint profiles_review_glossary_questions_check;
alter table public.profiles add constraint profiles_review_glossary_questions_check
  check (review_glossary_questions between 1 and 5);
alter table public.profiles drop constraint profiles_review_symbol_questions_check;
alter table public.profiles add constraint profiles_review_symbol_questions_check
  check (review_symbol_questions between 1 and 5);

create or replace function public.import_atelier(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  importer uuid := auth.uid();
  tables constant text[] := array[
    'artworks', 'artwork_images', 'glossary_entries', 'symbols', 'symbol_meanings', 'artwork_pins',
    'artwork_fields',
    'category_values', 'artwork_values', 'period_eras', 'style_periods', 'author_details',
    'period_details', 'style_details', 'material_details', 'location_details', 'era_details',
    'artwork_relations', 'author_relations',
    'artwork_field_entries', 'symbol_meaning_contexts', 'timeline_events', 'visits', 'visit_artworks', 'exhibitions', 'learner_flags', 'review_cards',
    'review_log', 'extra_cards', 'extra_review_log', 'point_events', 'exhibit_tiers', 'free_review_days'
  ];
  kept_tables constant text[] := array['point_events', 'exhibit_tiers', 'free_review_days'];
  had_points constant boolean := exists (select 1 from public.point_events where owner_id = auth.uid());
  table_name text;
  rows jsonb;
  columns text;
  inserted bigint;
  kept boolean;
  counts jsonb := '{}';
begin
  if importer is null then
    raise exception using errcode = '28000', message = 'not signed in';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception using errcode = '22023', message = 'the import is not an object';
  end if;
  if exists (select 1 from public.artworks where owner_id = importer)
    or exists (select 1 from public.category_values where owner_id = importer)
    or exists (select 1 from public.glossary_entries where owner_id = importer)
    or exists (select 1 from public.timeline_events where owner_id = importer)
    or exists (select 1 from public.artwork_fields where owner_id = importer)
    or exists (select 1 from public.visits where owner_id = importer)
    or exists (select 1 from public.exhibitions where owner_id = importer)
    or exists (select 1 from public.symbols where owner_id = importer)
  then
    raise exception using errcode = '55000', message = 'the atelier is not empty';
  end if;

  perform set_config('study_atelier.importing', 'on', true);

  foreach table_name in array tables loop
    rows := coalesce(payload -> table_name, '[]');
    if jsonb_typeof(rows) <> 'array' then
      raise exception using errcode = '22023', message = format('%s is not a list', table_name);
    end if;
    if jsonb_array_length(rows) = 0 then
      continue;
    end if;
    if table_name = 'exhibit_tiers' then
      rows := coalesce((select jsonb_agg(tier.value)
        from jsonb_array_elements(rows) as tier
        where exists (select 1 from public.exhibits as exhibit where exhibit.code = tier.value ->> 'exhibit')), '[]');
      if jsonb_array_length(rows) = 0 then
        continue;
      end if;
    end if;
    if table_name = 'location_details' then
      rows := (select jsonb_agg(place.value - 'city_id') from jsonb_array_elements(rows) as place);
    end if;
    if table_name in ('artwork_relations', 'author_relations') then
      rows := (select jsonb_agg(
          case
            when relation.value ->> 'kind' in ('version', 'related', 'collaboration', 'family')
              and (relation.value ->> 'from_id')::uuid > (relation.value ->> 'to_id')::uuid
            then relation.value
              || jsonb_build_object('from_id', relation.value -> 'to_id', 'to_id', relation.value -> 'from_id')
            else relation.value
          end)
        from jsonb_array_elements(rows) as relation);
    end if;
    if table_name = any (kept_tables) then
      execute format('select exists (select 1 from public.%I where owner_id = $1)', table_name)
        into kept using importer;
      if kept or (table_name = 'point_events' and had_points) then
        continue;
      end if;
    end if;

    select string_agg(quote_ident(attribute.attname), ', ' order by attribute.attnum)
      into columns
      from pg_attribute as attribute
      where attribute.attrelid = format('public.%I', table_name)::regclass
        and attribute.attnum > 0
        and not attribute.attisdropped
        and attribute.attidentity = ''
        and attribute.attgenerated = ''
        and attribute.attname <> 'owner_id'
        and jsonb_exists(rows -> 0, attribute.attname);

    execute format(
      'insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1)',
      table_name, columns, columns, table_name
    ) using rows;
    get diagnostics inserted = row_count;
    counts := counts || jsonb_build_object(table_name, inserted);
  end loop;

  update public.location_details as details
    set city_id = (place.value ->> 'city_id')::uuid
    from jsonb_array_elements(coalesce(payload -> 'location_details', '[]')) as place
    where details.value_id = (place.value ->> 'value_id')::uuid
      and details.owner_id = importer
      and place.value ->> 'city_id' is not null;

  if jsonb_array_length(coalesce(payload -> 'review_log', '[]')) > 0
    and not jsonb_exists(payload -> 'review_log' -> 0, 'practice') then
    perform private.fill_review_practice(importer);
  end if;

  perform private.fill_style_cards(importer);

  perform set_config('study_atelier.importing', '', true);

  perform private.rebuild_note_links(importer);

  if not had_points and not exists (select 1 from public.point_events where owner_id = importer) then
    perform private.fill_point_events(importer);
  end if;

  return counts;
end;
$$;
