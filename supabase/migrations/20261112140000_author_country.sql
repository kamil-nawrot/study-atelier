alter table public.author_details
  add column country text
    check (country <> '' and country = btrim(country) and char_length(country) <= 60);

grant insert (country) on public.author_details to authenticated;
grant update (country) on public.author_details to authenticated;

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

create or replace function public.value_page_content(target_value uuid)
returns table (has_content boolean, own_image_path text)
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(bool_or(content.filled), false), max(content.own_image_path)
    from (
      select details.summary is not null or details.notes is not null as filled,
          null::text as own_image_path
        from public.period_details as details where details.value_id = target_value
      union all
      select details.summary is not null or details.notes is not null, null
        from public.style_details as details where details.value_id = target_value
      union all
      select details.summary is not null or details.notes is not null, null
        from public.material_details as details where details.value_id = target_value
      union all
      select details.summary is not null or details.notes is not null
          or details.birth_year is not null or details.death_year is not null
          or details.sort_name is not null or details.country is not null
          or details.source_image_file is not null
          or details.own_image_path is not null or details.own_image_url is not null,
          details.own_image_path
        from public.author_details as details where details.value_id = target_value
      union all
      select details.summary is not null or details.notes is not null
          or details.country_code is not null or details.place_type is not null,
          null
        from public.location_details as details where details.value_id = target_value
    ) as content;
$$;
