alter table public.visits
  add column kind text not null default 'visit' check (kind in ('visit', 'trip')),
  add column ends_on date,
  add column trip_id uuid,
  add constraint visits_ends_on_check
    check (ends_on is null or (kind = 'trip' and date_precision = 'day' and ends_on > visited_on)),
  add constraint visits_trip_id_check check (trip_id is null or kind = 'visit'),
  add constraint visits_trip_id_owner_id_fkey
    foreign key (trip_id, owner_id) references public.visits (id, owner_id) on delete set null (trip_id);

create index visits_trip_id_idx on public.visits (trip_id);

grant insert (kind, ends_on, trip_id) on public.visits to authenticated;
grant update (ends_on, trip_id) on public.visits to authenticated;

create function private.check_visit_trip()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.trip_id is not null and not exists (
    select 1 from public.visits as trip where trip.id = new.trip_id and trip.kind = 'trip'
  ) then
    raise exception 'a visit can only be part of a trip'
      using errcode = 'foreign_key_violation';
  end if;
  return null;
end;
$$;

revoke all on function private.check_visit_trip() from public;

create trigger visits_check_trip
  after insert or update of trip_id on public.visits
  for each row execute function private.check_visit_trip();

alter table public.location_details
  drop constraint location_details_place_type_check,
  add constraint location_details_place_type_check
    check (place_type in ('museum', 'gallery', 'private_collection', 'on_site', 'city'));

create or replace function public.save_visit(
  visit jsonb,
  place text,
  artwork_ids uuid[],
  existing_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  input public.visits := jsonb_populate_record(null::public.visits, visit);
  place_name text := btrim(coalesce(place, ''));
  wanted uuid[] := coalesce(artwork_ids, '{}');
  entry_kind text;
  end_date date;
  saved_place uuid;
  saved_id uuid;
begin
  if place_name = '' then
    raise exception 'a visit needs a place'
      using errcode = 'not_null_violation';
  end if;

  if existing_id is null then
    entry_kind := coalesce(input.kind, 'visit');
  else
    select saved.kind into entry_kind from public.visits as saved where saved.id = existing_id;
    if entry_kind is null then
      raise exception 'visit not found'
        using errcode = 'no_data_found';
    end if;
  end if;

  end_date := case
    when entry_kind = 'trip' and input.ends_on is distinct from input.visited_on then input.ends_on
  end;

  if entry_kind = 'trip' then
    with created as (
      insert into public.category_values (category_code, name)
        values ('location', place_name)
        on conflict (owner_id, category_code, lower(name)) do nothing
        returning id
    )
    insert into public.location_details (value_id, place_type)
      select created.id, 'city' from created;
  else
    with created as (
      insert into public.category_values (category_code, name)
        values ('location', place_name)
        on conflict (owner_id, category_code, lower(name)) do nothing
        returning id, name
    )
    insert into public.location_details (value_id, country_code, place_type, catalogue_wikidata_id)
      select created.id, museum.country_code, 'museum', museum.wikidata_id
        from created
        join public.catalogue_museums as museum on lower(museum.name) = lower(created.name);
  end if;

  select value.id into saved_place
    from public.category_values as value
    where value.owner_id = (select auth.uid())
      and value.category_code = 'location'
      and lower(value.name) = lower(place_name);

  if entry_kind = 'trip' and not exists (
    select 1 from public.location_details as details
      where details.value_id = saved_place and details.place_type = 'city'
  ) then
    raise exception 'a trip needs a city'
      using errcode = 'invalid_parameter_value';
  end if;

  if existing_id is null then
    insert into public.visits (kind, place_id, visited_on, date_precision, ends_on, notes)
      values (entry_kind, saved_place, input.visited_on, input.date_precision, end_date, input.notes)
      returning id into saved_id;
  else
    update public.visits as saved
      set place_id = saved_place,
        visited_on = input.visited_on,
        date_precision = input.date_precision,
        ends_on = end_date,
        notes = input.notes
      where saved.id = existing_id
      returning saved.id into saved_id;

    delete from public.visit_artworks as seen
      where seen.visit_id = saved_id and not (seen.artwork_id = any (wanted));
  end if;

  insert into public.visit_artworks (visit_id, artwork_id)
    select saved_id, wanted_artwork from unnest(wanted) as wanted_artwork
    on conflict do nothing;

  return saved_id;
end;
$$;

create or replace function private.exhibit_values(owner uuid, time_zone text)
returns table (exhibit text, value integer)
language sql
stable
security definer
set search_path = ''
as $$
  with live as (
    select artwork.id, artwork.era_code, artwork.type_code
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
  storied as (
    select count(distinct live.era_code) as eras
      from public.exhibitions as exhibition
      join public.exhibition_artworks as placed on placed.exhibition_id = exhibition.id
      join live on live.id = placed.artwork_id
      where exhibition.owner_id = owner and exhibition.deleted_at is null
      group by exhibition.id
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
      ('boncompagni_academy',
        (select count(distinct live.type_code) from live where live.type_code <> 'other')),
      ('vault_cobweb',
        (select count(*)
          from public.artwork_relations as relation
          join live as source on source.id = relation.from_id
          join live as target on target.id = relation.to_id
          where relation.owner_id = owner)
        + (select count(*) from public.author_relations as relation where relation.owner_id = owner)),
      ('van_eyck_easel',
        (select count(*)
          from (
            select 1
              from public.author_relations as taught
              join public.author_relations as passed_on
                on passed_on.owner_id = taught.owner_id and passed_on.to_id = taught.from_id
              where taught.owner_id = owner and taught.kind = 'pupil' and passed_on.kind = 'pupil'
                and passed_on.from_id <> taught.to_id
              limit 1
          ) as chain)),
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
      ('laurel_skull',
        (select count(distinct pin.symbol_id)
          from public.artwork_pins as pin
          join public.artwork_images as image on image.id = pin.image_id
          join live on live.id = image.artwork_id
          where pin.symbol_id is not null)),
      ('hortus_cliffortianus', (select count(*) from described)),
      ('own_eye',
        (select count(*) from public.artwork_images as image
          join live on live.id = image.artwork_id
          where image.own_image_path is not null)),
      ('crystal_palace', (select count(*) from exhibited)),
      ('lenoir_chapel', (select coalesce(max(storied.eras), 0) from storied)),
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
            select count(distinct (visit.visited_on, visit.date_precision)) as days
              from public.visit_artworks as seen
              join public.visits as visit on visit.id = seen.visit_id
              join live on live.id = seen.artwork_id
              where seen.owner_id = owner
              group by seen.artwork_id
          ) as returns)),
      ('pilgrim_shell',
        (select count(*) from public.point_events as event where event.owner_id = owner and event.kind = 'wish_seen')),
      ('seven_league_boots',
        (select coalesce(max(journeys.places), 0)
          from (
            select count(distinct visit.place_id) as places
              from public.visits as visit
              where visit.owner_id = owner and visit.kind = 'visit' and visit.date_precision = 'day'
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
