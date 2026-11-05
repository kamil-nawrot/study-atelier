\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

create function pg_temp.work(number integer)
returns uuid
language sql
as $$
  select artwork.id from public.artworks as artwork where artwork.title = 'Work ' || number;
$$;

create function pg_temp.typed(session jsonb)
returns setof jsonb
language sql
as $$
  select item from jsonb_array_elements(session) as item where item ->> 'mode' = 'quiz_typed';
$$;

do $$
declare
  day_start constant timestamptz := date_trunc('day', now());
  number integer;
  session jsonb;
  settled uuid[] := '{}';
begin
  insert into public.profiles default values;
  assert (select 'quiz_typed' = any (review_quiz_kinds) from public.profiles),
    'a new account does not type titles';

  for number in 1..20 loop
    perform public.save_artwork(
      jsonb_build_object('title', 'Work ' || number, 'author_unknown', true),
      '{}',
      null,
      jsonb_build_array(jsonb_build_object(
        'source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work_' || number || '.jpg'
      ))
    );
  end loop;
  for number in 1..9 loop
    perform public.record_review(pg_temp.work(number),
      jsonb_build_object('due', now() - interval '1 hour', 'stability', 20, 'difficulty', 4, 'state', 2,
        'reps', 4, 'lapses', 0, 'scheduled_days', 20, 'learning_steps', 0, 'last_review', now()),
      '{"mode": "flashcard", "rating": 3}');
    settled := settled || pg_temp.work(number);
  end loop;
  perform public.record_review(pg_temp.work(10),
    jsonb_build_object('due', now() - interval '1 hour', 'stability', 3, 'difficulty', 5, 'state', 2,
      'reps', 2, 'lapses', 0, 'scheduled_days', 3, 'learning_steps', 0, 'last_review', now()),
    '{"mode": "flashcard", "rating": 2}');

  session := public.review_session(day_start, 'mixed');
  assert (select count(*) from pg_temp.typed(session)) = 3,
    'a mixed session does not type every third settled artwork: ' || session::text;
  assert not exists (
    select 1 from pg_temp.typed(session) as item
      where not ((item ->> 'artwork_id')::uuid = any (settled)) or item -> 'options' <> '[]'
  ), 'a typed title asks about an artwork that is not settled, or carries options';

  assert (select count(*) from pg_temp.typed(public.review_session(day_start, 'quizzes'))) = 3,
    'the quizzes form does not type every third settled artwork';
  assert not exists (select 1 from pg_temp.typed(public.review_session(day_start, 'flashcards'))),
    'the flashcards form types a title';

  update public.profiles
    set review_quiz_kinds = array['quiz_title', 'quiz_image', 'quiz_author', 'quiz_style', 'quiz_pin'];
  assert not exists (select 1 from pg_temp.typed(public.review_session(day_start, 'mixed'))),
    'a title is typed while the kind is off';

  begin
    update public.profiles set review_quiz_kinds = array['quiz_typed'];
    raise exception 'the typed title was accepted as the only quiz kind';
  exception when check_violation then
    null;
  end;
  update public.profiles set review_quiz_kinds = array['quiz_style', 'quiz_typed'];

  perform public.record_review(settled[1],
    jsonb_build_object('due', now() + interval '40 days', 'stability', 40, 'difficulty', 4, 'state', 2,
      'reps', 5, 'lapses', 0, 'scheduled_days', 40, 'learning_steps', 0, 'last_review', now()),
    '{"mode": "quiz_typed", "rating": 3, "correct": true}');
  assert exists (
    select 1 from public.review_log where artwork_id = settled[1] and mode = 'quiz_typed' and correct
  ), 'a typed title answer is not logged';
end;
$$;

rollback;
