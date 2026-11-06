create or replace function private.drop_field_values_outside_type()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.artwork_field_entries as entry
    using public.artwork_fields as field
    where entry.artwork_id = new.id
      and field.id = entry.field_id
      and not (cardinality(field.type_codes) = 0 or coalesce(new.type_code = any (field.type_codes), false));

  delete from public.artwork_values as link
    using public.category_values as value, public.categories as category, public.artwork_fields as field
    where link.artwork_id = new.id
      and value.id = link.value_id
      and category.code = value.category_code
      and field.id = category.field_id
      and not (cardinality(field.type_codes) = 0 or coalesce(new.type_code = any (field.type_codes), false));
  return null;
end;
$$;

create or replace function private.skip_own_value_outside_type()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
      from public.category_values as value
      join public.categories as category on category.code = value.category_code
      join public.artwork_fields as field on field.id = category.field_id
      join public.artworks as artwork on artwork.id = new.artwork_id
      where value.id = new.value_id
        and not (cardinality(field.type_codes) = 0 or coalesce(artwork.type_code = any (field.type_codes), false))
  ) then
    return null;
  end if;
  return new;
end;
$$;
