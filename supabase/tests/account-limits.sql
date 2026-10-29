\set ON_ERROR_STOP on

begin;

create schema limits_test;
grant usage on schema limits_test to authenticated;

create function limits_test.failure(statement text)
returns text
language plpgsql
as $$
declare
  state text;
  hint text;
begin
  execute statement;
  return null;
exception
  when others then
    get stacked diagnostics state = returned_sqlstate, hint = pg_exception_hint;
    return concat_ws(' ', state, nullif(hint, ''));
end;
$$;

create function limits_test.act_as(user_id uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

grant execute on all functions in schema limits_test to authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test'),
  ('00000000-0000-0000-0000-00000000000c', 'owner-c@example.test');

insert into public.category_values (owner_id, category_code, name)
  values ('00000000-0000-0000-0000-00000000000a', 'location', 'Museum');

set local role authenticated;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
  place uuid;
  artwork uuid;
  card constant text := '{"due": "2026-10-30T00:00:00Z", "stability": 1, "difficulty": 1, "state": 2, "reps": 1, "lapses": 0, "scheduled_days": 1, "learning_steps": 0}';
begin
  perform limits_test.act_as(a);

  assert limits_test.failure(
    'insert into public.artworks (title, author_unknown) select ''Work '' || n, true from generate_series(1, 5000) as n'
  ) is null, 'an account cannot hold 5000 artworks';
  assert limits_test.failure('insert into public.artworks (title, author_unknown) values (''One too many'', true)')
      = '53400 artworks',
    'an account holds more than 5000 artworks';

  assert limits_test.failure(
    'insert into public.category_values (category_code, name) select ''style'', ''Style '' || n from generate_series(1, 4999) as n'
  ) is null, 'an account cannot hold 5000 category values';
  assert limits_test.failure('insert into public.category_values (category_code, name) values (''period'', ''One too many'')')
      = '53400 category_values',
    'an account holds more than 5000 category values';

  assert limits_test.failure(
    'insert into public.glossary_entries (name, category) select ''Term '' || n, ''general'' from generate_series(1, 2000) as n'
  ) is null, 'an account cannot hold 2000 glossary entries';
  assert limits_test.failure('insert into public.glossary_entries (name, category) values (''One too many'', ''general'')')
      = '53400 glossary_entries',
    'an account holds more than 2000 glossary entries';

  assert limits_test.failure(
    'insert into public.timeline_events (name, year_to) select ''Event '' || n, 1500 from generate_series(1, 2000) as n'
  ) is null, 'an account cannot hold 2000 timeline events';
  assert limits_test.failure('insert into public.timeline_events (name, year_to) values (''One too many'', 1500)')
      = '53400 timeline_events',
    'an account holds more than 2000 timeline events';

  assert limits_test.failure(
    'insert into public.artwork_fields (name, kind) select ''Field '' || n, ''text'' from generate_series(1, 100) as n'
  ) is null, 'an account cannot hold 100 own fields';
  assert limits_test.failure('insert into public.artwork_fields (name, kind) values (''One too many'', ''text'')')
      = '53400 artwork_fields',
    'an account holds more than 100 own fields';

  reset role;
  select id into place from public.category_values where owner_id = a and name = 'Museum';
  insert into public.visits (owner_id, place_id, visited_on, date_precision)
    select a, place, date '2026-01-01' + n, 'day' from generate_series(1, 1000) as n;
  set local role authenticated;
  assert limits_test.failure(format(
      'insert into public.visits (place_id, visited_on, date_precision) values (%L, ''2026-10-12'', ''day'')', place))
      = '53400 visits',
    'an account holds more than 1000 visits';

  reset role;
  select id into artwork from public.artworks where owner_id = a limit 1;
  insert into public.review_log (owner_id, artwork_id, mode, rating, reviewed_at)
    select a, artwork, 'flashcard', 3, now() - interval '2 days' from generate_series(1, 1000);
  set local role authenticated;
  assert limits_test.failure(format(
      'select public.record_review(%L, %L, ''{"mode": "flashcard", "rating": 3}'')', artwork, card)) is null,
    'answers older than a day count towards the daily review limit';

  reset role;
  insert into public.review_log (owner_id, artwork_id, mode, rating, reviewed_at)
    select a, artwork, 'flashcard', 3, now() - interval '1 hour' from generate_series(1, 999);
  set local role authenticated;
  assert limits_test.failure(format(
      'select public.record_review(%L, %L, ''{"mode": "flashcard", "rating": 3}'')', artwork, card))
      = '53400 review_log',
    'an account records more than 1000 review answers in a day';

  reset role;
  insert into public.feedback (owner_id, kind, title, created_at)
    select a, 'idea', 'Old idea ' || n, now() - interval '2 days' from generate_series(1, 20) as n;
  set local role authenticated;
  assert limits_test.failure(
    'insert into public.feedback (kind, title) select ''bug'', ''Bug '' || n from generate_series(1, 20) as n'
  ) is null, 'feedback older than a day counts towards the daily feedback limit';
  assert limits_test.failure('insert into public.feedback (kind, title) values (''bug'', ''One too many'')')
      = '53400 feedback',
    'an account sends more than 20 feedback entries in a day';

  reset role;
  insert into public.artwork_values (artwork_id, value_id, owner_id)
    select work.id, style.id, a
      from (select id from public.artworks where owner_id = a) as work
      cross join (select id from public.category_values where owner_id = a and category_code = 'style' limit 20) as style;
  select id into artwork from public.artworks where owner_id = a limit 1;
  set local role authenticated;
  assert limits_test.failure(format(
      'insert into public.artwork_values (artwork_id, value_id) values (%L, %L)', artwork, place))
      = '53400 artwork_values',
    'an account holds more than 100000 artwork values';

  reset role;
  insert into public.visit_artworks (visit_id, artwork_id, owner_id)
    select visit.id, work.id, a
      from (select id from public.visits where owner_id = a) as visit
      cross join (select id from public.artworks where owner_id = a order by id limit 20) as work;
  set local role authenticated;
  assert limits_test.failure(format(
      'insert into public.visit_artworks (visit_id, artwork_id) select %L, id from public.artworks where owner_id = %L order by id offset 20 limit 1',
      (select id from public.visits where owner_id = a limit 1), a))
      = '53400 visit_artworks',
    'an account holds more than 20000 artworks seen on visits';

  reset role;
  insert into public.artwork_field_entries (artwork_id, field_id, owner_id, field_kind, text_value)
    select work.id, field.id, a, 'text', 'Entry'
      from (select id from public.artworks where owner_id = a order by id limit 1000) as work
      cross join (select id from public.artwork_fields where owner_id = a) as field;
  set local role authenticated;
  assert limits_test.failure(format(
      'insert into public.artwork_field_entries (artwork_id, field_id, field_kind, text_value) select id, %L, ''text'', ''Entry'' from public.artworks where owner_id = %L order by id offset 1000 limit 1',
      (select id from public.artwork_fields where owner_id = a limit 1), a))
      = '53400 artwork_field_entries',
    'an account holds more than 100000 own field entries';

  assert exists (
      select 1 from pg_locks
        where locktype = 'advisory' and pid = pg_backend_pid()
          and classid = (hashtext('artwork_values')::bigint & 4294967295)::oid
          and objid = (hashtext(a::text)::bigint & 4294967295)::oid
    ),
    'a row limit check does not lock the account for the rest of the transaction';

  perform limits_test.act_as(b);
  assert limits_test.failure('insert into public.artworks (title, author_unknown) values (''B work'', true)') is null,
    'the artworks of A count towards the limit of B';
  assert limits_test.failure('insert into public.feedback (kind, title) values (''bug'', ''B bug'')') is null,
    'the feedback of A counts towards the daily limit of B';
end;
$$;

reset role;

insert into storage.objects (bucket_id, name, metadata) values
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/large.jpg', '{"size": 209714200}'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000b/small.jpg', '{"size": 1000}');

set local role authenticated;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
  usage record;
begin
  perform limits_test.act_as(a);

  select * into usage from public.storage_usage();
  assert usage.used_bytes = 209714200, 'storage_usage does not sum the files of the learner';
  assert usage.quota_bytes = 209715200, 'storage_usage does not give the 200 MB quota';

  assert limits_test.failure(format(
      'insert into storage.objects (bucket_id, name, metadata) values (''artwork-images'', ''%s/fits.jpg'', ''{"contentLength": 1000}'')',
      a)) is null,
    'a file that fits in the quota is refused';
  assert limits_test.failure(format(
      'insert into storage.objects (bucket_id, name, metadata) values (''artwork-images'', ''%s/over.jpg'', ''{"contentLength": 1001}'')',
      a)) = '42501',
    'a file that passes the quota is accepted';
  assert limits_test.failure(format(
      'update storage.objects set metadata = ''{"contentLength": 5000}'' where name = ''%s/large.jpg''', a)) = '42501',
    'replacing a file can pass the quota';
  assert exists (
      select 1 from pg_locks
        where locktype = 'advisory' and pid = pg_backend_pid()
          and classid = (hashtext('storage.objects')::bigint & 4294967295)::oid
          and objid = (hashtext(a::text)::bigint & 4294967295)::oid
    ),
    'a quota check does not lock the storage of the account for the rest of the transaction';

  perform limits_test.act_as(b);

  select * into usage from public.storage_usage();
  assert usage.used_bytes = 1000, 'storage_usage counts the files of another learner';
  assert limits_test.failure(format(
      'insert into storage.objects (bucket_id, name, metadata) values (''artwork-images'', ''%s/next.jpg'', ''{"contentLength": 5000000}'')',
      b)) is null,
    'the files of A count towards the quota of B';

  perform limits_test.act_as('00000000-0000-0000-0000-00000000000c');

  assert limits_test.failure(format('select public.import_atelier(%L)', jsonb_build_object(
      'artworks', (
        select jsonb_agg(jsonb_build_object(
          'id', gen_random_uuid(), 'record_number', n, 'title', 'Imported ' || n, 'author_unknown', true))
          from generate_series(1, 5001) as n
      ))))
      = '53400 artworks',
    'import_atelier brings in more than 5000 artworks';
end;
$$;

rollback;
