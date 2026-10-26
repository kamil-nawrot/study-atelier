create function public.delete_account()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  learner uuid := auth.uid();
begin
  if learner is null then
    raise exception using errcode = '28000', message = 'not signed in';
  end if;
  if exists (
    select 1 from storage.objects as object
      where object.bucket_id = 'artwork-images'
        and object.name collate "C" > learner::text || '/'
        and object.name collate "C" < learner::text || '0'
  ) then
    raise exception using errcode = '55000', message = 'the files of the learner are still stored';
  end if;
  delete from auth.users where id = learner;
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
