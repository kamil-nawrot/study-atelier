create function public.save_era_details(target_era text, details jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(details) is distinct from 'object' then
    raise exception 'details must be an object'
      using errcode = 'invalid_parameter_value';
  end if;

  insert into public.era_details as saved (era_code, summary, notes)
    values (
      target_era,
      nullif(btrim(details ->> 'summary'), ''),
      nullif(details ->> 'notes', '')
    )
  on conflict (owner_id, era_code) do update
    set summary = case when details ? 'summary' then excluded.summary else saved.summary end,
      notes = case when details ? 'notes' then excluded.notes else saved.notes end;
end;
$$;

create function public.save_value_details(target_value uuid, details jsonb)
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
      value_id, summary, notes, birth_year, death_year, years_approximate, sort_name,
      source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
      source_image_attribution, own_image_path, own_image_url, own_image_source_url,
      image_width, image_height
    )
      values (
        target_value, new_summary, new_notes, author.birth_year, author.death_year,
        coalesce(author.years_approximate, false), nullif(btrim(author.sort_name), ''),
        author.source_wikidata_id, author.source_image_file, author.source_image_licence,
        author.source_image_licence_url, author.source_image_attribution, author.own_image_path,
        author.own_image_url, author.own_image_source_url, author.image_width, author.image_height
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
        own_image_source_url = case
          when details ? 'own_image_source_url' then excluded.own_image_source_url
          else saved.own_image_source_url
        end,
        image_width = case when details ? 'image_width' then excluded.image_width else saved.image_width end,
        image_height = case
          when details ? 'image_height' then excluded.image_height
          else saved.image_height
        end;
  elsif kind = 'location' then
    place := jsonb_populate_record(null::public.location_details, details);
    insert into public.location_details as saved (value_id, summary, notes, country_code, place_type)
      values (target_value, new_summary, new_notes, place.country_code, place.place_type)
    on conflict (value_id) do update
      set summary = case when details ? 'summary' then excluded.summary else saved.summary end,
        notes = case when details ? 'notes' then excluded.notes else saved.notes end,
        country_code = case
          when details ? 'country_code' then excluded.country_code
          else saved.country_code
        end,
        place_type = case when details ? 'place_type' then excluded.place_type else saved.place_type end;
  end if;
end;
$$;

revoke all on function public.save_era_details(text, jsonb) from public, anon;
revoke all on function public.save_value_details(uuid, jsonb) from public, anon;

grant execute on function public.save_era_details(text, jsonb) to authenticated;
grant execute on function public.save_value_details(uuid, jsonb) to authenticated;
