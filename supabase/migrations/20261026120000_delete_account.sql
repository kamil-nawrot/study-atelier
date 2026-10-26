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
  delete from auth.users where id = learner;
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
