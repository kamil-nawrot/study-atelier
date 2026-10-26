alter table public.profiles
  add column legal_version text check (legal_version ~ '^\d{4}-\d{2}-\d{2}$'),
  add column legal_accepted_at timestamptz,
  add constraint profiles_legal_accepted check ((legal_version is null) = (legal_accepted_at is null));

create function private.stamp_legal_acceptance()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.legal_version is distinct from old.legal_version then
    new.legal_accepted_at := case when new.legal_version is null then null else now() end;
  else
    new.legal_accepted_at := old.legal_accepted_at;
  end if;
  return new;
end;
$$;

revoke all on function private.stamp_legal_acceptance() from public;

create trigger profiles_stamp_legal_acceptance
  before insert or update on public.profiles
  for each row execute function private.stamp_legal_acceptance();

grant insert (legal_version) on public.profiles to authenticated;
grant update (legal_version) on public.profiles to authenticated;

create function private.accept_legal_at_sign_up()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ? 'legal_version' then
    insert into public.profiles (owner_id, legal_version)
      values (new.id, new.raw_user_meta_data ->> 'legal_version')
      on conflict (owner_id) do update set legal_version = excluded.legal_version;
  end if;
  return new;
end;
$$;

revoke all on function private.accept_legal_at_sign_up() from public;

create trigger users_accept_legal_at_sign_up
  after insert on auth.users
  for each row execute function private.accept_legal_at_sign_up();

insert into public.profiles (owner_id, legal_version)
  select id, '2026-10-26' from auth.users
  on conflict (owner_id) do update set legal_version = excluded.legal_version
    where public.profiles.legal_version is null;
