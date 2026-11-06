\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

create function pg_temp.add_work(number integer, era text, year_from integer, year_to integer)
returns uuid
language sql
as $$
  select saved.id from public.save_artwork(
    jsonb_strip_nulls(jsonb_build_object(
      'title', 'Work ' || number,
      'author_unknown', true,
      'era_code', era,
      'year_from', year_from,
      'year_to', year_to
    )),
    '{}',
    null,
    jsonb_build_array(jsonb_build_object(
      'source_wikidata_id', 'Q' || number,
      'source_image_file', 'Work_' || number || '.jpg'
    ))
  ) as saved;
$$;

create function pg_temp.card(due timestamptz, stability double precision default 3)
returns jsonb
language sql
as $$
  select jsonb_build_object('due', due, 'stability', stability, 'difficulty', 5, 'state', 2, 'reps', 1,
    'lapses', 0, 'scheduled_days', 3, 'learning_steps', 0, 'last_review', now());
$$;

create function pg_temp.work(number integer)
returns uuid
language sql
as $$
  select artwork.id from public.artworks as artwork where artwork.title = 'Work ' || number;
$$;

create function pg_temp.time_items(session jsonb)
returns setof jsonb
language sql
as $$
  select item from jsonb_array_elements(session) as item where item ->> 'mode' in ('year', 'order');
$$;

do $$
declare
  day_start constant timestamptz := date_trunc('day', now());
  later constant timestamptz := now() + interval '10 days';
  session jsonb;
  outside uuid[];
  number integer;
begin
  for number in 1..20 loop
    perform pg_temp.add_work(number, 'early_modern', null, 1500 + 15 * number);
  end loop;
  perform pg_temp.add_work(21, 'early_modern', 1480, 1500);
  for number in 1..21 loop
    perform public.record_review(pg_temp.work(number),
      pg_temp.card(case when number between 17 and 20 then now() - interval '1 hour' else later end),
      '{"mode": "flashcard", "rating": 3}');
  end loop;

  insert into public.profiles (era_bounds) values (array[-3000, 476, 1560, 1789, 1945])
    on conflict (owner_id) do update set era_bounds = excluded.era_bounds;
  outside := array[pg_temp.work(1), pg_temp.work(2), pg_temp.work(3), pg_temp.work(21)];

  for attempt in 1..20 loop
    session := public.review_session(day_start, 'mixed', 'all', null, null, true);
    assert exists (select 1 from pg_temp.time_items(session) as item where item ->> 'mode' = 'year'),
      'a session with the learner bounds asks no year question';
    assert not exists (
      select 1 from pg_temp.time_items(session) as item
        where item ->> 'mode' = 'year' and (item ->> 'artwork_id')::uuid = any (outside)
    ), 'a year question asks about an artwork outside the learner bounds of its era';
  end loop;
end;
$$;

do $$
begin
  begin
    update public.profiles set era_bounds = array[-3000, 1500, 1492, 1789, 1945];
    assert false, 'era bounds out of order were saved';
  exception when check_violation then
    null;
  end;
  begin
    update public.profiles set era_bounds = array[-3000, 476, 1492, 1789];
    assert false, 'four era bounds were saved';
  exception when check_violation then
    null;
  end;
  update public.profiles set era_bounds = null;
  assert (select count(*) from public.profiles where era_bounds is null) = 1, 'the default bounds cannot be restored';
end;
$$;

rollback;
