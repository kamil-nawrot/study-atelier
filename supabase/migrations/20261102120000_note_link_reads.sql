create function public.note_link_mentions(
  artwork_number integer default null, value_id uuid default null, era_code text default null
)
returns table (kind text, id text, record_number integer, title text)
language sql
stable
security invoker
set search_path = ''
as $$
  with links as (
    select link.source_artwork_id, link.source_value_id, link.source_era_code, link.source_visit_id
      from public.note_links as link
      join public.artworks as target on target.id = link.target_artwork_id
      where target.record_number = note_link_mentions.artwork_number
    union all
    select link.source_artwork_id, link.source_value_id, link.source_era_code, link.source_visit_id
      from public.note_links as link
      where link.target_value_id = note_link_mentions.value_id
    union all
    select link.source_artwork_id, link.source_value_id, link.source_era_code, link.source_visit_id
      from public.note_links as link
      where link.target_era_code = note_link_mentions.era_code
  ),
  found as (
    select 'artwork' as kind, artwork.id::text as id, artwork.record_number, artwork.title, null::date as visited_on
      from links
      join public.artworks as artwork on artwork.id = links.source_artwork_id
      where artwork.deleted_at is null
    union all
    select value.category_code, value.id::text, null, value.name, null
      from links
      join public.category_values as value on value.id = links.source_value_id
    union all
    select 'era', links.source_era_code, null, null, null
      from links
      where links.source_era_code is not null
    union all
    select 'visit', visit.id::text, null,
      place.name || ' · ' || to_char(
        visit.visited_on,
        case visit.date_precision when 'day' then 'DD.MM.YYYY' when 'month' then 'MM.YYYY' else 'YYYY' end
      ),
      visit.visited_on
      from links
      join public.visits as visit on visit.id = links.source_visit_id
      join public.category_values as place on place.id = visit.place_id
  )
  select found.kind, found.id, found.record_number, found.title
    from found
    order by found.kind, found.record_number, found.visited_on desc, found.id;
$$;

revoke all on function public.note_link_mentions(integer, uuid, text) from public, anon;
grant execute on function public.note_link_mentions(integer, uuid, text) to authenticated;

create function public.note_link_labels(
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
    where links.target_era_code is not null;
$$;

revoke all on function public.note_link_labels(integer, uuid, text, uuid) from public, anon;
grant execute on function public.note_link_labels(integer, uuid, text, uuid) to authenticated;
