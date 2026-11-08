create table public.exhibit_rooms (
  code text primary key check (code ~ '^[a-z_]+$'),
  position smallint not null unique check (position >= 1)
);

create table public.exhibits (
  code text primary key check (code ~ '^[a-z_]+$'),
  room_code text not null references public.exhibit_rooms (code),
  position smallint not null check (position >= 1),
  thresholds integer[] not null check (cardinality(thresholds) >= 1 and array_position(thresholds, null) is null),
  hidden boolean not null,
  unique (room_code, position)
);

alter table public.exhibit_rooms enable row level security;
alter table public.exhibits enable row level security;

create policy "Signed-in users read exhibit rooms"
  on public.exhibit_rooms for select to authenticated
  using (true);

create policy "Signed-in users read exhibits"
  on public.exhibits for select to authenticated
  using (true);

revoke all on public.exhibit_rooms, public.exhibits from anon, authenticated;
grant select on public.exhibit_rooms, public.exhibits to authenticated;

insert into public.exhibit_rooms (code, position) values
  ('main_hall', 1),
  ('era_enfilade', 2),
  ('reading_room', 3),
  ('scriptorium', 4),
  ('map_room', 5),
  ('pavilion', 6),
  ('crypt', 7);

insert into public.exhibits (code, room_code, position, thresholds, hidden) values
  ('collection', 'main_hall', 1, array[1, 10, 50, 100, 250, 500, 1000, 2500, 5000], false),
  ('vasari_lives', 'main_hall', 2, array[1, 3, 5, 10, 20], false),
  ('own_eye', 'main_hall', 4, array[1, 5, 25, 50, 100], false),
  ('pinacotheca', 'main_hall', 5, array[10], true),
  ('eras', 'era_enfilade', 1, array[2, 3, 4, 5, 6], false),
  ('prehistory', 'era_enfilade', 2, array[1, 10, 25, 50, 100, 250], false),
  ('antiquity', 'era_enfilade', 3, array[1, 10, 25, 50, 100, 250], false),
  ('middle_ages', 'era_enfilade', 4, array[1, 10, 25, 50, 100, 250], false),
  ('early_modern', 'era_enfilade', 5, array[1, 10, 25, 50, 100, 250], false),
  ('modern', 'era_enfilade', 6, array[1, 10, 25, 50, 100, 250], false),
  ('contemporary', 'era_enfilade', 7, array[1, 10, 25, 50, 100, 250], false),
  ('memory', 'reading_room', 1, array[1, 25, 100, 250, 500, 1000, 2500], false),
  ('bullseye', 'reading_room', 2, array[1, 5, 25, 50, 100, 250], false),
  ('regular', 'reading_room', 3, array[3, 7, 14, 30, 60, 100, 200, 365], false),
  ('back_from_storage', 'reading_room', 4, array[1], true),
  ('night_watch', 'reading_room', 5, array[1], true),
  ('marathon', 'reading_room', 6, array[1000], true),
  ('amateur_magnifier', 'reading_room', 7, array[1], true),
  ('glossary', 'scriptorium', 1, array[1, 10, 25, 50, 100, 250, 500], false),
  ('timeline', 'scriptorium', 2, array[1, 10, 50, 100, 250], false),
  ('hortus_cliffortianus', 'scriptorium', 3, array[1, 10, 25, 50, 100, 500], false),
  ('figure_alphabet', 'scriptorium', 4, array[23], true),
  ('chronicle', 'map_room', 1, array[1, 5, 10, 25, 50, 100], false),
  ('grand_tour', 'map_room', 2, array[1, 2, 3, 5, 10, 20], false),
  ('seen_live', 'map_room', 3, array[1, 10, 50, 100, 250, 500], false),
  ('trevi_fountain', 'map_room', 4, array[2], true),
  ('seven_league_boots', 'map_room', 5, array[3], true),
  ('crystal_palace', 'pavilion', 1, array[1, 3, 5, 10, 25], false),
  ('mouth_of_truth', 'crypt', 1, array[1], true),
  ('candle_moths', 'crypt', 2, array[1], true);

alter table public.exhibit_tiers
  add constraint exhibit_tiers_exhibit_fkey foreign key (exhibit) references public.exhibits (code);

drop function public.unlock_exhibits(text);
drop function private.unlock_exhibits_for(uuid, text);
drop function private.exhibit_values(uuid, text);

create function private.exhibit_values(owner uuid, time_zone text)
returns table (exhibit text, value integer)
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
      where card.facet = 'recognise'
  ),
  visited as (
    select visit.place_id from public.visits as visit where visit.owner_id = owner
  ),
  described as (
    select details.value_id from public.author_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select details.value_id from public.period_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select details.value_id from public.style_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select details.value_id from public.material_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select details.value_id from public.location_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select null from public.era_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
  ),
  exhibited as (
    select exhibition.id
      from public.exhibitions as exhibition
      join public.exhibition_artworks as placed on placed.exhibition_id = exhibition.id
      join live on live.id = placed.artwork_id
      where exhibition.owner_id = owner and exhibition.deleted_at is null
      group by exhibition.id
      having count(*) >= 5
  ),
  initials as (
    select left(regexp_replace(
        upper(regexp_replace(normalize(translate(coalesce(nullif(btrim(entry.sort_name), ''), entry.name), 'łŁ', 'lL'), NFD),
          '[\u0300-\u036f]', '', 'g')),
        '^[^A-Z0-9]+', ''), 1) as letter
      from public.glossary_entries as entry
      where entry.owner_id = owner
  )
  select exhibit.code, exhibit.value::integer
    from (values
      ('collection', (select count(*) from live)),
      ('eras', (select count(distinct live.era_code) from live)),
      ('prehistory', (select count(*) from live where live.era_code = 'prehistory')),
      ('antiquity', (select count(*) from live where live.era_code = 'antiquity')),
      ('middle_ages', (select count(*) from live where live.era_code = 'middle_ages')),
      ('early_modern', (select count(*) from live where live.era_code = 'early_modern')),
      ('modern', (select count(*) from live where live.era_code = 'modern')),
      ('contemporary', (select count(*) from live where live.era_code = 'contemporary')),
      ('vasari_lives',
        (select count(*)
          from (
            select author.id
              from public.category_values as author
              join public.artwork_values as credited on credited.value_id = author.id
              join live on live.id = credited.artwork_id
              where author.owner_id = owner and author.category_code = 'author'
              group by author.id
              having count(*) >= 10
          ) as prolific)),
      ('memory', (select count(*) from cards where cards.stability >= 7)),
      ('bullseye',
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner and entry.facet = 'date' and entry.year_miss = 0)),
      ('regular',
        (select coalesce(max(event.streak_days), 0) from public.point_events as event
          where event.owner_id = owner and event.kind = 'plan_day')),
      ('back_from_storage', (select count(*) from cards where cards.lapses > 0 and cards.stability >= 7)),
      ('chronicle', (select count(distinct visited.place_id) from visited)),
      ('grand_tour',
        (select count(distinct place.country_code)
          from visited join public.location_details as place on place.value_id = visited.place_id)),
      ('seen_live',
        (select count(distinct seen.artwork_id) from public.visit_artworks as seen where seen.owner_id = owner)),
      ('timeline',
        (select count(*) from public.timeline_events as event where event.owner_id = owner)),
      ('glossary',
        (select count(*) from public.glossary_entries as entry where entry.owner_id = owner)),
      ('hortus_cliffortianus', (select count(*) from described)),
      ('own_eye',
        (select count(*) from public.artwork_images as image
          join live on live.id = image.artwork_id
          where image.own_image_path is not null)),
      ('crystal_palace', (select count(*) from exhibited)),
      ('night_watch',
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner
            and entry.facet = 'recognise'
            and extract(hour from entry.reviewed_at at time zone time_zone) < 4)),
      ('marathon',
        (select coalesce(max(day.answers), 0) from public.free_review_days as day where day.owner_id = owner)),
      ('mouth_of_truth',
        (select count(*) from public.feedback as report where report.owner_id = owner and report.kind = 'idea')),
      ('pinacotheca',
        (select coalesce(max(pinned.pins), 0)
          from (
            select count(*) as pins
              from public.artwork_pins as pin
              join public.artwork_images as image on image.id = pin.image_id
              join live on live.id = image.artwork_id
              group by pin.image_id
          ) as pinned)),
      ('trevi_fountain',
        (select coalesce(max(returns.days), 0)
          from (
            select count(distinct visit.visited_on) as days
              from public.visit_artworks as seen
              join public.visits as visit on visit.id = seen.visit_id
              join live on live.id = seen.artwork_id
              where seen.owner_id = owner
              group by seen.artwork_id
          ) as returns)),
      ('seven_league_boots',
        (select coalesce(max(journeys.places), 0)
          from (
            select count(distinct visit.place_id) as places
              from public.visits as visit
              where visit.owner_id = owner and visit.date_precision = 'day'
              group by visit.visited_on
          ) as journeys)),
      ('figure_alphabet',
        (select count(distinct initials.letter) from initials
          where initials.letter <> '' and strpos('ABCDEFGHIJKLMNOPRSTUWYZ', initials.letter) > 0)),
      ('candle_moths',
        (select count(*) from public.profiles as profile
          where profile.owner_id = owner
            and (extract(hour from profile.night_light_at at time zone time_zone) >= 22
              or extract(hour from profile.night_light_at at time zone time_zone) < 6))),
      ('amateur_magnifier',
        (select count(*) from public.profiles as profile
          where profile.owner_id = owner and profile.long_look_at is not null))
    ) as exhibit (code, value);
$$;

revoke all on function private.exhibit_values(uuid, text) from public;

create function private.unlock_exhibits_for(owner uuid, time_zone text)
returns table (exhibit text, room text, hidden boolean, value integer, thresholds integer[])
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
    with current_values as (
      select catalogue.code, catalogue.room_code, catalogue.hidden, computed.value, catalogue.thresholds,
          room.position as room_position, catalogue.position
        from private.exhibit_values(owner, time_zone) as computed
        join public.exhibits as catalogue on catalogue.code = computed.exhibit
        join public.exhibit_rooms as room on room.code = catalogue.room_code
    ),
    unlocked as (
      insert into public.exhibit_tiers (owner_id, exhibit, tier, tiers)
        select owner, current_values.code, tier.number, cardinality(current_values.thresholds)
          from current_values,
            generate_subscripts(current_values.thresholds, 1) as tier (number)
          where current_values.thresholds[tier.number] <= current_values.value
        on conflict do nothing
    ),
    rewarded as (
      insert into public.point_events (owner_id, kind, code)
        select owner, 'easter_egg', current_values.code
          from current_values
          where current_values.hidden
            and current_values.thresholds[1] <= current_values.value
            and (select count(*) from public.point_events as existing where existing.owner_id = owner) < 50000
        on conflict do nothing
    )
    select current_values.code, current_values.room_code, current_values.hidden, current_values.value,
        current_values.thresholds
      from current_values
      order by current_values.room_position, current_values.position;
end;
$$;

revoke all on function private.unlock_exhibits_for(uuid, text) from public;

create function public.unlock_exhibits(time_zone text)
returns table (exhibit text, room text, hidden boolean, value integer, thresholds integer[])
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
    'artwork_field_entries', 'timeline_events', 'visits', 'visit_artworks', 'exhibitions', 'review_cards',
    'review_log', 'point_events', 'exhibit_tiers', 'free_review_days'
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

  perform private.rebuild_note_links(importer);

  if not had_points and not exists (select 1 from public.point_events where owner_id = importer) then
    perform private.fill_point_events(importer);
  end if;

  return counts;
end;
$$;
