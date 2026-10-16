\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  forgotten uuid;
  known uuid;
  session jsonb;
  drawn integer;
  seen uuid[] := '{}';
  day_start constant timestamptz := date_trunc('day', now());
begin
  for number in 1..20 loop
    perform public.save_artwork(
      jsonb_build_object(
        'title', 'Work ' || number,
        'author_unknown', true,
        'era_code', 'early_modern',
        'source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work_' || number || '.jpg'
      ),
      jsonb_build_object('style', jsonb_build_array('Tenebrism', 'Style ' || (number % 5)))
    );
  end loop;

  select id into forgotten from public.artworks where title = 'Work 1';
  select id into known from public.artworks where title = 'Work 2';

  perform public.record_review(forgotten,
    jsonb_build_object('due', now() - interval '1 hour', 'stability', 1.2, 'difficulty', 6,
      'state', 2, 'reps', 3, 'lapses', 1, 'scheduled_days', 1, 'learning_steps', 0,
      'last_review', now() - interval '1 day'),
    '{"mode": "flashcard", "rating": 1}');
  perform public.record_review(known,
    jsonb_build_object('due', now() - interval '2 hours', 'stability', 20, 'difficulty', 4,
      'state', 2, 'reps', 4, 'lapses', 0, 'scheduled_days', 20, 'learning_steps', 0,
      'last_review', now() - interval '20 days'),
    '{"mode": "flashcard", "rating": 3}');

  session := public.review_session(day_start, 'mixed');

  assert (
    select item ->> 'mode' from jsonb_array_elements(session) as item
      where (item ->> 'artwork_id')::uuid = forgotten
  ) in ('quiz_title', 'quiz_image'),
    'a mixed session does not quiz an artwork whose last answer was forgotten';
  assert (
    select item ->> 'mode' from jsonb_array_elements(session) as item
      where (item ->> 'artwork_id')::uuid = known
  ) = 'flashcard',
    'a mixed session quizzes an artwork remembered for weeks';

  assert exists (
    select 1 from jsonb_array_elements(public.review_session(day_start, 'quizzes')) as item
      where item ->> 'mode' = 'quiz_style'
  ),
    'a session of quizzes over the whole collection never asks for the style';
  assert not exists (
    select 1
      from jsonb_array_elements(public.review_session(day_start, 'quizzes', 'style', 'Tenebrism')) as item
      where item ->> 'mode' = 'quiz_style'
  ),
    'a session scoped to a style asks for the style';

  for number in 21..40 loop
    perform public.save_artwork(
      jsonb_build_object(
        'title', 'Work ' || number,
        'author_unknown', true,
        'era_code', 'modern',
        'source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work_' || number || '.jpg'
      ),
      '{}'
    );
  end loop;

  for attempt in 1..6 loop
    seen := seen || array(
      select (item ->> 'artwork_id')::uuid
        from jsonb_array_elements(public.review_session(day_start, 'flashcards')) as item
    );
  end loop;
  select count(distinct id) into drawn
    from unnest(seen) as id
    where id not in (forgotten, known);
  assert drawn > 8,
    'review_session takes the new artworks in a fixed order instead of drawing them';
end;
$$;

rollback;
