create function private.place_details_from_alias()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.catalogue_museums as museum where lower(museum.name) = lower(new.name)) then
    return null;
  end if;
  insert into public.location_details (value_id, owner_id, country_code, place_type, catalogue_wikidata_id)
    select new.id, new.owner_id, min(museum.country_code), 'museum', min(museum.wikidata_id)
      from public.catalogue_museums as museum
      where lower(museum.alias) = lower(new.name)
      having count(*) = 1;
  return null;
end;
$$;

revoke all on function private.place_details_from_alias() from public;

create trigger category_values_place_from_alias
  after insert on public.category_values
  for each row when (new.category_code = 'location')
  execute function private.place_details_from_alias();
