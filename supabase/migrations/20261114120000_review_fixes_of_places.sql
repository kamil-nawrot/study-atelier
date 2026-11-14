create or replace function private.place_details_from_alias()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('study_atelier.importing', true), '') = 'on' then
    return null;
  end if;
  if exists (select 1 from public.catalogue_museums as museum where lower(museum.name) = lower(new.name)) then
    return null;
  end if;
  insert into public.location_details (value_id, owner_id, country_code, place_type, catalogue_wikidata_id)
    select new.id, new.owner_id, min(museum.country_code), 'museum', min(museum.wikidata_id)
      from public.catalogue_museums as museum
      where lower(museum.alias) = lower(new.name)
      having count(*) = 1
  on conflict (value_id) do nothing;
  return null;
end;
$$;

create or replace function private.place_city()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  city public.location_details;
begin
  if new.place_type = 'city' then
    new.city_id := null;
  end if;

  if new.city_id is not null then
    select * into city from public.location_details as details where details.value_id = new.city_id;
    if city.value_id is null or city.place_type is distinct from 'city' then
      raise exception 'the city of a place must be a place of the type city'
        using errcode = 'invalid_parameter_value';
    end if;
    new.latitude := null;
    new.longitude := null;
    new.country_code := city.country_code;
  end if;

  if tg_op = 'UPDATE' and old.place_type = 'city' and new.place_type is distinct from 'city'
    and exists (select 1 from public.location_details as place where place.city_id = new.value_id)
  then
    raise exception 'a city with places stays a city'
      using errcode = 'SC002';
  end if;

  return new;
end;
$$;

create or replace function public.atelier_empty()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select not exists (select 1 from public.artworks)
    and not exists (select 1 from public.category_values)
    and not exists (select 1 from public.glossary_entries)
    and not exists (select 1 from public.timeline_events)
    and not exists (select 1 from public.artwork_fields)
    and not exists (select 1 from public.visits)
    and not exists (select 1 from public.exhibitions)
    and not exists (select 1 from public.symbols);
$$;

drop function public.ensure_city_place(text, text, text, double precision, double precision);

create function public.ensure_city_place(
  city_name text,
  wikidata_id text default null,
  country_code text default null,
  latitude double precision default null,
  longitude double precision default null,
  exclude uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  trimmed text := btrim(coalesce(city_name, ''));
  found uuid;
  found_type text;
begin
  if trimmed = '' then
    raise exception 'a city needs a name'
      using errcode = 'invalid_parameter_value';
  end if;

  if ensure_city_place.wikidata_id is not null then
    select details.value_id into found
      from public.location_details as details
      where details.wikidata_id = ensure_city_place.wikidata_id and details.place_type = 'city'
        and details.value_id is distinct from exclude
      order by details.value_id
      limit 1;
    if found is not null then
      return found;
    end if;
  end if;

  select value.id, details.place_type into found, found_type
    from public.category_values as value
    left join public.location_details as details on details.value_id = value.id
    where value.category_code = 'location' and lower(value.name) = lower(trimmed);

  if found is not null and found = exclude then
    raise exception 'a place cannot be its own city'
      using errcode = 'SC004';
  end if;

  if found is null then
    insert into public.category_values (category_code, name)
      values ('location', trimmed)
      on conflict (owner_id, category_code, lower(name)) do nothing
      returning id into found;
    if found is null then
      select value.id into found
        from public.category_values as value
        where value.category_code = 'location' and lower(value.name) = lower(trimmed);
    end if;
    select details.place_type into found_type
      from public.location_details as details
      where details.value_id = found;
  end if;

  if found_type is not null and found_type <> 'city' then
    raise exception 'a place of another type has this name'
      using errcode = 'SC003';
  end if;

  insert into public.location_details as saved (value_id, place_type, country_code, latitude, longitude, wikidata_id)
    values (
      found, 'city', ensure_city_place.country_code, ensure_city_place.latitude, ensure_city_place.longitude,
      ensure_city_place.wikidata_id
    )
  on conflict (value_id) do update
    set place_type = 'city',
      city_id = null,
      country_code = coalesce(saved.country_code, excluded.country_code),
      latitude = case when saved.latitude is null then excluded.latitude else saved.latitude end,
      longitude = case when saved.latitude is null then excluded.longitude else saved.longitude end,
      wikidata_id = coalesce(saved.wikidata_id, excluded.wikidata_id);

  return found;
end;
$$;

revoke all on function public.ensure_city_place(text, text, text, double precision, double precision, uuid)
  from public, anon;
grant execute on function public.ensure_city_place(text, text, text, double precision, double precision, uuid)
  to authenticated;
