\set ON_ERROR_STOP on

begin;

create schema legal_test;
grant usage on schema legal_test to authenticated;

create function legal_test.failure(statement text)
returns text
language plpgsql
as $$
declare
  state text;
begin
  execute statement;
  return null;
exception
  when others then
    get stacked diagnostics state = returned_sqlstate;
    return state;
end;
$$;

grant execute on all functions in schema legal_test to authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test', '{"legal_version": "2026-10-26"}'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test', '{}');

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
begin
  assert (select legal_version from public.profiles where owner_id = a) = '2026-10-26',
    'a sign-up with the accepted version does not store it';
  assert (select legal_accepted_at from public.profiles where owner_id = a) is not null,
    'a sign-up does not stamp the time of the acceptance';
  assert not exists (select 1 from public.profiles where owner_id = b),
    'a sign-up without an accepted version gets a profile';
end;
$$;

update public.profiles set legal_accepted_at = '2026-01-01' where owner_id = '00000000-0000-0000-0000-00000000000a';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  before_update timestamptz;
begin
  select legal_accepted_at into before_update from public.profiles;
  assert before_update = now(),
    'the stamp of the acceptance can be set to any time';

  update public.profiles set display_name = 'Owner A';
  assert (select legal_accepted_at from public.profiles) = before_update,
    'saving the profile moves the time of the acceptance';

  assert legal_test.failure('update public.profiles set legal_accepted_at = ''2020-01-01''') = '42501',
    'a learner sets the time of the acceptance';
  assert legal_test.failure('update public.profiles set legal_version = ''next''') = '23514',
    'a version that is not a date is accepted';

  update public.profiles set legal_version = '2026-12-01';
  assert (select legal_version from public.profiles) = '2026-12-01', 'a learner cannot accept a new version';
  assert (select legal_accepted_at from public.profiles) is not null,
    'accepting a new version leaves no time of the acceptance';
end;
$$;

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  insert into public.profiles (legal_version) values ('2026-10-26');
  assert (select legal_accepted_at from public.profiles) is not null,
    'a learner without a profile cannot accept the documents';
end;
$$;

rollback;
