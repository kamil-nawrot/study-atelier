create function public.notes_mentions(needle text default null)
returns table (kind text, id text, record_number integer, title text, notes text)
language sql
stable
security invoker
set search_path = ''
as $$
  with pattern as (
    select '%' || replace(replace(replace(needle, '\', '\\'), '%', '\%'), '_', '\_') || '%' as value
  ),
  found as (
    select 'era' as kind, details.era_code as id, null::integer as record_number, null::text as title, details.notes
      from public.era_details as details
    union all
    select 'period', details.value_id::text, null, null, details.notes from public.period_details as details
    union all
    select 'style', details.value_id::text, null, null, details.notes from public.style_details as details
    union all
    select 'material', details.value_id::text, null, null, details.notes from public.material_details as details
    union all
    select 'author', details.value_id::text, null, null, details.notes from public.author_details as details
    union all
    select 'location', details.value_id::text, null, null, details.notes from public.location_details as details
    union all
    select 'artwork', artwork.id::text, artwork.record_number, artwork.title, artwork.notes
      from public.artworks as artwork
      where artwork.deleted_at is null
  )
  select found.kind, found.id, found.record_number, found.title, found.notes
    from found, pattern
    where found.notes is not null and (needle is null or found.notes like pattern.value)
    order by found.kind, found.record_number, found.id;
$$;

revoke all on function public.notes_mentions(text) from public, anon;
grant execute on function public.notes_mentions(text) to authenticated;
