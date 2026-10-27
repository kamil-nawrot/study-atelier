\set ON_ERROR_STOP on

begin;

insert into public.announcements (body, starts_at, ends_at) values
  ('Ended', now() - interval '2 days', now() - interval '1 day'),
  ('Current', now() - interval '1 hour', now() + interval '1 hour'),
  ('Open-ended', now() - interval '1 hour', null),
  ('Planned', now() + interval '1 day', null);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  assert (select array_agg(body order by body) from public.announcements) = array['Current', 'Open-ended'],
    'a learner sees an announcement that ended or has not started';
end;
$$;

rollback;
