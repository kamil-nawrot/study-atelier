create or replace function private.place_artwork_field_last()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.position > 0 then
    return new;
  end if;
  select coalesce(max(field.position), 0) + 1
    into new.position
    from public.artwork_fields as field
    where field.owner_id = new.owner_id;
  return new;
end;
$$;
