alter table public.point_events
  add column code text,
  drop constraint point_events_kind_check,
  drop constraint point_events_check,
  add constraint point_events_kind_check check (kind in (
    'plan_day', 'settled', 'artwork_added', 'definition_added', 'event_added', 'visit_added', 'easter_egg'
  )),
  add constraint point_events_item_check check ((kind in ('plan_day', 'easter_egg')) = (item_id is null)),
  add constraint point_events_code_check check ((kind = 'easter_egg') = (code is not null));

create unique index point_events_code_idx on public.point_events (owner_id, code)
  where kind = 'easter_egg';

create or replace function public.learner_points()
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
      when 'easter_egg' then 50
      else 2
    end
  )), 0)::integer
    from public.point_events as event;
$$;

create table public.exhibit_tiers (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exhibit text not null check (exhibit ~ '^[a-z_]+$'),
  tier smallint not null check (tier >= 1),
  unlocked_at timestamptz not null default now(),
  seen_at timestamptz,
  primary key (owner_id, exhibit, tier)
);

alter table public.exhibit_tiers enable row level security;

create policy "Owners read their exhibit tiers"
  on public.exhibit_tiers for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners mark their exhibit tiers as seen"
  on public.exhibit_tiers for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.exhibit_tiers from anon, authenticated;
grant select on public.exhibit_tiers to authenticated;
grant update (seen_at) on public.exhibit_tiers to authenticated;

create table public.free_review_days (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day_start timestamptz not null,
  answers integer not null check (answers >= 0),
  primary key (owner_id, day_start)
);

alter table public.free_review_days enable row level security;

create policy "Owners read their free review days"
  on public.free_review_days for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners record their free review days"
  on public.free_review_days for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners count their free review days"
  on public.free_review_days for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.free_review_days from anon, authenticated;
grant select on public.free_review_days to authenticated;
grant insert (day_start, answers) on public.free_review_days to authenticated;
grant update (answers) on public.free_review_days to authenticated;

create function public.record_free_answers(day_start timestamptz, answers integer)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.free_review_days as day (day_start, answers)
  values (record_free_answers.day_start, greatest(record_free_answers.answers, 0))
  on conflict (owner_id, day_start) do update
    set answers = day.answers + excluded.answers;
$$;

revoke all on function public.record_free_answers(timestamptz, integer) from public, anon;
grant execute on function public.record_free_answers(timestamptz, integer) to authenticated;

create function private.exhibit_values(owner uuid, time_zone text)
returns table (exhibit text, place integer, value integer, thresholds integer[])
language sql
stable
security definer
set search_path = ''
as $$
  with live as (
    select artwork.id, artwork.era_code
      from public.artworks as artwork
      where artwork.owner_id = owner and artwork.deleted_at is null
  ),
  cards as (
    select card.stability, card.lapses
      from public.review_cards as card
      join live on live.id = card.artwork_id
  ),
  visited as (
    select visit.place_id from public.visits as visit where visit.owner_id = owner
  )
  select exhibit.code, exhibit.place, exhibit.value::integer, exhibit.thresholds
    from (values
      ('collection', 1, (select count(*) from live), array[1, 10, 50, 100, 250, 500, 1000, 2500, 5000]),
      ('eras', 2, (select count(distinct live.era_code) from live), array[2, 3, 4, 5, 6]),
      ('memory', 3, (select count(*) from cards where cards.stability >= 7), array[1, 25, 100, 250, 500, 1000, 2500]),
      ('regular', 4,
        (select coalesce(max(event.streak_days), 0) from public.point_events as event
          where event.owner_id = owner and event.kind = 'plan_day'),
        array[3, 7, 14, 30, 60, 100, 200, 365]),
      ('back_from_storage', 5, (select count(*) from cards where cards.lapses > 0 and cards.stability >= 7),
        array[1, 5, 25, 50, 100]),
      ('chronicle', 6, (select count(distinct visited.place_id) from visited), array[1, 5, 10, 25, 50, 100]),
      ('grand_tour', 7,
        (select count(distinct place.country_code)
          from visited join public.location_details as place on place.value_id = visited.place_id),
        array[1, 2, 3, 5, 10, 20]),
      ('seen_live', 8,
        (select count(distinct seen.artwork_id) from public.visit_artworks as seen where seen.owner_id = owner),
        array[1, 10, 50, 100, 250, 500]),
      ('timeline', 9,
        (select count(*) from public.timeline_events as event where event.owner_id = owner),
        array[1, 10, 50, 100, 250]),
      ('glossary', 10,
        (select count(*) from public.glossary_entries as entry where entry.owner_id = owner),
        array[1, 10, 25, 50, 100, 250, 500]),
      ('own_eye', 11,
        (select count(*) from public.artwork_images as image
          join live on live.id = image.artwork_id
          where image.own_image_path is not null),
        array[1, 5, 25, 50, 100]),
      ('night_watch', 12,
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner
            and extract(hour from entry.reviewed_at at time zone time_zone) < 4),
        array[1]),
      ('marathon', 13,
        (select coalesce(max(day.answers), 0) from public.free_review_days as day where day.owner_id = owner),
        array[1000])
    ) as exhibit (code, place, value, thresholds);
$$;

revoke all on function private.exhibit_values(uuid, text) from public;

create function private.unlock_exhibits_for(owner uuid, time_zone text)
returns table (exhibit text, value integer, thresholds integer[])
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
    with current_values as (
      select * from private.exhibit_values(owner, time_zone)
    ),
    unlocked as (
      insert into public.exhibit_tiers (owner_id, exhibit, tier)
        select owner, current_values.exhibit, tier.number
          from current_values,
            generate_subscripts(current_values.thresholds, 1) as tier (number)
          where current_values.thresholds[tier.number] <= current_values.value
        on conflict do nothing
    ),
    rewarded as (
      insert into public.point_events (owner_id, kind, code)
        select owner, 'easter_egg', current_values.exhibit
          from current_values
          where current_values.exhibit in ('night_watch', 'marathon')
            and current_values.thresholds[1] <= current_values.value
            and (select count(*) from public.point_events as existing where existing.owner_id = owner) < 50000
        on conflict do nothing
    )
    select current_values.exhibit, current_values.value, current_values.thresholds
      from current_values
      order by current_values.place;
end;
$$;

revoke all on function private.unlock_exhibits_for(uuid, text) from public;

create function public.unlock_exhibits(time_zone text)
returns table (exhibit text, value integer, thresholds integer[])
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'not signed in';
  end if;
  return query select * from private.unlock_exhibits_for(auth.uid(), time_zone);
end;
$$;

revoke all on function public.unlock_exhibits(text) from public, anon;
grant execute on function public.unlock_exhibits(text) to authenticated;

do $$
declare
  account record;
begin
  for account in select id from auth.users loop
    perform private.unlock_exhibits_for(account.id, 'Europe/Warsaw');
  end loop;
end;
$$;

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
    'point_events', 'exhibit_tiers', 'free_review_days'
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

  perform set_config('study_atelier.importing', '', true);

  if not had_points and not exists (select 1 from public.point_events where owner_id = importer) then
    perform private.fill_point_events(importer);
  end if;

  return counts;
end;
$$;
