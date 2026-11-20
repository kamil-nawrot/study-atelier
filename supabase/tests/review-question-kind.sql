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

reset role;
with added as (
  insert into public.category_values (owner_id, category_code, name)
    values
      ('00000000-0000-0000-0000-00000000000a', 'style', 'Baroque'),
      ('00000000-0000-0000-0000-00000000000a', 'style', 'Realism'),
      ('00000000-0000-0000-0000-00000000000a', 'style', 'Cubism'),
      ('00000000-0000-0000-0000-00000000000a', 'style', 'Rococo')
    returning id, name
)
insert into public.artwork_values (artwork_id, value_id, owner_id)
  select artwork.id, added.id, artwork.owner_id
    from added
    join public.artworks as artwork on artwork.title = case added.name
      when 'Baroque' then 'Work 3' when 'Realism' then 'Work 4' when 'Cubism' then 'Work 5' else 'Work 6' end;
set local role authenticated;

do $$
declare
  styled uuid;
begin
  select id into styled from public.artworks where title = 'Work 3';
  update public.profiles set review_quiz_kinds = array['quiz_title', 'quiz_image', 'quiz_author', 'quiz_style'];

  perform pg_temp.answer(styled, 'flashcard', 3);
  assert pg_temp.asked(styled) = 'flashcard', 'the style is asked after the first answer of an artwork';

  perform pg_temp.answer(styled, 'flashcard', 3);
  assert pg_temp.asked(styled) = 'quiz_style', 'the style is not due after two other answers';

  perform pg_temp.answer(styled, 'quiz_style', 2);
  assert pg_temp.asked(styled) = 'flashcard', 'the style comes back right after it was asked';

  perform pg_temp.answer(styled, 'quiz_title', 2);
  perform pg_temp.answer(styled, 'quiz_image', 2);
  perform pg_temp.answer(styled, 'quiz_author', 2);
  assert pg_temp.asked(styled, 'quizzes') = 'quiz_style',
    'the quizzes form does not ask the style when it was asked least recently';

  update public.profiles set review_quiz_kinds = array['quiz_title', 'quiz_image', 'quiz_author'];
  assert pg_temp.asked(styled) = 'flashcard', 'the style is asked while the profile switched it off';
end;
$$;

do $$
declare
  styled uuid;
begin
  select id into styled from public.artworks where title = 'Work 3';
  update public.profiles
    set review_quiz_kinds = array['quiz_title', 'quiz_image', 'quiz_author', 'quiz_style', 'quiz_pin'];
  insert into public.artwork_pins (image_id, x, y, glossary_entry_id)
    select image.id, 0.5, 0.5, term.id
      from public.artwork_images as image, public.glossary_entries as term
      where image.artwork_id = styled and term.name = 'Apse';

  perform pg_temp.answer(styled, 'quiz_pin', 2);
  perform pg_temp.answer(styled, 'flashcard', 3);
  perform pg_temp.answer(styled, 'flashcard', 3);
  assert pg_temp.asked(styled) = 'quiz_style', 'the style does not win when it waits longer than the detail';

  insert into public.learner_flags (artwork_id, reason, question, holds)
    values (styled, 'answers', '{"mode": "quiz_style"}', true);
  assert pg_temp.asked(styled) = 'quiz_pin', 'a held style question keeps the detail from being asked';
end;
$$;

reset role;
with extra as (
  insert into public.artwork_images (artwork_id, owner_id, position, source_wikidata_id, source_image_file, broken_at)
    select artwork.id, artwork.owner_id, 1, 'Q3', 'Work_3_detail.jpg', now()
      from public.artworks as artwork
      where artwork.title = 'Work 3'
    returning id, artwork_id
)
update public.artwork_pins as pin set image_id = extra.id
  from extra, public.artwork_images as main
  where main.artwork_id = extra.artwork_id and main.position = 0 and pin.image_id = main.id;
set local role authenticated;

do $$
begin
  assert (
    select item -> 'pin' -> 'image' ->> 'broken_at'
      from jsonb_array_elements(public.review_session(date_trunc('day', now()), 'mixed', 'all', null, 0)) as item
      where item ->> 'artwork_id' = (select id::text from public.artworks where title = 'Work 3')
  ) is not null, 'the image of a pin question does not carry its stored broken state';
end;
$$;

do $$
declare
  ruled uuid;
  labels text[];
begin
  select id into ruled from public.artworks where title = 'Work 7';
  update public.profiles set review_quiz_kinds = array['quiz_title', 'quiz_image', 'quiz_author', 'quiz_pin'];
  insert into public.glossary_entries (name, category) values
    ('Charlemagne', 'ruler'), ('Otto', 'ruler'), ('Giotto', 'artist'), ('Duccio', 'artist');
  insert into public.artwork_pins (image_id, x, y, glossary_entry_id)
    select image.id, 0.5, 0.5, term.id
      from public.artwork_images as image, public.glossary_entries as term
      where image.artwork_id = ruled and term.name = 'Charlemagne';

  perform pg_temp.answer(ruled, 'flashcard', 3);
  perform pg_temp.answer(ruled, 'flashcard', 3);
  select array_agg(option ->> 'label' order by option ->> 'label')
    into labels
    from jsonb_array_elements(public.review_session(date_trunc('day', now()), 'mixed', 'all', null, 0)) as item,
      jsonb_array_elements(item -> 'options') as option
    where (item ->> 'artwork_id')::uuid = ruled and item ->> 'mode' = 'quiz_pin';
  assert labels = '{Charlemagne,Duccio,Giotto,Otto}',
    'the wrong answers of a figure are not drawn from its category first, then from the figures';
end;
$$;

rollback;
