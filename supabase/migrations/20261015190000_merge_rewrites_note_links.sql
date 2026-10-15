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
    set notes = replace(artwork.notes, merged_path, kept_path)
    where position(merged_path in artwork.notes) > 0;
  update public.period_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;
  update public.style_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;
  update public.material_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;
  update public.author_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;
  update public.location_details as details
    set notes = replace(details.notes, merged_path, kept_path)
    where position(merged_path in details.notes) > 0;

  delete from public.category_values as value where value.id = merged_id;
end;
$$;
