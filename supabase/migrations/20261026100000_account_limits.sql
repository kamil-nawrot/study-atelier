create function public.storage_usage()
returns table (used_bytes bigint, quota_bytes bigint)
language sql
stable
set search_path = ''
as $$
  select coalesce(sum((object.metadata ->> 'size')::bigint), 0)::bigint, 209715200::bigint
    from storage.objects as object
    where object.bucket_id = 'artwork-images'
      and object.name collate "C" > (select auth.uid())::text || '/'
      and object.name collate "C" < (select auth.uid())::text || '0';
$$;

revoke all on function public.storage_usage() from public, anon;
grant execute on function public.storage_usage() to authenticated;

drop policy "Owners upload their artwork images" on storage.objects;

create policy "Owners upload their artwork images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (
      select usage.used_bytes + coalesce((metadata ->> 'contentLength')::bigint, 0) <= usage.quota_bytes
        from public.storage_usage() as usage
    )
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
    and (
      select usage.used_bytes + coalesce((metadata ->> 'contentLength')::bigint, 0) <= usage.quota_bytes
        from public.storage_usage() as usage
    )
  );

create function private.limit_rows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  most constant integer := tg_argv[0]::integer;
  window_column constant text := tg_argv[1];
  over_limit boolean;
begin
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

revoke all on function private.limit_rows() from public;

create trigger artworks_limit_rows
  after insert on public.artworks
  referencing new table as added
  for each statement execute function private.limit_rows('5000');

create trigger category_values_limit_rows
  after insert on public.category_values
  referencing new table as added
  for each statement execute function private.limit_rows('5000');

create trigger glossary_entries_limit_rows
  after insert on public.glossary_entries
  referencing new table as added
  for each statement execute function private.limit_rows('2000');

create trigger timeline_events_limit_rows
  after insert on public.timeline_events
  referencing new table as added
  for each statement execute function private.limit_rows('2000');

create trigger visits_limit_rows
  after insert on public.visits
  referencing new table as added
  for each statement execute function private.limit_rows('1000');

create trigger artwork_fields_limit_rows
  after insert on public.artwork_fields
  referencing new table as added
  for each statement execute function private.limit_rows('100');

create trigger review_log_limit_rows
  after insert on public.review_log
  referencing new table as added
  for each statement execute function private.limit_rows('1000', 'reviewed_at');

create trigger feedback_limit_rows
  after insert on public.feedback
  referencing new table as added
  for each statement execute function private.limit_rows('20', 'created_at');

create index feedback_owner_id_created_at_idx on public.feedback (owner_id, created_at);
