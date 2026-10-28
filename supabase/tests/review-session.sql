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
        'era_code', 'early_modern'
      ),
      jsonb_build_object('style', jsonb_build_array('Tenebrism', 'Style ' || (number % 5))),
      null,
      jsonb_build_array(jsonb_build_object(
        'source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work_' || number || '.jpg'
      ))
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
        'era_code', 'modern'
      ),
      '{}',
      null,
      jsonb_build_array(jsonb_build_object(
        'source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work_' || number || '.jpg'
      ))
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

do $$
declare
  rounds jsonb := '[]';
  first_round jsonb;
  cards_before integer;
  log_before integer;
  day_start constant timestamptz := date_trunc('day', now());
begin
  for number in 3..24 loop
    perform public.record_review(
      (select id from public.artworks where title = 'Work ' || number),
      jsonb_build_object('due', now() + interval '10 days', 'stability', number, 'difficulty', 5,
        'state', 2, 'reps', 2, 'lapses', 0, 'scheduled_days', 10, 'learning_steps', 0,
        'last_review', now() - interval '1 day'),
      '{"mode": "flashcard", "rating": 3}');
  end loop;
  select count(*) into cards_before from public.review_cards;
  select count(*) into log_before from public.review_log;

  first_round := public.review_session(day_start, 'flashcards', 'all', null, 0);
  for attempt in 1..10 loop
    rounds := rounds || jsonb_build_array(public.review_session(day_start, 'flashcards', 'all', null, 0));
  end loop;

  assert jsonb_array_length(first_round) = 20,
    'a free round does not hold 20 artworks';
  assert not exists (
    select 1 from jsonb_array_elements(rounds) as round, jsonb_array_elements(round) as item
      where not exists (
        select 1 from public.review_cards as card
          where card.artwork_id = (item ->> 'artwork_id')::uuid
      )
  ),
    'a free round takes an artwork that was never reviewed';
  assert (
    select count(distinct item ->> 'artwork_id')
      from jsonb_array_elements(rounds) as round, jsonb_array_elements(round) as item
  ) > 20,
    'free rounds of the same scope always take the same artworks';
  assert (
    select count(distinct round -> 0 ->> 'artwork_id') from jsonb_array_elements(rounds) as round
  ) > 1,
    'free rounds of the same scope always start with the same artwork';
  assert (select count(*) from public.review_cards) = cards_before
    and (select count(*) from public.review_log) = log_before,
    'a free round writes a review';

  begin
    perform public.review_session(day_start, 'mixed', 'all', null, -1);
    raise exception 'a negative free round was accepted';
  exception when invalid_parameter_value then
    null;
  end;
end;
$$;

do $$
declare
  round jsonb;
  pinned jsonb;
  labels text[];
  apse uuid;
  nave uuid;
  day_start constant timestamptz := date_trunc('day', now());
begin
  insert into public.glossary_entries (name, category) values ('Apse', 'architecture')
    returning id into apse;
  insert into public.glossary_entries (name, category) values ('Nave', 'architecture')
    returning id into nave;
  insert into public.glossary_entries (name, category) values
    ('Choir', 'architecture'), ('Portal', 'architecture'), ('Fresco', 'technique'), ('Tondo', 'painting');
  insert into public.artwork_pins (image_id, x, y, glossary_entry_id)
    select image.id, 0.25, 0.75, apse from public.artwork_images as image
    union all
    select image.id, 0.5, 0.5, nave from public.artwork_images as image;
  update public.artwork_pins set glossary_entry_id = null, text = 'A note' where glossary_entry_id = nave;

  round := public.review_session(day_start, 'quizzes', 'all', null, 1);
  select item into pinned from jsonb_array_elements(round) as item where item ->> 'mode' = 'quiz_pin' limit 1;
  assert pinned is not null,
    'a session of quizzes never asks what a pinned detail is';
  assert (
    select count(*) from jsonb_array_elements(round) with ordinality as item (value, slot)
      where item.value ->> 'mode' = 'quiz_pin' and (item.slot - 1) % 3 <> 0
  ) = 0,
    'the question about a pin is asked more often than on every third slot';
  select array_agg(option ->> 'label' order by option ->> 'label') into labels
    from jsonb_array_elements(pinned -> 'options') as option;
  assert labels = array['Apse', 'Choir', 'Nave', 'Portal'],
    'the terms of a pin question do not come from the category of the right one first';
  assert (
    select option ->> 'label' from jsonb_array_elements(pinned -> 'options') as option
      where (option ->> 'right')::boolean
  ) = 'Apse',
    'the right answer of a pin question is not the term of the pin';
  assert (pinned -> 'pin' ->> 'x')::double precision = 0.25
    and (pinned -> 'pin' ->> 'y')::double precision = 0.75
    and (pinned -> 'pin' -> 'image' ->> 'source_image_file') like 'Work\_%',
    'a pin question does not say where the pin is';

  update public.artwork_pins set glossary_entry_id = nave, text = null where text = 'A note';
  labels := '{}';
  for attempt in 1..40 loop
    select coalesce(labels, '{}') || coalesce(array_agg(option ->> 'label'), '{}') into labels
      from jsonb_array_elements(public.review_session(day_start, 'quizzes', 'all', null, 1)) as item,
        jsonb_array_elements(item -> 'options') as option
      where item ->> 'mode' = 'quiz_pin' and (item -> 'pin' ->> 'x')::double precision = 0.25;
  end loop;
  assert cardinality(labels) > 0,
    'a pin question about the first pin of an image is never asked';
  assert not 'Nave' = any (labels),
    'a pin question offers the term of another pin on the same image';

  assert not exists (
    select 1
      from jsonb_array_elements(public.review_session(day_start, 'flashcards', 'all', null, 1)) as item
      where item ->> 'mode' = 'quiz_pin'
  ),
    'a session of flashcards asks what a pinned detail is';

  update public.artwork_pins set view_width = 0.2;
  assert exists (
    select 1
      from jsonb_array_elements(public.review_session(day_start, 'quizzes', 'all', null, 1)) as item
      where item ->> 'mode' = 'quiz_pin'
  ),
    'a pin that keeps a view of the loupe is never asked about';
  update public.artwork_pins set view_width = null;

  delete from public.glossary_entries where name in ('Choir', 'Portal', 'Fresco', 'Tondo');
  assert not exists (
    select 1
      from jsonb_array_elements(public.review_session(day_start, 'quizzes', 'all', null, 1)) as item
      where item ->> 'mode' = 'quiz_pin'
  ),
    'a pin question is asked with fewer than four terms in the glossary';
end;
$$;

do $$
declare
  day_start constant timestamptz := date_trunc('day', now());
  modes text[];
begin
  insert into public.profiles (review_session_size, review_new_per_day) values (10, 5);

  assert jsonb_array_length(public.review_session(day_start, 'flashcards', 'all', null, 0)) = 10,
    'a free round ignores the size from the profile';
  assert jsonb_array_length(public.review_session(day_start, 'flashcards')) <= 5,
    'a session takes more new artworks than the profile allows per day';

  assert (
    select fetch_image and fetch_definition and fetch_forms and fetch_event from public.profiles
  ), 'a new profile switches an automatic fetch off';
  update public.profiles
    set fetch_image = false, fetch_definition = false, fetch_forms = false, fetch_event = false;
  assert (
    select not (fetch_image or fetch_definition or fetch_forms or fetch_event) from public.profiles
  ), 'the automatic fetches cannot be switched off';
  update public.profiles
    set fetch_image = true, fetch_definition = true, fetch_forms = true, fetch_event = true;

  update public.profiles set review_quiz_kinds = array['quiz_image'];
  select array_agg(distinct item ->> 'mode') into modes
    from jsonb_array_elements(public.review_session(day_start, 'quizzes')) as item;
  assert modes = array['quiz_image'],
    'a session asks a kind of quiz the profile switched off: ' || modes::text;

  update public.profiles set review_quiz_kinds = array['quiz_style'];
  select array_agg(distinct item ->> 'mode') into modes
    from jsonb_array_elements(public.review_session(day_start, 'quizzes', 'style', 'Tenebrism')) as item;
  assert modes = array['flashcard'],
    'a session scoped to a style asks the style or something the profile switched off: ' || modes::text;

  update public.profiles set review_quiz_kinds = array['quiz_style', 'quiz_title'];
  select array_agg(distinct item ->> 'mode') into modes
    from jsonb_array_elements(public.review_session(day_start, 'quizzes', 'style', 'Tenebrism')) as item;
  assert modes = array['quiz_title'],
    'a session scoped to a style does not fall back to the kinds that remain: ' || modes::text;

  update public.profiles
    set review_quiz_kinds = array['quiz_title', 'quiz_image', 'quiz_author', 'quiz_style', 'quiz_pin'];

  begin
    update public.profiles set review_quiz_kinds = '{}';
    raise exception 'an empty list of quiz kinds was accepted';
  exception when check_violation then
    null;
  end;
  begin
    update public.profiles set review_session_size = 25;
    raise exception 'a size of 25 was accepted';
  exception when check_violation then
    null;
  end;
  begin
    update public.profiles set review_form = 'anything';
    raise exception 'an unknown review form was accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

do $$
declare
  day_start constant timestamptz := date_trunc('day', now());
  authors constant jsonb := '[
    ["Gentile Bellini", "Giovanni Bellini"], ["Giovanni Bellini"], ["Titian"], ["Giorgione"], ["Carpaccio"]
  ]';
  asked jsonb := '[]';
  pair uuid;
begin
  for number in 0..4 loop
    perform public.record_review(
      (select saved.id from public.save_artwork(
        jsonb_build_object('title', 'Venetian ' || number, 'era_code', 'early_modern'),
        jsonb_build_object('author', authors -> number),
        null,
        jsonb_build_array(jsonb_build_object(
          'source_wikidata_id', 'Q9' || number,
          'source_image_file', 'Venetian_' || number || '.jpg'
        ))
      ) as saved),
      jsonb_build_object('due', now() + interval '10 days', 'stability', 10, 'difficulty', 5,
        'state', 2, 'reps', 2, 'lapses', 0, 'scheduled_days', 10, 'learning_steps', 0,
        'last_review', now() - interval '1 day'),
      '{"mode": "flashcard", "rating": 3}');
  end loop;
  select id into pair from public.artworks where title = 'Venetian 0';

  for attempt in 1..30 loop
    asked := asked || coalesce((
      select jsonb_agg(item)
        from jsonb_array_elements(public.review_session(day_start, 'quizzes', 'all', null, attempt)) as item
        where item ->> 'mode' = 'quiz_author'
    ), '[]');
  end loop;

  assert jsonb_array_length(asked) > 0, 'a session of quizzes never asks for the author';
  assert not exists (
    select 1 from jsonb_array_elements(asked) as item
      join public.artworks as artwork on artwork.id = (item ->> 'artwork_id')::uuid
      where artwork.title not like 'Venetian %'
  ), 'an artwork with an unknown author is asked for its author';
  assert not exists (
    select 1 from jsonb_array_elements(asked) as item
      where jsonb_array_length(item -> 'options') <> 4
  ), 'an author question has other than four answers';
  assert not exists (
    select 1 from jsonb_array_elements(asked) as item,
        jsonb_array_elements(item -> 'options') as option
      where (item ->> 'artwork_id')::uuid = pair
        and option ->> 'right' is null
        and option ->> 'label' like '%Bellini%'
  ), 'a wrong answer shares an author with the right one';
  assert not exists (
    select 1 from jsonb_array_elements(asked) as item,
        jsonb_array_elements(item -> 'options') as option
      where (item ->> 'artwork_id')::uuid = pair
        and option ->> 'right' = 'true'
        and option ->> 'label' <> 'Gentile Bellini, Giovanni Bellini'
  ), 'the authors of one artwork are not one answer';

  update public.profiles set review_quiz_kinds = array['quiz_title', 'quiz_image', 'quiz_style', 'quiz_pin'];
  assert not exists (
    select 1
      from jsonb_array_elements(public.review_session(day_start, 'quizzes', 'all', null, 1)) as item
      where item ->> 'mode' = 'quiz_author'
  ), 'a session asks for the author when the profile switched it off';
end;
$$;

rollback;
