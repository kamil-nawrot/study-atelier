alter table public.artworks rename column year to year_to;
alter table public.artworks rename constraint artworks_year_check to artworks_year_to_check;

create or replace function public.save_artwork(
  artwork jsonb,
  values_by_category jsonb,
  existing_id uuid default null
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
      title, author_unknown, year_to, year_approximate, type_code, era_code, notes,
      source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
      source_image_attribution, own_image_path, own_image_url,
      image_width, image_height
    )
    values (
      btrim(input.title), coalesce(input.author_unknown, false), input.year_to,
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

  insert into public.category_values (category_code, name)
    select entry.key, btrim(item.name)
      from jsonb_each(values_by_category) as entry
      cross join jsonb_array_elements_text(entry.value) as item(name)
      where btrim(item.name) <> ''
    on conflict (owner_id, category_code, lower(name)) do nothing;

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

  return query select saved.id, saved.record_number;
end;
$$;

revoke all on function public.save_artwork(jsonb, jsonb, uuid) from public, anon;
grant execute on function public.save_artwork(jsonb, jsonb, uuid) to authenticated;
