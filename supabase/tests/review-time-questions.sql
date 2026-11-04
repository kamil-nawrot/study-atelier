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
  number integer;
  session jsonb;
  asked integer;
  orders integer;
  eligible uuid[];
  overdue uuid;
  not_due uuid;
  order_item jsonb;
  shown uuid[];
begin
  for number in 1..12 loop
    perform pg_temp.add_work(number, 'early_modern', null, 1500 + 20 * number);
  end loop;
  perform pg_temp.add_work(13, 'early_modern', null, 1200);
  perform pg_temp.add_work(14, null, null, 1600);
  perform pg_temp.add_work(15, 'early_modern', null, null);
  for number in 16..20 loop
    perform pg_temp.add_work(number, 'early_modern', null, 1505 + 20 * number);
  end loop;
  perform pg_temp.add_work(21, 'early_modern', 1480, 1500);

  for number in 1..15 loop
    perform public.record_review(pg_temp.work(number),
      pg_temp.card(case when number <= 12 then later else now() - interval '1 hour' end),
      '{"mode": "flashcard", "rating": 3}');
  end loop;
  perform public.record_review(pg_temp.work(21), pg_temp.card(later), '{"mode": "flashcard", "rating": 3}');

  eligible := array(select pg_temp.work(n) from generate_series(1, 12) as n) || pg_temp.work(21);

  assert not exists (select 1 from pg_temp.time_items(public.review_session(day_start, 'mixed'))),
    'a session asks about time when the app did not ask for it';

  for attempt in 1..20 loop
    session := public.review_session(day_start, 'mixed', 'all', null, null, true);
    select count(*), count(*) filter (where item ->> 'mode' = 'order')
      into asked, orders
      from pg_temp.time_items(session) as item;

    assert asked between 2 and 4, format('a session asks %s questions about time, not 2 to 4', asked);
    assert orders between 1 and 2, format('a session asks %s order questions, not 1 or 2', orders);
    assert session -> 0 ->> 'mode' not in ('year', 'order'), 'a session starts with a question about time';
    assert (
      select count(*) from jsonb_array_elements(session) as item where item ->> 'mode' not in ('year', 'order')
    ) = 3, 'the questions about time take the place of artworks of the session';
    assert not exists (
      select 1 from pg_temp.time_items(session) as item
        where item ->> 'mode' = 'year' and not (item ->> 'artwork_id')::uuid = any (eligible)
    ), 'a year question asks about an artwork without a year in its era or never reviewed';
    assert not exists (
      select 1
        from pg_temp.time_items(session) as item
        join jsonb_array_elements(session) as other
          on other ->> 'artwork_id' = item ->> 'artwork_id' and other ->> 'mode' not in ('year', 'order')
        where item ->> 'mode' = 'year'
    ), 'a year question asks about an artwork the same session shows';

    for order_item in select item from pg_temp.time_items(session) as item where item ->> 'mode' = 'order' loop
      shown := array(select jsonb_array_elements_text(order_item -> 'artwork_ids')::uuid);
      assert cardinality(shown) = 4 and (select count(distinct id) from unnest(shown) as id) = 4,
        'an order question does not show four different artworks';
      assert not exists (
        select 1
          from public.artworks as one
          join public.artworks as other on other.id <> one.id
          where one.id = any (shown) and other.id = any (shown)
            and abs(coalesce(one.year_to, one.year_from) - coalesce(other.year_to, other.year_from)) < 30
      ), 'an order question shows artworks less than 30 years apart';
      assert shown <> array(
        select artwork.id from public.artworks as artwork
          where artwork.id = any (shown)
          order by coalesce(artwork.year_from, artwork.year_to)
      ), 'an order question shows its artworks already in order';
    end loop;
  end loop;

  overdue := pg_temp.work(3);
  not_due := pg_temp.work(4);
  perform public.record_review(overdue, pg_temp.card(now() - interval '1 day'),
    '{"facet": "date", "mode": "year", "rating": 1, "correct": false}');
  perform public.record_review(not_due, pg_temp.card(later),
    '{"facet": "date", "mode": "year", "rating": 3, "correct": true}');

  for attempt in 1..10 loop
    session := public.review_session(day_start, 'mixed', 'all', null, null, true);
    assert exists (
      select 1 from pg_temp.time_items(session) as item
        where (item ->> 'artwork_id')::uuid = overdue and item -> 'card' ->> 'stability' = '3'
    ), 'a session leaves out the year question that is due, or its card';
    assert not exists (
      select 1 from pg_temp.time_items(session) as item where (item ->> 'artwork_id')::uuid = not_due
    ), 'a session asks a year question that is not due';
  end loop;

  assert exists (
    select 1 from pg_temp.time_items(public.review_session(day_start, 'flashcards', 'all', null, null, true))
  ), 'a session of flashcards asks nothing about time';
  assert exists (
    select 1 from pg_temp.time_items(public.review_session(day_start, 'mixed', 'all', null, 0, true))
  ), 'a free round asks nothing about time';
end;
$$;

do $$
declare
  day_start constant timestamptz := date_trunc('day', now());
  work uuid := pg_temp.work(5);
  fresh uuid := pg_temp.work(16);
  counts record;
  failed boolean := false;
begin
  begin
    perform public.record_review(fresh, pg_temp.card(now() + interval '3 days'),
      '{"facet": "date", "mode": "year", "rating": 3, "correct": true}', day_start, 'UTC');
  exception when invalid_parameter_value then
    failed := true;
  end;
  assert failed, 'a year answer is saved for an artwork never reviewed';

  failed := false;
  begin
    perform public.record_review(work, pg_temp.card(now() + interval '3 days'),
      '{"facet": "date", "mode": "flashcard", "rating": 3}', day_start, 'UTC');
  exception when check_violation then
    failed := true;
  end;
  assert failed, 'a date card is saved for an answer that is not a year';

  perform public.record_review(work, pg_temp.card(now() - interval '1 hour', 8),
    '{"facet": "date", "mode": "year", "rating": 2, "correct": true, "answer_ms": 3000}', day_start, 'UTC');
  assert (select count(*) from public.review_cards where artwork_id = work) = 2,
    'a year answer replaces the recognition card instead of keeping its own';
  assert (select count(*) from public.review_log where artwork_id = work and facet = 'date' and mode = 'year') = 1,
    'a year answer is not logged under its facet';
  assert (select answers from public.point_events where kind = 'right_answers') = 1,
    'a year guessed close gives no point';
  assert not exists (select 1 from public.point_events where kind = 'settled' and item_id = work),
    'a settled date card counts as a settled artwork';
  assert not exists (select 1 from public.point_events where kind = 'plan_day'),
    'a year answer counts towards the day''s plan';

  perform public.record_review(work, pg_temp.card(now() - interval '1 hour'),
    '{"facet": "date", "mode": "year", "rating": 1, "correct": false}', day_start, 'UTC');
  assert (select answers from public.point_events where kind = 'right_answers') = 1,
    'a year guessed far gives a point';

  select * into counts from public.review_counts(day_start);
  assert counts.due = 3, 'a due date card counts as an artwork due today';
  assert counts.new_today = 16, 'a date card counts as a new artwork of the day';
  assert public.review_streak(day_start, 'UTC') = 1, 'a day of reviews does not count';

  perform public.record_right_answer(day_start);
  perform public.record_right_answer(day_start);
  assert (select answers from public.point_events where kind = 'right_answers') = 3,
    'a right order or definition answer gives no point';
  assert public.learner_points() = 42 + 3, 'right answers do not give a point each';

  for attempt in 1..60 loop
    perform public.record_right_answer(day_start);
  end loop;
  assert (select answers from public.point_events where kind = 'right_answers') = 50,
    'right answers give more than 50 points a day';

  perform public.record_right_answer(day_start - interval '1 day');
  assert (select count(*) from public.point_events where kind = 'right_answers') = 2,
    'right answers of another day add to the same day';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  day_start constant timestamptz := date_trunc('day', now());
  number integer;
begin
  for number in 1..20 loop
    perform pg_temp.add_work(number, 'early_modern', null, null);
    perform public.record_review(pg_temp.work(number), pg_temp.card(now() - interval '1 hour'),
      '{"mode": "flashcard", "rating": 3}');
  end loop;

  assert jsonb_array_length(public.review_session(day_start, 'mixed', 'all', null, null, true)) = 20,
    'a session without dated artworks is not the plain session';
  assert not exists (
    select 1 from pg_temp.time_items(public.review_session(day_start, 'mixed', 'all', null, null, true))
  ), 'a session asks about time without dated artworks';
  assert not exists (select 1 from public.point_events where owner_id = auth.uid() and kind = 'right_answers'),
    'one learner''s right answers land with another';
end;
$$;

rollback;
