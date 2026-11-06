alter table public.artwork_fields
  add column type_codes text[] not null default '{}';

create function private.check_field_type_codes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if cardinality(new.type_codes) <> (
      select count(distinct listed.code) from unnest(new.type_codes) as listed(code)
    )
    or exists (
      select 1 from unnest(new.type_codes) as listed(code)
        where not exists (
          select 1 from public.artwork_types as known where known.code = listed.code
        )
    )
  then
    raise exception 'type_codes must list distinct artwork types'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create function private.drop_values_outside_field_types()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.artwork_field_entries as entry
    using public.artworks as artwork
    where entry.field_id = new.id
      and artwork.id = entry.artwork_id
      and not (cardinality(new.type_codes) = 0 or coalesce(artwork.type_code = any (new.type_codes), false));

  delete from public.artwork_values as link
    using public.category_values as value, public.artworks as artwork
    where value.category_code = new.id::text
      and link.value_id = value.id
      and artwork.id = link.artwork_id
      and not (cardinality(new.type_codes) = 0 or coalesce(artwork.type_code = any (new.type_codes), false));
  return null;
end;
$$;

create function private.drop_field_values_outside_type()
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
    using public.category_values as value, public.artwork_fields as field
    where link.artwork_id = new.id
      and value.id = link.value_id
      and field.id::text = value.category_code
      and not (cardinality(field.type_codes) = 0 or coalesce(new.type_code = any (field.type_codes), false));
  return null;
end;
$$;

create function private.skip_field_entry_outside_type()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
      from public.artwork_fields as field
      join public.artworks as artwork on artwork.id = new.artwork_id
      where field.id = new.field_id
        and not (cardinality(field.type_codes) = 0 or coalesce(artwork.type_code = any (field.type_codes), false))
  ) then
    return null;
  end if;
  return new;
end;
$$;

create function private.skip_own_value_outside_type()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
      from public.category_values as value
      join public.artwork_fields as field on field.id::text = value.category_code
      join public.artworks as artwork on artwork.id = new.artwork_id
      where value.id = new.value_id
        and not (cardinality(field.type_codes) = 0 or coalesce(artwork.type_code = any (field.type_codes), false))
  ) then
    return null;
  end if;
  return new;
end;
$$;

create trigger artwork_fields_check_type_codes
  before insert or update of type_codes on public.artwork_fields
  for each row execute function private.check_field_type_codes();

create trigger artwork_fields_drop_values_outside_types
  after update of type_codes on public.artwork_fields
  for each row when (old.type_codes is distinct from new.type_codes)
  execute function private.drop_values_outside_field_types();

create trigger artworks_drop_field_values_outside_type
  after update of type_code on public.artworks
  for each row when (old.type_code is distinct from new.type_code)
  execute function private.drop_field_values_outside_type();

create trigger artwork_field_entries_skip_outside_type
  before insert on public.artwork_field_entries
  for each row execute function private.skip_field_entry_outside_type();

create trigger artwork_values_skip_own_value_outside_type
  before insert on public.artwork_values
  for each row execute function private.skip_own_value_outside_type();

revoke all on function private.check_field_type_codes() from public;
revoke all on function private.drop_values_outside_field_types() from public;
revoke all on function private.drop_field_values_outside_type() from public;
revoke all on function private.skip_field_entry_outside_type() from public;
revoke all on function private.skip_own_value_outside_type() from public;

grant insert (type_codes), update (type_codes) on public.artwork_fields to authenticated;

create function public.artwork_field_type_impact(target_field uuid, type_codes text[])
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(distinct artwork.id)::integer
    from public.artworks as artwork
    where not (cardinality(type_codes) = 0 or coalesce(artwork.type_code = any (type_codes), false))
      and (
        exists (
          select 1 from public.artwork_field_entries as entry
            where entry.artwork_id = artwork.id and entry.field_id = target_field
        )
        or exists (
          select 1
            from public.artwork_values as link
            join public.category_values as value on value.id = link.value_id
            where link.artwork_id = artwork.id and value.category_code = target_field::text
        )
      );
$$;

revoke all on function public.artwork_field_type_impact(uuid, text[]) from public, anon;
grant execute on function public.artwork_field_type_impact(uuid, text[]) to authenticated;
