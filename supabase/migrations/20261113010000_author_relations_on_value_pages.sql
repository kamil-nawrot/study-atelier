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

  insert into public.location_details (value_id, latitude, longitude, wikidata_id)
    select kept.id, details.latitude, details.longitude, details.wikidata_id
      from public.location_details as details
      where details.value_id = merged_id and details.latitude is not null
    on conflict (value_id) do update
      set latitude = excluded.latitude,
        longitude = excluded.longitude,
        wikidata_id = excluded.wikidata_id
      where public.location_details.latitude is null;

  delete from public.category_values as value where value.id = merged_id;
end;
$$;
