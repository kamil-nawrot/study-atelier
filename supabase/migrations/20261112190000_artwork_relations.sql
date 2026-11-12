create table public.artwork_relations (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_id uuid not null,
  to_id uuid not null,
  kind text not null check (kind in ('study', 'copy', 'version', 'part', 'reference', 'related')),
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  foreign key (from_id, owner_id) references public.artworks (id, owner_id) on delete cascade,
  foreign key (to_id, owner_id) references public.artworks (id, owner_id) on delete cascade,
  check (from_id <> to_id),
  check (kind not in ('version', 'related') or from_id < to_id)
);

create unique index artwork_relations_pair_key
  on public.artwork_relations (least(from_id, to_id), greatest(from_id, to_id));
create index artwork_relations_to_id_idx on public.artwork_relations (to_id);
create index artwork_relations_owner_id_idx on public.artwork_relations (owner_id);

create trigger artwork_relations_limit_rows
  after insert on public.artwork_relations
  referencing new table as added
  for each statement execute function private.limit_rows('10000');

create table public.author_relations (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_id uuid not null,
  to_id uuid not null,
  category_code text not null default 'author' check (category_code = 'author'),
  kind text not null check (kind in ('pupil', 'influence', 'collaboration', 'family', 'related')),
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  foreign key (from_id, owner_id, category_code)
    references public.category_values (id, owner_id, category_code) on delete cascade,
  foreign key (to_id, owner_id, category_code)
    references public.category_values (id, owner_id, category_code) on delete cascade,
  check (from_id <> to_id),
  check (kind not in ('collaboration', 'family', 'related') or from_id < to_id)
);

create unique index author_relations_pair_key
  on public.author_relations (least(from_id, to_id), greatest(from_id, to_id));
create index author_relations_to_id_idx on public.author_relations (to_id);
create index author_relations_owner_id_idx on public.author_relations (owner_id);

create trigger author_relations_limit_rows
  after insert on public.author_relations
  referencing new table as added
  for each statement execute function private.limit_rows('10000');

alter table public.artwork_relations enable row level security;
alter table public.author_relations enable row level security;

create policy "Owners manage the relations of their artworks"
  on public.artwork_relations for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage the relations of their authors"
  on public.author_relations for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.artwork_relations, public.author_relations from anon, authenticated;

grant select, insert (from_id, to_id, kind), delete
  on public.artwork_relations, public.author_relations to authenticated;

drop function public.save_artwork(jsonb, jsonb, uuid, jsonb, jsonb);

create function public.save_artwork(
  artwork jsonb,
  values_by_category jsonb,
  existing_id uuid default null,
  images jsonb default null,
  field_entries jsonb default null,
  relations jsonb default null
)
returns table (id uuid, record_number integer)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  input public.artworks := jsonb_populate_record(null::public.artworks, artwork);
  saved public.artworks;
  author_count integer;
  item record;
  image public.artwork_images;
begin
  if images is not null and jsonb_typeof(images) is distinct from 'array' then
    raise exception 'images must be an array of images'
      using errcode = 'invalid_parameter_value';
  end if;

  if jsonb_array_length(coalesce(images, '[]'::jsonb)) > 5 then
    raise exception 'an artwork has at most five images'
      using errcode = 'check_violation';
  end if;

  if jsonb_typeof(values_by_category) is distinct from 'object' then
    raise exception 'values_by_category must be an object of name arrays'
      using errcode = 'invalid_parameter_value';
  end if;

  if relations is not null and jsonb_typeof(relations) is distinct from 'array' then
    raise exception 'relations must be an array of relations'
      using errcode = 'invalid_parameter_value';
  end if;

  if field_entries is not null and jsonb_typeof(field_entries) is distinct from 'object' then
    raise exception 'field_entries must be an object of field values'
      using errcode = 'invalid_parameter_value';
  end if;

  values_by_category := (
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
      from jsonb_each(values_by_category) as entry
      join public.categories as category on category.code = entry.key
  );

  select count(*)
    into author_count
    from jsonb_array_elements_text(coalesce(values_by_category -> 'author', '[]'::jsonb)) as item(name)
    where btrim(item.name) <> '';

  if coalesce(input.author_unknown, false) = (author_count > 0) then
    raise exception 'an artwork has authors or an unknown author, not both or neither'
      using errcode = 'check_violation';
  end if;

  if existing_id is null then
    insert into public.artworks (
      title, author_unknown, year_from, year_to, year_approximate, type_code, era_code, notes
    )
    values (
      btrim(input.title), coalesce(input.author_unknown, false), input.year_from, input.year_to,
      coalesce(input.year_approximate, false), input.type_code, input.era_code, input.notes
    )
    returning * into saved;
  else
    update public.artworks
      set title = btrim(input.title),
        author_unknown = coalesce(input.author_unknown, false),
        year_from = input.year_from,
        year_to = input.year_to,
        year_approximate = coalesce(input.year_approximate, false),
        type_code = input.type_code,
        era_code = input.era_code,
        notes = input.notes
      where public.artworks.id = existing_id
      returning * into saved;

    if saved.id is null then
      raise exception 'artwork % not found', existing_id
        using errcode = 'no_data_found';
    end if;

    delete from public.artwork_values as link
      using public.category_values as value
      where link.artwork_id = saved.id
        and value.id = link.value_id
        and value.category_code in (select jsonb_object_keys(values_by_category));
  end if;

  with created as (
    insert into public.category_values (category_code, name)
      select entry.key, btrim(item.name)
        from jsonb_each(values_by_category) as entry
        cross join jsonb_array_elements_text(entry.value) as item(name)
        where btrim(item.name) <> ''
      on conflict (owner_id, category_code, lower(name)) do nothing
      returning id, category_code, name
  )
  insert into public.location_details (value_id, country_code, place_type, catalogue_wikidata_id)
    select created.id, museum.country_code, 'museum', museum.wikidata_id
      from created
      join public.catalogue_museums as museum on lower(museum.name) = lower(created.name)
      where created.category_code = 'location';

  insert into public.artwork_values (artwork_id, value_id, position)
    select saved.id, value.id, (min(item.position) - 1)::smallint
      from jsonb_each(values_by_category) as entry
      cross join jsonb_array_elements_text(entry.value) with ordinality as item(name, position)
      join public.category_values as value
        on value.owner_id = saved.owner_id
        and value.category_code = entry.key
        and lower(value.name) = lower(btrim(item.name))
      group by value.id;

  if saved.era_code is not null then
    insert into public.period_eras (value_id, era_code)
      select period_value.id, saved.era_code
        from public.artwork_values as period_link
        join public.category_values as period_value on period_value.id = period_link.value_id
        where period_link.artwork_id = saved.id and period_value.category_code = 'period'
      on conflict do nothing;
  end if;

  insert into public.style_periods (style_id, period_id)
    select style_value.id, period_value.id
      from public.artwork_values as style_link
      join public.category_values as style_value
        on style_value.id = style_link.value_id and style_value.category_code = 'style'
      join public.artwork_values as period_link on period_link.artwork_id = style_link.artwork_id
      join public.category_values as period_value
        on period_value.id = period_link.value_id and period_value.category_code = 'period'
      where style_link.artwork_id = saved.id
    on conflict do nothing;

  if images is not null then
    delete from public.artwork_images as stored
      where stored.artwork_id = saved.id
        and stored.id not in (
          select (entry.value ->> 'id')::uuid
            from jsonb_array_elements(images) as entry(value)
            where entry.value ->> 'id' is not null
        );

    for item in
      select entry.value, (entry.position - 1)::smallint as position
        from jsonb_array_elements(images) with ordinality as entry(value, position)
    loop
      image := jsonb_populate_record(null::public.artwork_images, item.value);

      if image.id is null then
        insert into public.artwork_images (
          artwork_id, position, source_wikidata_id, source_image_file, source_image_licence,
          source_image_licence_url, source_image_attribution, own_image_path, own_image_url,
          image_width, image_height
        )
        values (
          saved.id, item.position, image.source_wikidata_id, image.source_image_file,
          image.source_image_licence, image.source_image_licence_url, image.source_image_attribution,
          image.own_image_path, image.own_image_url, image.image_width, image.image_height
        );
      else
        update public.artwork_images as stored
          set position = item.position,
            source_wikidata_id = image.source_wikidata_id,
            source_image_file = image.source_image_file,
            source_image_licence = image.source_image_licence,
            source_image_licence_url = image.source_image_licence_url,
            source_image_attribution = image.source_image_attribution,
            own_image_path = image.own_image_path,
            own_image_url = image.own_image_url,
            image_width = image.image_width,
            image_height = image.image_height
          where stored.id = image.id and stored.artwork_id = saved.id;

        if not found then
          raise exception 'image % not found on artwork %', image.id, saved.id
            using errcode = 'no_data_found';
        end if;
      end if;
    end loop;
  end if;

  if field_entries is not null then
    delete from public.artwork_field_entries as stored
      where stored.artwork_id = saved.id
        and stored.field_id::text in (select jsonb_object_keys(field_entries));

    insert into public.artwork_field_entries (artwork_id, field_id, field_kind, text_value)
      select saved.id, field.id, field.kind,
        case when field.kind = 'text' then btrim(entry.value #>> '{}') end
        from jsonb_each(field_entries) as entry
        join public.artwork_fields as field
          on field.id::text = entry.key and field.owner_id = saved.owner_id
        where (field.kind = 'flag' and entry.value = 'true'::jsonb)
          or (
            field.kind = 'text' and jsonb_typeof(entry.value) = 'string'
              and btrim(entry.value #>> '{}') <> ''
          );
  end if;

  if relations is not null then
    delete from public.artwork_relations as stored
      using public.artworks as other
      where saved.id in (stored.from_id, stored.to_id)
        and other.id = case when stored.from_id = saved.id then stored.to_id else stored.from_id end
        and other.deleted_at is null;

    insert into public.artwork_relations (from_id, to_id, kind)
      select
        case
          when item.kind in ('version', 'related') then least(saved.id, item.artwork_id)
          when item.side = 'from' then saved.id
          else item.artwork_id
        end,
        case
          when item.kind in ('version', 'related') then greatest(saved.id, item.artwork_id)
          when item.side = 'from' then item.artwork_id
          else saved.id
        end,
        item.kind
        from jsonb_to_recordset(relations) as item(kind text, side text, artwork_id uuid)
      on conflict ((least(from_id, to_id)), (greatest(from_id, to_id))) do nothing;
  end if;

  return query select saved.id, saved.record_number;
end;
$$;

revoke all on function public.save_artwork(jsonb, jsonb, uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_artwork(jsonb, jsonb, uuid, jsonb, jsonb, jsonb) to authenticated;

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

  perform set_config('study_atelier.importing', '', true);

  perform private.rebuild_note_links(importer);

  if not had_points and not exists (select 1 from public.point_events where owner_id = importer) then
    perform private.fill_point_events(importer);
  end if;

  return counts;
end;
$$;
