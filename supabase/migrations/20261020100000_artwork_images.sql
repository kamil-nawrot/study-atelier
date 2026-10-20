create table public.artwork_images (
  artwork_id uuid not null,
  owner_id uuid not null default auth.uid(),
  position smallint not null check (position between 1 and 4),
  source_wikidata_id text check (source_wikidata_id ~ '^Q[1-9][0-9]*$'),
  source_image_file text,
  source_image_licence text,
  source_image_licence_url text,
  source_image_attribution text,
  own_image_path text,
  own_image_url text check (own_image_url ~ '^https://'),
  image_width integer check (image_width > 0),
  image_height integer check (image_height > 0),
  primary key (artwork_id, position),
  foreign key (artwork_id, owner_id) references public.artworks (id, owner_id) on delete cascade,
  check (source_image_file is null or source_wikidata_id is not null),
  check (own_image_path is null or own_image_url is null),
  check (own_image_path is null or split_part(own_image_path, '/', 1) = owner_id::text),
  check ((image_width is null) = (image_height is null)),
  check (source_image_file is not null or own_image_path is not null or own_image_url is not null)
);

alter table public.artwork_images enable row level security;

create policy "Owners manage the images of their artworks"
  on public.artwork_images for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.artwork_images from anon, authenticated;
grant select, delete on public.artwork_images to authenticated;
grant insert (
  artwork_id, position, source_wikidata_id, source_image_file, source_image_licence,
  source_image_licence_url, source_image_attribution, own_image_path, own_image_url,
  image_width, image_height
) on public.artwork_images to authenticated;

drop function public.save_artwork(jsonb, jsonb, uuid);

create function public.save_artwork(
  artwork jsonb,
  values_by_category jsonb,
  existing_id uuid default null,
  extra_images jsonb default null
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
begin
  if extra_images is not null and jsonb_typeof(extra_images) is distinct from 'array' then
    raise exception 'extra_images must be an array of images'
      using errcode = 'invalid_parameter_value';
  end if;

  if jsonb_array_length(coalesce(extra_images, '[]'::jsonb)) > 4 then
    raise exception 'an artwork has at most four images besides the main one'
      using errcode = 'check_violation';
  end if;

  if jsonb_typeof(values_by_category) is distinct from 'object' then
    raise exception 'values_by_category must be an object of name arrays'
      using errcode = 'invalid_parameter_value';
  end if;

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
      title, author_unknown, year_from, year_to, year_approximate, type_code, era_code, notes,
      source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
      source_image_attribution, own_image_path, own_image_url,
      image_width, image_height
    )
    values (
      btrim(input.title), coalesce(input.author_unknown, false), input.year_from, input.year_to,
      coalesce(input.year_approximate, false), input.type_code, input.era_code, input.notes,
      input.source_wikidata_id, input.source_image_file, input.source_image_licence,
      input.source_image_licence_url, input.source_image_attribution, input.own_image_path,
      input.own_image_url, input.image_width, input.image_height
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
        notes = input.notes,
        source_wikidata_id = input.source_wikidata_id,
        source_image_file = input.source_image_file,
        source_image_licence = input.source_image_licence,
        source_image_licence_url = input.source_image_licence_url,
        source_image_attribution = input.source_image_attribution,
        own_image_path = input.own_image_path,
        own_image_url = input.own_image_url,
        image_width = input.image_width,
        image_height = input.image_height
      where public.artworks.id = existing_id
      returning * into saved;

    if saved.id is null then
      raise exception 'artwork % not found', existing_id
        using errcode = 'no_data_found';
    end if;

    delete from public.artwork_values where public.artwork_values.artwork_id = saved.id;
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

  if extra_images is not null then
    delete from public.artwork_images where public.artwork_images.artwork_id = saved.id;

    insert into public.artwork_images (
      artwork_id, position, source_wikidata_id, source_image_file, source_image_licence,
      source_image_licence_url, source_image_attribution, own_image_path, own_image_url,
      image_width, image_height
    )
      select saved.id, item.position::smallint, image.source_wikidata_id, image.source_image_file,
        image.source_image_licence, image.source_image_licence_url, image.source_image_attribution,
        image.own_image_path, image.own_image_url, image.image_width, image.image_height
        from jsonb_array_elements(extra_images) with ordinality as item(value, position)
        cross join lateral jsonb_populate_record(null::public.artwork_images, item.value) as image;
  end if;

  return query select saved.id, saved.record_number;
end;
$$;

revoke all on function public.save_artwork(jsonb, jsonb, uuid, jsonb) from public, anon;
grant execute on function public.save_artwork(jsonb, jsonb, uuid, jsonb) to authenticated;
