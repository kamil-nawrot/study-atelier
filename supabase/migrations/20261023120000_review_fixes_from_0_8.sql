alter table public.category_values
  add constraint category_values_name_length_check check (char_length(name) <= 200) not valid,
  add constraint category_values_name_control_check check (name !~ '[[:cntrl:]]') not valid;

create or replace function public.save_artwork(
  artwork jsonb,
  values_by_category jsonb,
  existing_id uuid default null,
  images jsonb default null,
  field_entries jsonb default null
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

  return query select saved.id, saved.record_number;
end;
$$;
