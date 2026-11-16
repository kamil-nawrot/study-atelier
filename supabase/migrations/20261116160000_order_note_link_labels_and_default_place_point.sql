create or replace function public.note_link_labels(
  artwork_number integer default null, value_id uuid default null, era_code text default null,
  visit_id uuid default null
)
returns table (kind text, id text, record_number integer, title text)
language sql
stable
security invoker
set search_path = ''
as $$
  with links as (
    select link.target_artwork_id, link.target_value_id, link.target_era_code
      from public.note_links as link
      join public.artworks as source on source.id = link.source_artwork_id
      where source.record_number = note_link_labels.artwork_number
    union all
    select link.target_artwork_id, link.target_value_id, link.target_era_code
      from public.note_links as link
      where link.source_value_id = note_link_labels.value_id
    union all
    select link.target_artwork_id, link.target_value_id, link.target_era_code
      from public.note_links as link
      where link.source_era_code = note_link_labels.era_code
    union all
    select link.target_artwork_id, link.target_value_id, link.target_era_code
      from public.note_links as link
      where link.source_visit_id = note_link_labels.visit_id
  )
  select 'artwork', artwork.id::text, artwork.record_number, artwork.title
    from links
    join public.artworks as artwork on artwork.id = links.target_artwork_id
    where artwork.deleted_at is null
  union all
  select value.category_code, value.id::text, null, value.name
    from links
    join public.category_values as value on value.id = links.target_value_id
  union all
  select 'era', links.target_era_code, null, null
    from links
    where links.target_era_code is not null
  order by 1, 3, 2, 4;
$$;

create or replace function public.set_place_point(
  place uuid,
  latitude double precision default null,
  longitude double precision default null,
  wikidata_id text default null
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.location_details (value_id, latitude, longitude, wikidata_id)
    select value.id, set_place_point.latitude, set_place_point.longitude, set_place_point.wikidata_id
      from public.category_values as value
      where value.id = place and value.category_code = 'location'
  on conflict (value_id) do update
    set latitude = excluded.latitude,
      longitude = excluded.longitude,
      wikidata_id = excluded.wikidata_id,
      city_id = null;
$$;
