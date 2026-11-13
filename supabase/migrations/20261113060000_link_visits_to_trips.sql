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
  linked_trip uuid;
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

  linked_trip := case when entry_kind = 'visit' then input.trip_id end;

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
    insert into public.visits (kind, place_id, visited_on, date_precision, ends_on, trip_id, notes)
      values (entry_kind, saved_place, input.visited_on, input.date_precision, end_date, linked_trip, input.notes)
      returning id into saved_id;
  else
    update public.visits as saved
      set place_id = saved_place,
        visited_on = input.visited_on,
        date_precision = input.date_precision,
        ends_on = end_date,
        trip_id = linked_trip,
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
