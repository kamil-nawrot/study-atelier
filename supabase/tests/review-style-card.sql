\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

create function pg_temp.card(due timestamptz)
returns jsonb
language sql
as $$
  select jsonb_build_object('due', due, 'stability', 20, 'difficulty', 4, 'state', 2,
    'reps', 4, 'lapses', 0, 'scheduled_days', 20, 'learning_steps', 0, 'last_review', now());
$$;

create function pg_temp.style_answer(work uuid, right_answer boolean, due timestamptz)
returns void
language sql
as $$
  select public.record_review(work, pg_temp.card(due),
    jsonb_build_object('facet', 'style', 'mode', 'quiz_style', 'rating', case when right_answer then 2 else 1 end,
      'correct', right_answer),
    date_trunc('day', now()), 'UTC');
$$;

create function pg_temp.session(form text default 'mixed', scope_kind text default 'all',
  scope_value text default null, free_round integer default null)
returns jsonb
language sql
as $$
  select public.review_session(date_trunc('day', now()), form, scope_kind, scope_value, free_round);
$$;

create function pg_temp.styles_asked(session jsonb)
returns integer
language sql
as $$
  select count(*)::integer from jsonb_array_elements(session) as item where item ->> 'facet' = 'style';
$$;

do $$
begin
  for number in 1..40 loop
    perform public.save_artwork(
      jsonb_build_object('title', 'Work ' || number, 'author_unknown', true),
      jsonb_build_object('style', jsonb_build_array('Style ' || (number % 8))),
      null,
      jsonb_build_array(jsonb_build_object(
        'source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work_' || number || '.jpg'
      ))
    );
  end loop;
end;
$$;

do $$
declare
  work uuid;
  recognition public.review_cards;
begin
  select id into work from public.artworks where title = 'Work 1';

  begin
    perform pg_temp.style_answer(work, true, now() + interval '2 days');
    raise exception 'a style answer was saved for an artwork never reviewed';
  exception when invalid_parameter_value then
    null;
  end;

  perform public.record_review(work, pg_temp.card(now() + interval '20 days'),
    '{"mode": "flashcard", "rating": 3}', date_trunc('day', now()), 'UTC');
  select * into recognition from public.review_cards where artwork_id = work and facet = 'recognise';

  perform pg_temp.style_answer(work, false, now() + interval '1 day');
  assert (select due from public.review_cards where artwork_id = work and facet = 'style')
      = now() + interval '1 day',
    'a wrong style answer does not bring the style back tomorrow';
  assert (select last_rating from public.review_cards where artwork_id = work and facet = 'style') = 1,
    'a wrong style answer is not kept as the last rating of the style card';
  assert (select card from public.review_cards as card where artwork_id = work and facet = 'recognise')
      = recognition,
    'a style answer changes the recognition card';
  assert not exists (select 1 from public.point_events where kind = 'right_answers'),
    'a wrong style answer gives a point';

  perform pg_temp.style_answer(work, true, now() + interval '9 days');
  assert (select due from public.review_cards where artwork_id = work and facet = 'style')
      < now() + interval '2 days',
    'a second style answer of the day schedules the style card again';
  assert (select practice from public.review_log where facet = 'style' order by id desc limit 1),
    'a second style answer of the day is not practice';
  assert not exists (select 1 from public.point_events where kind = 'right_answers'),
    'a right style answer given as practice gives a point';
  assert (
    select count(*) from public.review_log where facet = 'recognise' and not practice and artwork_id = work
  ) = 1,
    'a style answer turns the recognition answer of the day into practice';

  select id into work from public.artworks where title = 'Work 2';
  perform public.record_review(work, pg_temp.card(now() + interval '20 days'),
    '{"mode": "flashcard", "rating": 3}', date_trunc('day', now()), 'UTC');
  perform pg_temp.style_answer(work, true, now() + interval '2 days');
  assert (select answers from public.point_events where kind = 'right_answers') = 1,
    'the first right style answer of the day gives no point';
  assert not exists (select 1 from public.point_events where kind = 'plan_day' and plan_share is null),
    'a style answer breaks the plan of the day';

  begin
    perform public.record_review(work, pg_temp.card(now()),
      '{"facet": "style", "mode": "quiz_title", "rating": 2, "correct": true}');
    raise exception 'a style answer was saved for another kind of question';
  exception when check_violation then
    null;
  end;
end;
$$;

reset role;
delete from public.review_cards;
delete from public.review_log;
delete from public.point_events;
set local role authenticated;

do $$
declare
  session jsonb;
  previous jsonb;
  step jsonb;
begin
  insert into public.profiles (review_session_size) values (30);

  perform public.record_review(artwork.id, pg_temp.card(now() - interval '1 hour'),
      '{"mode": "flashcard", "rating": 3}')
    from public.artworks as artwork;
  perform public.record_review(artwork.id, pg_temp.card(now() - interval '1 hour'),
      '{"facet": "style", "mode": "quiz_style", "rating": 2, "correct": true}')
    from public.artworks as artwork
    where artwork.record_number <= 10;

  assert (select waiting from public.review_counts(date_trunc('day', now()))) = 30,
    'the menu counter does not count the round of 30 with its 6 style places';
  session := pg_temp.session();
  assert pg_temp.styles_asked(session) = 6,
    'a round of 30 with 10 style cards due does not ask 6 styles: ' || pg_temp.styles_asked(session);
  assert jsonb_array_length(session) = 30,
    'a round of 30 with style questions does not hold 30 questions: ' || jsonb_array_length(session);
  assert not exists (
    select 1 from jsonb_array_elements(session) as item
      join public.artworks as artwork on artwork.id = (item ->> 'artwork_id')::uuid
      where item ->> 'facet' = 'style' and artwork.record_number > 10
  ), 'a new style is asked while due style cards wait';
  assert not exists (
    select 1 from jsonb_array_elements(session) as item
      where item ->> 'mode' = 'quiz_style' and not item ? 'facet'
  ), 'the style is asked as a question about recognising an artwork';
  assert not exists (
    select 1 from jsonb_array_elements(session) as item
      where item ->> 'facet' = 'style' and (item -> 'card' is null or jsonb_typeof(item -> 'card') = 'null')
  ), 'a due style question does not carry its card';

  for attempt in 1..20 loop
    previous := null;
    for step in select value from jsonb_array_elements(pg_temp.session()) loop
      assert previous is null or previous ->> 'artwork_id' <> step ->> 'artwork_id',
        'a style question stands next to the same artwork';
      previous := step;
    end loop;
  end loop;

end;
$$;

reset role;
delete from public.review_cards where facet = 'style';
set local role authenticated;

do $$
declare
  session jsonb;
begin
  update public.profiles set review_session_size = 20;
  assert (select waiting from public.review_counts(date_trunc('day', now()))) = 20,
    'the menu counter does not count 4 places of a round of 20 for new styles';
  session := pg_temp.session();
  assert pg_temp.styles_asked(session) = 4,
    'a round of 20 with no style due does not ask 4 new styles: ' || pg_temp.styles_asked(session);
  assert not exists (
    select 1 from jsonb_array_elements(session) as item
      where item ->> 'facet' = 'style' and jsonb_typeof(item -> 'card') <> 'null'
  ), 'a new style question carries a card';

  assert pg_temp.styles_asked(pg_temp.session('flashcards')) = 0,
    'a round of flashcards asks for the style';
  assert pg_temp.styles_asked(pg_temp.session('quizzes')) = 4,
    'a round of quizzes does not ask for the style';
  assert pg_temp.styles_asked(pg_temp.session('mixed', 'style', 'Style 1')) = 0,
    'a round scoped to a style asks for the style';
  update public.profiles set review_quiz_kinds = array['quiz_title', 'quiz_image'];
  assert pg_temp.styles_asked(pg_temp.session()) = 0,
    'the style is asked while its quiz is switched off';
  update public.profiles set review_quiz_kinds = array['quiz_title', 'quiz_image', 'quiz_style'];
end;
$$;

reset role;
delete from public.review_cards where facet = 'recognise'
  and artwork_id in (select id from public.artworks where record_number > 2);
set local role authenticated;

do $$
declare
  session jsonb;
  seen jsonb := '[]';
begin
  session := pg_temp.session();
  assert pg_temp.styles_asked(session) = 2,
    'a style is asked for an artwork that was never recognised: ' || pg_temp.styles_asked(session);

  for attempt in 1..10 loop
    seen := seen || pg_temp.session('mixed', 'all', null, attempt);
  end loop;
  assert pg_temp.styles_asked(seen) > 0, 'a free round never asks for the style';
  assert not exists (select 1 from public.review_cards where facet = 'style'),
    'a free round saves a style card';
end;
$$;

reset role;

do $$
declare
  work uuid;
  card public.review_cards;
begin
  delete from public.review_cards;
  delete from public.review_log;
  select id into work from public.artworks where title = 'Work 5';
  insert into public.review_cards (artwork_id, owner_id, due, stability, difficulty, state)
    values (work, '00000000-0000-0000-0000-00000000000a', now(), 10, 5, 2);
  insert into public.review_log (artwork_id, owner_id, mode, rating, correct, reviewed_at)
    values
      (work, '00000000-0000-0000-0000-00000000000a', 'quiz_style', 2, true, '2026-10-01 10:00+00'),
      (work, '00000000-0000-0000-0000-00000000000a', 'quiz_style', 1, false, '2026-10-01 11:00+00'),
      (work, '00000000-0000-0000-0000-00000000000a', 'quiz_style', 2, true, '2026-10-04 09:00+00'),
      (work, '00000000-0000-0000-0000-00000000000a', 'quiz_title', 1, false, '2026-10-05 09:00+00');

  perform private.fill_style_cards();
  select * into card from public.review_cards where artwork_id = work and facet = 'style';
  assert card.reps = 2 and card.lapses = 0,
    'the style card is not built from the first style answer of each day: ' || card.reps || ' ' || card.lapses;
  assert card.last_review = '2026-10-04 09:00+00' and card.last_rating = 2,
    'the style card does not end at the last style answer';
  assert card.scheduled_days = 5 and card.due = '2026-10-09 09:00+00',
    'the style card is not scheduled as the review would schedule it: ' || card.scheduled_days;
  assert card.created_at = '2026-10-01 10:00+00',
    'the style card does not start at the first style answer';

  update public.review_cards set due = '2030-01-01' where artwork_id = work and facet = 'style';
  perform private.fill_style_cards();
  assert (select due from public.review_cards where artwork_id = work and facet = 'style') = '2030-01-01',
    'building the style cards again replaces a style card';
  assert (select count(*) from public.review_cards where facet = 'style') = 1,
    'a style card is built for an artwork without style answers';
end;
$$;

rollback;
