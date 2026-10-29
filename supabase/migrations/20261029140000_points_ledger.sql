create table public.point_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null
    check (kind in ('plan_day', 'settled', 'artwork_added', 'definition_added', 'event_added', 'visit_added')),
  item_id uuid,
  day_start timestamptz,
  plan_share real check (plan_share between 0 and 1),
  streak_days integer check (streak_days >= 0),
  occurred_at timestamptz not null default now(),
  check ((kind = 'plan_day') = (item_id is null)),
  check ((kind = 'plan_day') = (day_start is not null and plan_share is not null and streak_days is not null))
);

create unique index point_events_item_idx on public.point_events (owner_id, kind, item_id)
  where item_id is not null;
create unique index point_events_day_idx on public.point_events (owner_id, day_start)
  where kind = 'plan_day';

alter table public.point_events enable row level security;

create policy "Owners read their point events"
  on public.point_events for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners record their plan days"
  on public.point_events for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners update their plan days"
  on public.point_events for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

grant select on public.point_events to authenticated;
grant insert (kind, day_start, plan_share, streak_days) on public.point_events to authenticated;
grant update (plan_share, streak_days, occurred_at) on public.point_events to authenticated;

create function private.add_point_event(owner uuid, event_kind text, item uuid, at timestamptz)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.point_events (owner_id, kind, item_id, occurred_at)
    select owner, event_kind, item, at
      where (select count(*) from public.point_events as existing where existing.owner_id = owner) < 50000
    on conflict do nothing;
$$;

revoke all on function private.add_point_event(uuid, text, uuid, timestamptz) from public;

create function private.point_event_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('study_atelier.importing', true), '') <> 'on' then
    perform private.add_point_event(new.owner_id, tg_argv[0], new.id, new.created_at);
  end if;
  return null;
end;
$$;

revoke all on function private.point_event_on_insert() from public;

create trigger artworks_point_event
  after insert on public.artworks
  for each row execute function private.point_event_on_insert('artwork_added');

create trigger glossary_entries_point_event
  after insert on public.glossary_entries
  for each row execute function private.point_event_on_insert('definition_added');

create trigger timeline_events_point_event
  after insert on public.timeline_events
  for each row execute function private.point_event_on_insert('event_added');

create trigger visits_point_event
  after insert on public.visits
  for each row execute function private.point_event_on_insert('visit_added');

create function private.point_event_on_settled()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stability >= 7 and coalesce(current_setting('study_atelier.importing', true), '') <> 'on' then
    perform private.add_point_event(new.owner_id, 'settled', new.artwork_id, coalesce(new.last_review, now()));
  end if;
  return null;
end;
$$;

revoke all on function private.point_event_on_settled() from public;

create trigger review_cards_point_event
  after insert or update of stability on public.review_cards
  for each row execute function private.point_event_on_settled();

create function private.fill_point_events(owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.point_events (owner_id, kind, item_id, occurred_at)
    select owner, 'artwork_added', artwork.id, artwork.created_at
      from public.artworks as artwork where artwork.owner_id = owner
    union all
    select owner, 'definition_added', entry.id, entry.created_at
      from public.glossary_entries as entry where entry.owner_id = owner
    union all
    select owner, 'event_added', event.id, event.created_at
      from public.timeline_events as event where event.owner_id = owner
    union all
    select owner, 'visit_added', visit.id, visit.created_at
      from public.visits as visit where visit.owner_id = owner
    union all
    select owner, 'settled', card.artwork_id, coalesce(card.last_review, card.created_at)
      from public.review_cards as card where card.owner_id = owner and card.stability >= 7
    on conflict do nothing;

  insert into public.point_events (owner_id, kind, day_start, plan_share, streak_days, occurred_at)
    with days as (
      select distinct (entry.reviewed_at at time zone 'Europe/Warsaw')::date as day
        from public.review_log as entry where entry.owner_id = owner
    ),
    runs as (
      select day, day - (row_number() over (order by day))::integer as run from days
    )
    select owner, 'plan_day', day::timestamp at time zone 'Europe/Warsaw', 1,
        row_number() over (partition by run order by day),
        (day + 1)::timestamp at time zone 'Europe/Warsaw'
      from runs
    on conflict do nothing;
end;
$$;

revoke all on function private.fill_point_events(uuid) from public;

select private.fill_point_events(account.id) from auth.users as account;

drop function public.record_review(uuid, jsonb, jsonb);

create function public.record_review(
  target_artwork uuid,
  card jsonb,
  answer jsonb,
  day_start timestamptz default null,
  time_zone text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  next_card public.review_cards := jsonb_populate_record(null::public.review_cards, card);
  given public.review_log := jsonb_populate_record(null::public.review_log, answer);
  target_facet text := coalesce(given.facet, 'recognise');
  previous_due timestamptz;
  counts record;
  new_per_day integer;
  done integer;
  waiting integer;
begin
  select existing.due into previous_due
    from public.review_cards as existing
    where existing.artwork_id = target_artwork and existing.facet = target_facet;

  insert into public.review_cards (
    artwork_id, facet, due, stability, difficulty, state, reps, lapses, scheduled_days,
    learning_steps, last_review
  )
  values (
    target_artwork, target_facet, next_card.due, next_card.stability, next_card.difficulty,
    next_card.state, next_card.reps, next_card.lapses, next_card.scheduled_days,
    next_card.learning_steps, next_card.last_review
  )
  on conflict (artwork_id, facet) do update
    set due = excluded.due,
      stability = excluded.stability,
      difficulty = excluded.difficulty,
      state = excluded.state,
      reps = excluded.reps,
      lapses = excluded.lapses,
      scheduled_days = excluded.scheduled_days,
      learning_steps = excluded.learning_steps,
      last_review = excluded.last_review;

  insert into public.review_log (artwork_id, facet, mode, rating, correct, answer_ms, due_before)
  values (
    target_artwork, target_facet, given.mode, given.rating, given.correct, given.answer_ms,
    previous_due
  );

  if day_start is null or time_zone is null then
    return;
  end if;

  select * into counts from public.review_counts(day_start);
  select coalesce((select profile.review_new_per_day from public.profiles as profile), 10) into new_per_day;
  select count(distinct entry.artwork_id) into done
    from public.review_log as entry
    where entry.reviewed_at >= day_start and entry.reviewed_at < day_start + interval '1 day';
  waiting := case
    when counts.with_image < 20 then 0
    else counts.due + least(counts.new_available, greatest(0, new_per_day - counts.new_today))
  end;

  insert into public.point_events (kind, day_start, plan_share, streak_days)
  values ('plan_day', day_start, done::real / (done + waiting), public.review_streak(day_start, time_zone))
  on conflict (owner_id, day_start) where kind = 'plan_day' do update
    set plan_share = excluded.plan_share,
      streak_days = excluded.streak_days,
      occurred_at = now();
end;
$$;

revoke all on function public.record_review(uuid, jsonb, jsonb, timestamptz, text) from public, anon;
grant execute on function public.record_review(uuid, jsonb, jsonb, timestamptz, text) to authenticated;

create function public.learner_points()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(round(sum(
    case event.kind
      when 'plan_day' then
        10 * event.plan_share * (1 + 0.05 * least(greatest(event.streak_days - 1, 0), 10))
      when 'settled' then 20
      else 2
    end
  )), 0)::integer
    from public.point_events as event;
$$;

revoke all on function public.learner_points() from public, anon;
grant execute on function public.learner_points() to authenticated;

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
    'artworks', 'artwork_images', 'glossary_entries', 'artwork_pins', 'artwork_fields',
    'category_values', 'artwork_values', 'period_eras', 'style_periods', 'author_details',
    'period_details', 'style_details', 'material_details', 'location_details', 'era_details',
    'artwork_field_entries', 'timeline_events', 'visits', 'visit_artworks', 'review_cards', 'review_log',
    'point_events'
  ];
  had_points constant boolean := exists (select 1 from public.point_events where owner_id = auth.uid());
  table_name text;
  rows jsonb;
  columns text;
  inserted bigint;
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
  then
    raise exception using errcode = '55000', message = 'the atelier is not empty';
  end if;

  perform set_config('study_atelier.importing', 'on', true);

  foreach table_name in array tables loop
    rows := coalesce(payload -> table_name, '[]');
    if jsonb_typeof(rows) <> 'array' then
      raise exception using errcode = '22023', message = format('%s is not a list', table_name);
    end if;
    if jsonb_array_length(rows) = 0 or (table_name = 'point_events' and had_points) then
      continue;
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

  perform set_config('study_atelier.importing', '', true);

  if not had_points and not exists (select 1 from public.point_events where owner_id = importer) then
    perform private.fill_point_events(importer);
  end if;

  return counts;
end;
$$;
