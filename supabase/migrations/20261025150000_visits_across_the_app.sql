drop function public.value_usage();

create function public.value_usage()
returns table (id uuid, category_code text, name text, artwork_count integer, visit_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select value.id, value.category_code, value.name,
    (select count(*) from public.artwork_values as link where link.value_id = value.id)::integer,
    (select count(*) from public.visits as visit where visit.place_id = value.id)::integer
    from public.category_values as value
    order by value.category_code, value.name;
$$;

revoke all on function public.value_usage() from public, anon;
grant execute on function public.value_usage() to authenticated;

create or replace function public.delete_unused_value(target_value uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.category_values as value
    where value.id = target_value
      and not exists (
        select 1 from public.artwork_values as link where link.value_id = value.id
      )
      and not exists (
        select 1 from public.visits as visit where visit.place_id = value.id
      );

  if not found then
    if exists (select 1 from public.category_values as value where value.id = target_value) then
      raise exception 'an artwork or a visit still uses the value'
        using errcode = 'restrict_violation';
    end if;
    raise exception 'category value not found'
      using errcode = 'no_data_found';
  end if;
end;
$$;

create or replace function public.merge_category_values(merged_id uuid, kept_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  merged public.category_values;
  kept public.category_values;
  merged_path text;
  kept_path text;
begin
  select * into merged from public.category_values as value where value.id = merged_id;
  select * into kept from public.category_values as value where value.id = kept_id;

  if merged.id is null or kept.id is null then
    raise exception 'category value not found'
      using errcode = 'no_data_found';
  end if;

  if merged.id = kept.id or merged.category_code <> kept.category_code then
    raise exception 'only two different values of one category can be merged'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.artwork_values as link
    set value_id = kept_id
    where link.value_id = merged_id
      and not exists (
        select 1 from public.artwork_values as other
          where other.artwork_id = link.artwork_id and other.value_id = kept_id
      );

  update public.visits as visit
    set place_id = kept_id
    where visit.place_id = merged_id;

  insert into public.period_eras (value_id, era_code)
    select kept_id, period_era.era_code
      from public.period_eras as period_era
      where period_era.value_id = merged_id
    on conflict do nothing;

  insert into public.style_periods (style_id, period_id)
    select kept_id, style_period.period_id
      from public.style_periods as style_period
      where style_period.style_id = merged_id
    on conflict do nothing;

  insert into public.style_periods (style_id, period_id)
    select style_period.style_id, kept_id
      from public.style_periods as style_period
      where style_period.period_id = merged_id
    on conflict do nothing;

  merged_path := '/atelier/values/' || merged.category_code || '/' || merged_id::text;
  kept_path := '/atelier/values/' || kept.category_code || '/' || kept_id::text;

  update public.artworks as artwork
    set notes = replace(artwork.notes, merged_path, kept_path)
    where position(merged_path in artwork.notes) > 0;
  update public.period_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;
  update public.style_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;
  update public.material_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;
  update public.author_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;
  update public.location_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;
  update public.visits as visit
    set notes = replace(visit.notes, merged_path, kept_path)
    where position(merged_path in visit.notes) > 0;

  delete from public.category_values as value where value.id = merged_id;
end;
$$;

create or replace function public.notes_mentions(needle text default null)
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
    union all
    select 'visit', visit.id::text, null,
      place.name || ' · ' || to_char(
        visit.visited_on,
        case visit.date_precision when 'day' then 'DD.MM.YYYY' when 'month' then 'MM.YYYY' else 'YYYY' end
      ),
      visit.notes
      from public.visits as visit
      join public.category_values as place on place.id = visit.place_id
  )
  select found.kind, found.id, found.record_number, found.title, found.notes
    from found, pattern
    where found.notes is not null and (needle is null or found.notes like pattern.value)
    order by found.kind, found.record_number, found.id;
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
    'artwork_field_entries', 'timeline_events', 'visits', 'visit_artworks', 'review_cards', 'review_log'
  ];
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

  foreach table_name in array tables loop
    rows := coalesce(payload -> table_name, '[]');
    if jsonb_typeof(rows) <> 'array' then
      raise exception using errcode = '22023', message = format('%s is not a list', table_name);
    end if;
    if jsonb_array_length(rows) = 0 then
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

  return counts;
end;
$$;
