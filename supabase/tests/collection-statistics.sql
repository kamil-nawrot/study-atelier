\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  work record;
begin
  for work in
    select * from (values
      ('Mona Lisa', 'Leonardo da Vinci'),
      ('Annunciation', 'Leonardo da Vinci'),
      ('David', 'Michelangelo'),
      ('Sistine Chapel', 'Michelangelo'),
      ('Night Watch', 'Rembrandt'),
      ('Archived', 'Ghost'),
      ('Twin work', 'Twin'),
      ('Study 1', 'Unknown'),
      ('Study 2', 'Unknown'),
      ('Study 3', 'Unknown'),
      ('Study 4', 'Unknown')
    ) as rows (title, author)
  loop
    perform public.save_artwork(jsonb_build_object('title', work.title),
      jsonb_build_object('author', jsonb_build_array(work.author)), null,
      jsonb_build_array(jsonb_build_object('own_image_url', 'https://example.com/' || work.title || '.jpg')));
  end loop;

  perform public.save_value_details(id, '{"birth_year": 1452, "death_year": 1519}')
    from public.category_values where name = 'Leonardo da Vinci';
  perform public.save_value_details(id, '{"birth_year": 1475, "death_year": 1564}')
    from public.category_values where name = 'Michelangelo';
  perform public.save_value_details(id, '{"birth_year": 1475, "death_year": 1564, "sort_name": "A Twin"}')
    from public.category_values where name = 'Twin';
  perform public.save_value_details(id, '{"birth_year": 1606, "death_year": 1669}')
    from public.category_values where name = 'Rembrandt';
  perform public.save_value_details(id, '{"birth_year": 1400, "death_year": 1500}')
    from public.category_values where name = 'Ghost';

  insert into public.artwork_pins (image_id, x, y, text)
    select image.id, 0.5, 0.5, 'Pin'
    from public.artwork_images as image
    join public.artworks as artwork on artwork.id = image.artwork_id,
      generate_series(1, case artwork.title when 'Archived' then 5 else 2 end)
    where artwork.title in ('Mona Lisa', 'David', 'Archived');

  perform public.save_visit('{"visited_on": "2026-05-01", "date_precision": "day"}', 'Louvre',
    array(select id from public.artworks where title in ('Mona Lisa', 'Annunciation')));
  perform public.save_visit('{"visited_on": "2026-04-01", "date_precision": "day"}', 'Uffizi',
    array(select id from public.artworks where title in ('David', 'Sistine Chapel')));
  perform public.save_visit('{"visited_on": "2026-03-01", "date_precision": "month"}', 'Rijksmuseum',
    array(select id from public.artworks where title in ('Night Watch', 'Archived')));
  perform public.save_visit(
    '{"kind": "trip", "visited_on": "2026-02-10", "date_precision": "day", "ends_on": "2026-02-14"}', 'Florence',
    array(select id from public.artworks where title like 'Study %'));

  insert into public.glossary_entries (name, category) values ('Sfumato', 'general');
  insert into public.timeline_events (name, year_to) values ('Fall of Constantinople', 1453);
end;
$$;

reset role;

update public.artworks set deleted_at = now() where title = 'Archived';

insert into public.review_log (artwork_id, owner_id, mode, rating, correct, reviewed_at)
  select artwork.id, artwork.owner_id, answer.mode, 3, answer.correct, now()
  from public.artworks as artwork
  join (values
    ('Mona Lisa', 'flashcard', null::boolean),
    ('Mona Lisa', 'quiz_title', true),
    ('Mona Lisa', 'quiz_title', true),
    ('Mona Lisa', 'quiz_title', true),
    ('Mona Lisa', 'quiz_image', false),
    ('Annunciation', 'flashcard', null),
    ('Annunciation', 'flashcard', null),
    ('Annunciation', 'flashcard', null),
    ('David', 'flashcard', null),
    ('David', 'flashcard', null),
    ('David', 'flashcard', null),
    ('Sistine Chapel', 'flashcard', null),
    ('Sistine Chapel', 'flashcard', null)
  ) as answer (title, mode, correct) on answer.title = artwork.title;

insert into public.review_log (artwork_id, owner_id, mode, rating, correct, reviewed_at)
  select artwork.id, artwork.owner_id, 'quiz_title', 3, true, now()
  from public.artworks as artwork, generate_series(1, 10)
  where artwork.title = 'Archived';

insert into public.review_log (artwork_id, owner_id, mode, rating, reviewed_at)
  select artwork.id, artwork.owner_id, 'flashcard', 3, now()
  from public.artworks as artwork, generate_series(1, 4)
  where artwork.title like 'Study %';

update public.artworks
  set created_at = ((now() at time zone 'Europe/Warsaw')::date + time '00:15') at time zone 'Europe/Warsaw';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  archived uuid := gen_random_uuid();
begin
  perform public.save_exhibition(gen_random_uuid(), 'Shown', '{"type": "doc", "content": []}');
  perform public.save_exhibition(archived, 'Archived', '{"type": "doc", "content": []}');
  update public.exhibitions set deleted_at = now() where id = archived;
end;
$$;

do $$
declare
  stats jsonb := public.collection_statistics();
  reviewed jsonb := stats -> 'most_reviewed';
begin
  assert (stats ->> 'terms')::int = 1, 'the terms are not counted';
  assert (stats ->> 'events')::int = 1, 'the events are not counted';
  assert (stats ->> 'visits')::int = 3, 'the visits are not counted, or count trips';
  assert (stats ->> 'trips')::int = 1, 'the trips are not counted';
  assert (stats ->> 'exhibitions')::int = 1, 'the exhibitions are not counted, or those in Archiwum are';

  assert (stats ->> 'quiz_answers')::int = 4, 'quiz answers count flashcards or archived artworks';
  assert (stats ->> 'correct_answers')::int = 3, 'correct answers count archived artworks';

  assert jsonb_array_length(reviewed) = 5, 'the most reviewed are not capped at 5';
  assert (select title from public.artworks where id = (reviewed -> 0 ->> 'artwork_id')::uuid) = 'Mona Lisa',
    'the most reviewed do not start with the artwork reviewed most often';
  assert (reviewed -> 0 ->> 'times')::int = 5, 'the times of the most reviewed are wrong';
  assert (select array_agg(title order by title) from public.artworks
      where id in (select (item ->> 'artwork_id')::uuid from jsonb_array_elements(reviewed) as item))
    = array['Mona Lisa', 'Study 1', 'Study 2', 'Study 3', 'Study 4'],
    'the most reviewed are not ordered by times and then record number';
  assert not exists (
    select 1 from jsonb_array_elements(reviewed) as item
    where (item ->> 'artwork_id')::uuid = (select id from public.artworks where title = 'Archived')),
    'an archived artwork is among the most reviewed';

  assert (stats -> 'longest_lived' ->> 'name') = 'Michelangelo',
    'the longest-lived author is not the one with the most artworks among the tied';
  assert (stats -> 'longest_lived' ->> 'tied')::int = 1, 'the tied authors are not counted';
  assert (stats ->> 'authors_with_years')::int = 4,
    'authors with years count an author of archived artworks only';

  assert (select title from public.artworks where id = (stats -> 'most_pinned' ->> 'artwork_id')::uuid) = 'Mona Lisa',
    'the most pinned artwork is not the first by record number among the tied, or counts archived pins';
  assert (stats -> 'most_pinned' ->> 'pins')::int = 2, 'the pins are not counted';
  assert (stats -> 'most_pinned' ->> 'tied')::int = 1, 'the tied pinned artworks are not counted';

  assert (stats -> 'largest_visit' ->> 'place') = 'Uffizi', 'the largest visit is a trip, or not the earliest among the tied';
  assert (stats -> 'largest_visit' ->> 'artworks')::int = 2, 'the artworks of a visit count archived ones';
  assert (stats -> 'largest_visit' ->> 'tied')::int = 1, 'the tied visits are not counted';

  assert (stats -> 'growth' ->> 'unit') = 'day', 'a collection started today is not counted in days';
  assert (stats -> 'growth' ->> 'first_day')::date = (now() at time zone 'Europe/Warsaw')::date,
    'the day of an addition is not read in Polish time';
  assert jsonb_array_length(stats -> 'growth' -> 'buckets') = 1, 'a collection of one day has more than one bucket';
  assert (stats -> 'growth' -> 'buckets' -> 0 ->> 'added')::int = 10, 'the additions count archived artworks';
end;
$$;

reset role;

update public.artworks set created_at = now() - interval '10 days' where title = 'Mona Lisa';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  growth jsonb := public.collection_statistics() -> 'growth';
begin
  assert growth ->> 'unit' = 'day', 'a collection of ten days is not counted in days';
  assert jsonb_array_length(growth -> 'buckets') = 11, 'days without additions are not empty buckets';
  assert (select sum((bucket ->> 'added')::int) from jsonb_array_elements(growth -> 'buckets') as bucket) = 10,
    'the days do not add up to the artworks';
  assert (growth -> 'buckets' -> 0 ->> 'added')::int = 1, 'the first day does not hold its addition';
end;
$$;

reset role;

update public.artworks set created_at = now() - interval '40 days' where title = 'Mona Lisa';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  growth jsonb := public.collection_statistics() -> 'growth';
begin
  assert growth ->> 'unit' = 'week', 'a collection of forty days is not counted in weeks';
  assert jsonb_array_length(growth -> 'buckets') between 6 and 7, 'forty days do not make six or seven weeks';
  assert extract(isodow from (growth -> 'buckets' -> 0 ->> 'start')::date) = 1, 'a week does not start on Monday';
end;
$$;

reset role;

update public.artworks set created_at = now() - interval '400 days' where title = 'Mona Lisa';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  growth jsonb := public.collection_statistics() -> 'growth';
begin
  assert growth ->> 'unit' = 'month', 'a collection of over a year is not counted in months';
  assert jsonb_array_length(growth -> 'buckets') between 14 and 15, 'four hundred days do not make 14 or 15 months';
  assert (select sum((bucket ->> 'added')::int) from jsonb_array_elements(growth -> 'buckets') as bucket) = 10,
    'the months do not add up to the artworks';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  stats jsonb := public.collection_statistics();
begin
  assert (stats ->> 'terms')::int = 0 and (stats ->> 'visits')::int = 0, 'B sees the data of A';
  assert (stats ->> 'quiz_answers')::int = 0, 'B sees the answers of A';
  assert stats -> 'most_reviewed' = '[]'::jsonb, 'B sees the reviews of A';
  assert stats -> 'growth' = 'null'::jsonb, 'an empty atelier has a growth';
  assert stats -> 'longest_lived' = 'null'::jsonb and stats -> 'most_pinned' = 'null'::jsonb
    and stats -> 'largest_visit' = 'null'::jsonb, 'an empty atelier has records';
end;
$$;

rollback;

\echo 'collection_statistics: done'
