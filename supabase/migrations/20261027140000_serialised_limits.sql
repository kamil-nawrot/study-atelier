create or replace function private.limit_rows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  most constant integer := tg_argv[0]::integer;
  window_column constant text := tg_argv[1];
  owner uuid;
  over_limit boolean;
begin
  for owner in execute 'select distinct owner_id from added order by owner_id' loop
    perform pg_advisory_xact_lock(hashtext(tg_table_name), hashtext(owner::text));
  end loop;

  execute format(
    'select exists (
       select 1 from (select distinct owner_id from added) as owner
         where (select count(*) from %I.%I as existing where existing.owner_id = owner.owner_id %s) > $1
     )',
    tg_table_schema,
    tg_table_name,
    case
      when window_column is null then ''
      else format('and existing.%I > now() - interval ''1 day''', window_column)
    end
  ) into over_limit using most;

  if over_limit then
    raise exception 'the account reached the limit of % rows in %', most, tg_table_name
      using errcode = 'configuration_limit_exceeded', hint = tg_table_name;
  end if;
  return null;
end;
$$;

create index artwork_values_owner_id_idx on public.artwork_values (owner_id);
create index visit_artworks_owner_id_idx on public.visit_artworks (owner_id);
create index artwork_field_entries_owner_id_idx on public.artwork_field_entries (owner_id);

create trigger artwork_values_limit_rows
  after insert on public.artwork_values
  referencing new table as added
  for each statement execute function private.limit_rows('100000');

create trigger visit_artworks_limit_rows
  after insert on public.visit_artworks
  referencing new table as added
  for each statement execute function private.limit_rows('20000');

create trigger artwork_field_entries_limit_rows
  after insert on public.artwork_field_entries
  referencing new table as added
  for each statement execute function private.limit_rows('100000');

create function public.storage_has_room(adding bigint)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('storage.objects'), hashtext((select auth.uid())::text));
  return (
    select usage.used_bytes + coalesce(adding, 0) <= usage.quota_bytes
      from public.storage_usage() as usage
  );
end;
$$;

revoke all on function public.storage_has_room(bigint) from public, anon;
grant execute on function public.storage_has_room(bigint) to authenticated;

drop policy "Owners upload their artwork images" on storage.objects;

create policy "Owners upload their artwork images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.storage_has_room((metadata ->> 'contentLength')::bigint)
  );

drop policy "Owners replace their artwork images" on storage.objects;

create policy "Owners replace their artwork images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.storage_has_room((metadata ->> 'contentLength')::bigint)
  );

create function public.deleted_account_images()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'artwork-images'
    and exists (select 1 from auth.users)
    and not exists (select 1 from auth.users u where u.id::text = split_part(o.name, '/', 1))
  order by o.created_at
  limit 1000;
$$;

revoke all on function public.deleted_account_images() from public, anon, authenticated;
grant execute on function public.deleted_account_images() to service_role;
