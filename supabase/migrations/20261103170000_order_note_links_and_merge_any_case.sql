create or replace function private.note_link_targets(owner uuid, notes text)
returns table (target_artwork_id uuid, target_value_id uuid, target_era_code text)
language sql
volatile
set search_path = ''
as $$
  with links as (
    select found[1]::integer as record_number,
      found[2] as kind,
      case
        when found[2] <> 'era'
          and found[3] ~ '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
        then found[3]::uuid
      end as value_id,
      case when found[2] = 'era' then found[3] end as era_code,
      link.place
      from regexp_matches(
        notes,
        '\]\(/atelier/(?:([0-9]{1,9})|values/(era|period|style|material|author|location)/([A-Za-z0-9_-]{1,64}))\)',
        'g'
      ) with ordinality as link(found, place)
  ),
  linked_artworks as (
    select artwork.id, artwork.record_number
      from public.artworks as artwork
      where artwork.owner_id = owner
        and artwork.record_number in (select links.record_number from links)
      for key share of artwork
  ),
  linked_values as (
    select value.id, value.category_code
      from public.category_values as value
      where value.owner_id = owner
        and value.id in (select links.value_id from links)
      for key share of value
  ),
  targets as (
    select artwork.id as artwork_id, null::uuid as value_id, null::text as era_code, min(links.place) as place
      from linked_artworks as artwork
      join links on links.record_number = artwork.record_number
      group by artwork.id
    union all
    select null, value.id, null, min(links.place)
      from linked_values as value
      join links on links.value_id = value.id and links.kind = value.category_code
      group by value.id
    union all
    select null, null, era.code, min(links.place)
      from public.eras as era
      join links on links.kind = 'era' and links.era_code = era.code
      group by era.code
  )
  select targets.artwork_id, targets.value_id, targets.era_code
    from targets
    order by targets.place, targets.artwork_id, targets.value_id, targets.era_code
    limit 200;
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

  delete from public.category_values as value where value.id = merged_id;
end;
$$;
