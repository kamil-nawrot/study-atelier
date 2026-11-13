alter table public.location_details
  add column city_id uuid,
  add constraint location_details_city_fkey foreign key (city_id, owner_id, category_code)
    references public.category_values (id, owner_id, category_code) on delete set null (city_id),
  add constraint location_details_city_check check (
    city_id is null
    or (city_id <> value_id and latitude is null and longitude is null and place_type is distinct from 'city')
  );

create index location_details_city_id_idx on public.location_details (city_id);

grant insert (city_id) on public.location_details to authenticated;
grant update (city_id) on public.location_details to authenticated;

create function private.place_city()
returns trigger
language plpgsql
security definer
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

revoke all on function private.place_city() from public;

create trigger location_details_place_city
  before insert or update on public.location_details
  for each row execute function private.place_city();

create function private.city_country_to_places()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.location_details as place
    set country_code = new.country_code
    where place.city_id = new.value_id
      and place.country_code is distinct from new.country_code;
  return null;
end;
$$;

revoke all on function private.city_country_to_places() from public;

create trigger location_details_city_country
  after update of country_code on public.location_details
  for each row when (new.place_type = 'city' and old.country_code is distinct from new.country_code)
  execute function private.city_country_to_places();

create function public.ensure_city_place(
  city_name text,
  wikidata_id text default null,
  country_code text default null,
  latitude double precision default null,
  longitude double precision default null
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

  if found is null then
    insert into public.category_values (category_code, name)
      values ('location', trimmed)
      returning id into found;
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

revoke all on function public.ensure_city_place(text, text, text, double precision, double precision) from public, anon;
grant execute on function public.ensure_city_place(text, text, text, double precision, double precision) to authenticated;

create or replace function public.set_place_point(
  place uuid,
  latitude double precision,
  longitude double precision,
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

create or replace function public.save_value_details(target_value uuid, details jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  kind text;
  new_summary text := nullif(btrim(details ->> 'summary'), '');
  new_notes text := nullif(details ->> 'notes', '');
  author public.author_details;
  place public.location_details;
begin
  if jsonb_typeof(details) is distinct from 'object' then
    raise exception 'details must be an object'
      using errcode = 'invalid_parameter_value';
  end if;

  if details ? 'relations' and jsonb_typeof(details -> 'relations') is distinct from 'array' then
    raise exception 'relations must be an array of relations'
      using errcode = 'invalid_parameter_value';
  end if;

  select value.category_code into kind
    from public.category_values as value
    where value.id = target_value;

  if kind is null then
    raise exception 'category value not found'
      using errcode = 'no_data_found';
  end if;

  if kind = 'period' then
    insert into public.period_details as saved (value_id, summary, notes)
      values (target_value, new_summary, new_notes)
    on conflict (value_id) do update
      set summary = case when details ? 'summary' then excluded.summary else saved.summary end,
        notes = case when details ? 'notes' then excluded.notes else saved.notes end;
  elsif kind = 'style' then
    insert into public.style_details as saved (value_id, summary, notes)
      values (target_value, new_summary, new_notes)
    on conflict (value_id) do update
      set summary = case when details ? 'summary' then excluded.summary else saved.summary end,
        notes = case when details ? 'notes' then excluded.notes else saved.notes end;
  elsif kind = 'material' then
    insert into public.material_details as saved (value_id, summary, notes)
      values (target_value, new_summary, new_notes)
    on conflict (value_id) do update
      set summary = case when details ? 'summary' then excluded.summary else saved.summary end,
        notes = case when details ? 'notes' then excluded.notes else saved.notes end;
  elsif kind = 'author' then
    author := jsonb_populate_record(null::public.author_details, details);
    insert into public.author_details as saved (
      value_id, summary, notes, birth_year, death_year, years_approximate, sort_name, country,
      source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
      source_image_attribution, own_image_path, own_image_url, image_width, image_height
    )
      values (
        target_value, new_summary, new_notes, author.birth_year, author.death_year,
        coalesce(author.years_approximate, false), nullif(btrim(author.sort_name), ''),
        author.country,
        author.source_wikidata_id, author.source_image_file, author.source_image_licence,
        author.source_image_licence_url, author.source_image_attribution, author.own_image_path,
        author.own_image_url, author.image_width, author.image_height
      )
    on conflict (value_id) do update
      set summary = case when details ? 'summary' then excluded.summary else saved.summary end,
        notes = case when details ? 'notes' then excluded.notes else saved.notes end,
        birth_year = case when details ? 'birth_year' then excluded.birth_year else saved.birth_year end,
        death_year = case when details ? 'death_year' then excluded.death_year else saved.death_year end,
        years_approximate = case
          when details ? 'years_approximate' then excluded.years_approximate
          else saved.years_approximate
        end,
        sort_name = case when details ? 'sort_name' then excluded.sort_name else saved.sort_name end,
        country = case
          when details ? 'country' then excluded.country
          else saved.country
        end,
        source_wikidata_id = case
          when details ? 'source_wikidata_id' then excluded.source_wikidata_id
          else saved.source_wikidata_id
        end,
        source_image_file = case
          when details ? 'source_image_file' then excluded.source_image_file
          else saved.source_image_file
        end,
        source_image_licence = case
          when details ? 'source_image_licence' then excluded.source_image_licence
          else saved.source_image_licence
        end,
        source_image_licence_url = case
          when details ? 'source_image_licence_url' then excluded.source_image_licence_url
          else saved.source_image_licence_url
        end,
        source_image_attribution = case
          when details ? 'source_image_attribution' then excluded.source_image_attribution
          else saved.source_image_attribution
        end,
        own_image_path = case
          when details ? 'own_image_path' then excluded.own_image_path
          else saved.own_image_path
        end,
        own_image_url = case
          when details ? 'own_image_url' then excluded.own_image_url
          else saved.own_image_url
        end,
        image_width = case when details ? 'image_width' then excluded.image_width else saved.image_width end,
        image_height = case
          when details ? 'image_height' then excluded.image_height
          else saved.image_height
        end;
  elsif kind = 'location' then
    place := jsonb_populate_record(null::public.location_details, details);
    insert into public.location_details as saved (value_id, summary, notes, country_code, place_type, city_id)
      values (target_value, new_summary, new_notes, place.country_code, place.place_type, place.city_id)
    on conflict (value_id) do update
      set summary = case when details ? 'summary' then excluded.summary else saved.summary end,
        notes = case when details ? 'notes' then excluded.notes else saved.notes end,
        country_code = case
          when details ? 'country_code' then excluded.country_code
          else saved.country_code
        end,
        place_type = case when details ? 'place_type' then excluded.place_type else saved.place_type end,
        city_id = case when details ? 'city_id' then excluded.city_id else saved.city_id end,
        latitude = case
          when details ? 'city_id' and excluded.city_id is not null then null
          else saved.latitude
        end,
        longitude = case
          when details ? 'city_id' and excluded.city_id is not null then null
          else saved.longitude
        end;
  end if;

  if kind = 'author' and details ? 'relations' then
    delete from public.author_relations as stored
      where target_value in (stored.from_id, stored.to_id);

    insert into public.author_relations (from_id, to_id, kind)
      select
        case
          when item.kind in ('collaboration', 'family', 'related') then least(target_value, item.author_id)
          when item.side = 'from' then target_value
          else item.author_id
        end,
        case
          when item.kind in ('collaboration', 'family', 'related') then greatest(target_value, item.author_id)
          when item.side = 'from' then item.author_id
          else target_value
        end,
        item.kind
        from jsonb_to_recordset(details -> 'relations') as item(kind text, side text, author_id uuid)
      on conflict ((least(from_id, to_id)), (greatest(from_id, to_id))) do nothing;
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

  if merged.category_code = 'location' then
    if exists (select 1 from public.location_details as place where place.city_id = merged_id)
      and not exists (
        select 1 from public.location_details as details
          where details.value_id = kept_id and details.place_type = 'city'
      )
    then
      raise exception 'a city with places can be merged only into another city'
        using errcode = 'SC001';
    end if;

    update public.location_details as place
      set city_id = kept_id
      where place.city_id = merged_id;
  end if;

  update public.visits as visit
    set place_id = kept_id
    where visit.place_id = merged_id;

  update public.symbol_meaning_contexts as label
    set value_id = kept_id
    where label.value_id = merged_id
      and not exists (
        select 1 from public.symbol_meaning_contexts as other
          where other.meaning_id = label.meaning_id and other.value_id = kept_id
      );

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

  if merged.category_code = 'author' then
    insert into public.author_relations (from_id, to_id, kind)
      select
        case
          when relation.kind in ('collaboration', 'family', 'related') then least(moved.from_id, moved.to_id)
          else moved.from_id
        end,
        case
          when relation.kind in ('collaboration', 'family', 'related') then greatest(moved.from_id, moved.to_id)
          else moved.to_id
        end,
        relation.kind
        from public.author_relations as relation
        cross join lateral (
          select
            case when relation.from_id = merged_id then kept_id else relation.from_id end as from_id,
            case when relation.to_id = merged_id then kept_id else relation.to_id end as to_id
        ) as moved
        where merged_id in (relation.from_id, relation.to_id)
          and moved.from_id <> moved.to_id
      on conflict ((least(from_id, to_id)), (greatest(from_id, to_id))) do nothing;
  end if;

  merged_path := '/atelier/values/' || merged.category_code || '/' || merged_id::text;
  kept_path := '/atelier/values/' || kept.category_code || '/' || kept_id::text;

  update public.artworks as artwork
    set notes = regexp_replace(artwork.notes, merged_path, kept_path, 'gi')
    where artwork.notes ~* merged_path;
  update public.period_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.style_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.material_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.author_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.location_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.era_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.visits as visit
    set notes = regexp_replace(visit.notes, merged_path, kept_path, 'gi')
    where visit.notes ~* merged_path;

  insert into public.location_details (value_id, city_id)
    select kept.id, details.city_id
      from public.location_details as details
      where details.value_id = merged_id and details.city_id is not null and details.city_id <> kept_id
    on conflict (value_id) do update
      set city_id = excluded.city_id
      where public.location_details.city_id is null
        and public.location_details.latitude is null
        and public.location_details.place_type is distinct from 'city';

  insert into public.location_details (value_id, latitude, longitude, wikidata_id)
    select kept.id, details.latitude, details.longitude, details.wikidata_id
      from public.location_details as details
      where details.value_id = merged_id and details.latitude is not null
    on conflict (value_id) do update
      set latitude = excluded.latitude,
        longitude = excluded.longitude,
        wikidata_id = excluded.wikidata_id
      where public.location_details.latitude is null and public.location_details.city_id is null;

  delete from public.category_values as value where value.id = merged_id;
end;
$$;

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
      )
      and not exists (
        select 1 from public.location_details as place where place.city_id = value.id
      );

  if not found then
    if exists (select 1 from public.category_values as value where value.id = target_value) then
      raise exception 'an artwork, a visit or a place still uses the value'
        using errcode = 'restrict_violation';
    end if;
    raise exception 'category value not found'
      using errcode = 'no_data_found';
  end if;
end;
$$;

create or replace function public.card_index()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'values', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
          'id', value.id,
          'category_code', value.category_code,
          'name', value.name,
          'artwork_count', (select count(*) from public.artwork_values as link where link.value_id = value.id),
          'visit_count', (select count(*) from public.visits as visit where visit.place_id = value.id),
          'sort_name', author.sort_name,
          'birth_year', author.birth_year,
          'country_code', place.country_code,
          'place_type', place.place_type,
          'city_id', place.city_id
        )) order by value.category_code, value.name)
        from public.category_values as value
        left join public.author_details as author on author.value_id = value.id
        left join public.location_details as place on place.value_id = value.id
    ), '[]'::jsonb),
    'period_eras', coalesce((
      select jsonb_agg(jsonb_build_object(
          'period_id', usage.period_id, 'era_code', usage.era_code, 'artwork_count', usage.artwork_count
        ) order by usage.period_id, usage.era_code)
        from public.period_era_usage() as usage
    ), '[]'::jsonb),
    'style_periods', coalesce((
      select jsonb_agg(jsonb_build_object(
          'style_id', usage.style_id, 'period_id', usage.period_id, 'artwork_count', usage.artwork_count
        ) order by usage.style_id, usage.period_id)
        from public.style_period_usage() as usage
    ), '[]'::jsonb)
  );
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
    'artworks', 'artwork_images', 'glossary_entries', 'symbols', 'symbol_meanings', 'artwork_pins',
    'artwork_fields',
    'category_values', 'artwork_values', 'period_eras', 'style_periods', 'author_details',
    'period_details', 'style_details', 'material_details', 'location_details', 'era_details',
    'artwork_relations', 'author_relations',
    'artwork_field_entries', 'symbol_meaning_contexts', 'timeline_events', 'visits', 'visit_artworks', 'exhibitions', 'review_cards',
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
    or exists (select 1 from public.symbols where owner_id = importer)
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
    if table_name = 'location_details' then
      rows := (select jsonb_agg(place.value - 'city_id') from jsonb_array_elements(rows) as place);
    end if;
    if table_name in ('artwork_relations', 'author_relations') then
      rows := (select jsonb_agg(
          case
            when relation.value ->> 'kind' in ('version', 'related', 'collaboration', 'family')
              and (relation.value ->> 'from_id')::uuid > (relation.value ->> 'to_id')::uuid
            then relation.value
              || jsonb_build_object('from_id', relation.value -> 'to_id', 'to_id', relation.value -> 'from_id')
            else relation.value
          end)
        from jsonb_array_elements(rows) as relation);
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

  update public.location_details as details
    set city_id = (place.value ->> 'city_id')::uuid
    from jsonb_array_elements(coalesce(payload -> 'location_details', '[]')) as place
    where details.value_id = (place.value ->> 'value_id')::uuid
      and details.owner_id = importer
      and place.value ->> 'city_id' is not null;

  perform set_config('study_atelier.importing', '', true);

  perform private.rebuild_note_links(importer);

  if not had_points and not exists (select 1 from public.point_events where owner_id = importer) then
    perform private.fill_point_events(importer);
  end if;

  return counts;
end;
$$;
