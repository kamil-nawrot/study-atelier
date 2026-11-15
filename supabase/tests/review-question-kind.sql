\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

create function pg_temp.answer(work uuid, kind text, rating integer)
returns void
language sql
as $$
  select public.record_review(work,
    jsonb_build_object('due', now() - interval '1 hour', 'stability', 20, 'difficulty', 4, 'state', 2,
      'reps', 4, 'lapses', 0, 'scheduled_days', 20, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', kind, 'rating', rating)
      || case when kind = 'flashcard' then '{}'::jsonb else jsonb_build_object('correct', rating > 1) end);
$$;

create function pg_temp.asked(work uuid, form text default 'mixed')
returns text
language sql
as $$
  select item ->> 'mode'
    from jsonb_array_elements(public.review_session(date_trunc('day', now()), form, 'all', null, 0)) as item
    where (item ->> 'artwork_id')::uuid = work;
$$;

do $$
declare
  pinned uuid;
  forgotten uuid;
  term uuid;
begin
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
  select id into pinned from public.artworks where title = 'Work 1';
  select id into forgotten from public.artworks where title = 'Work 2';

  insert into public.glossary_entries (name, category) values ('Apse', 'architecture') returning id into term;
  insert into public.glossary_entries (name, category) values
    ('Nave', 'architecture'), ('Choir', 'architecture'), ('Portal', 'architecture');
  insert into public.artwork_pins (image_id, x, y, glossary_entry_id)
    select image.id, 0.5, 0.5, term from public.artwork_images as image where image.artwork_id = pinned;

  perform pg_temp.answer(pinned, 'flashcard', 3);
  assert pg_temp.asked(pinned) = 'flashcard', 'the detail is asked after the first answer of an artwork';

  perform pg_temp.answer(pinned, 'flashcard', 3);
  assert pg_temp.asked(pinned) = 'quiz_pin',
    'the detail does not win a tie with the typed title once both are due';
  assert pg_temp.asked(pinned) = 'quiz_pin' and pg_temp.asked(pinned) = 'quiz_pin',
    'the same artwork in the same state gets another question';

  perform pg_temp.answer(pinned, 'quiz_pin', 2);
  assert pg_temp.asked(pinned) = 'quiz_typed', 'the typed title does not stay due after the detail';

  perform pg_temp.answer(pinned, 'quiz_typed', 3);
  assert pg_temp.asked(pinned) = 'flashcard', 'a kind asked in the last two answers comes back';

  perform pg_temp.answer(pinned, 'flashcard', 3);
  assert pg_temp.asked(pinned) = 'quiz_pin', 'the detail is not due after two other answers';

  perform pg_temp.answer(pinned, 'flashcard', 3);
  assert pg_temp.asked(pinned) = 'quiz_pin',
    'the question waiting longer does not win when both are due';

  perform pg_temp.answer(pinned, 'quiz_pin', 2);
  assert pg_temp.asked(pinned) = 'quiz_typed', 'the typed title is not asked after waiting longer';

  insert into public.profiles (review_quiz_kinds) values (array['quiz_title', 'quiz_image', 'quiz_author']);
  assert pg_temp.asked(pinned, 'quizzes') = 'quiz_title',
    'the quizzes form does not ask the recognition quiz asked least recently';

  perform pg_temp.answer(forgotten, 'quiz_title', 1);
  assert pg_temp.asked(forgotten) = 'quiz_image',
    'a forgotten artwork does not get the recognition quiz asked least recently';
  perform pg_temp.answer(forgotten, 'quiz_image', 1);
  assert pg_temp.asked(forgotten) = 'quiz_title',
    'a forgotten artwork does not skip a kind its quiz cannot be built for';
end;
$$;

rollback;
