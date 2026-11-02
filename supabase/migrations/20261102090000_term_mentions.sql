create function public.term_mentions(needles text[])
returns table (kind text, id text, record_number integer, title text, notes text)
language sql
stable
security invoker
set search_path = ''
as $$
  with phrases as (
    select distinct regexp_replace(
        regexp_replace(trim(needle), '([.*+?^${}()|\[\]\\])', '\\\1', 'g'),
        '\s+', '\\s+', 'g'
      ) as value
      from unnest(needles) as needle
      where trim(needle) <> ''
  ),
  pattern as (
    select string_agg(phrases.value, '|') as value from phrases
  ),
  found as (
    select 'era' as kind, details.era_code as id, null::integer as record_number, null::text as title, details.notes,
      null::date as visited_on
      from public.era_details as details
    union all
    select 'period', details.value_id::text, null, value.name, details.notes, null
      from public.period_details as details
      join public.category_values as value on value.id = details.value_id
    union all
    select 'style', details.value_id::text, null, value.name, details.notes, null
      from public.style_details as details
      join public.category_values as value on value.id = details.value_id
    union all
    select 'material', details.value_id::text, null, value.name, details.notes, null
      from public.material_details as details
      join public.category_values as value on value.id = details.value_id
    union all
    select 'author', details.value_id::text, null, value.name, details.notes, null
      from public.author_details as details
      join public.category_values as value on value.id = details.value_id
    union all
    select 'location', details.value_id::text, null, value.name, details.notes, null
      from public.location_details as details
      join public.category_values as value on value.id = details.value_id
    union all
    select 'artwork', artwork.id::text, artwork.record_number, artwork.title, artwork.notes, null
      from public.artworks as artwork
      where artwork.deleted_at is null
    union all
    select 'visit', visit.id::text, null,
      place.name || ' · ' || to_char(
        visit.visited_on,
        case visit.date_precision when 'day' then 'DD.MM.YYYY' when 'month' then 'MM.YYYY' else 'YYYY' end
      ),
      visit.notes,
      visit.visited_on
      from public.visits as visit
      join public.category_values as place on place.id = visit.place_id
  )
  select found.kind, found.id, found.record_number, found.title, found.notes
    from found, pattern
    where pattern.value is not null
      and found.notes is not null
      and found.notes collate "und-x-icu" ~* pattern.value
    order by found.kind, found.record_number, found.visited_on desc, found.id;
$$;

revoke all on function public.term_mentions(text[]) from public, anon;
grant execute on function public.term_mentions(text[]) to authenticated;
