create or replace function private.assign_record_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.record_number is not null then
    insert into private.record_counters as counter (owner_id, last_record_number)
    values (new.owner_id, new.record_number)
    on conflict (owner_id)
      do update set last_record_number = greatest(counter.last_record_number, new.record_number);
    return new;
  end if;
  insert into private.record_counters as counter (owner_id, last_record_number)
  values (new.owner_id, 1)
  on conflict (owner_id)
    do update set last_record_number = counter.last_record_number + 1
  returning counter.last_record_number into new.record_number;
  return new;
end;
$$;

create function public.import_atelier(payload jsonb)
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
    'artwork_field_entries', 'timeline_events', 'review_cards', 'review_log'
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

revoke all on function public.import_atelier(jsonb) from public, anon;
grant execute on function public.import_atelier(jsonb) to authenticated;
