\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test'),
  ('00000000-0000-0000-0000-00000000000c', 'owner-c@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  number integer;
begin
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'collection') = 0,
    'an empty atelier has artworks';
  assert (select count(*) from public.exhibit_tiers) = 0, 'an empty atelier unlocks a tier';

  for number in 1..10 loop
    perform public.save_artwork(
      jsonb_build_object('title', 'Work ' || number, 'author_unknown', true,
        'era_code', case when number <= 5 then 'early_modern' else 'modern' end),
      '{}', null,
      jsonb_build_array(jsonb_build_object('source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work' || number || '.jpg')));
  end loop;

  assert (select new_tiers from public.career_standing('UTC', false)) = 0,
    'career_standing unlocks tiers when asked not to';
  assert (select new_tiers from public.career_standing('UTC', true)) > 0,
    'career_standing does not unlock the tiers of new artworks';

  assert (select array_agg(room || ':' || exhibit order by position)
      from public.unlock_exhibits('UTC') with ordinality as listed (exhibit, room, hidden, value, thresholds, position))
    = array[
    'main_hall:collection', 'main_hall:vasari_lives', 'main_hall:own_eye', 'main_hall:pinacotheca',
    'era_enfilade:eras', 'era_enfilade:prehistory', 'era_enfilade:antiquity', 'era_enfilade:middle_ages',
    'era_enfilade:early_modern', 'era_enfilade:modern', 'era_enfilade:contemporary',
    'reading_room:memory', 'reading_room:bullseye', 'reading_room:regular', 'reading_room:back_from_storage',
    'reading_room:night_watch', 'reading_room:marathon', 'reading_room:amateur_magnifier',
    'scriptorium:glossary', 'scriptorium:timeline', 'scriptorium:hortus_cliffortianus', 'scriptorium:figure_alphabet',
    'map_room:chronicle', 'map_room:grand_tour', 'map_room:seen_live', 'map_room:trevi_fountain',
    'map_room:seven_league_boots', 'pavilion:crystal_palace', 'pavilion:lenoir_chapel', 'crypt:mouth_of_truth',
    'crypt:candle_moths'
  ], 'the exhibits are not the agreed thirty-one in their rooms and order';
  assert (select array_agg(exhibit order by exhibit) from public.unlock_exhibits('UTC') where hidden) = array[
    'amateur_magnifier', 'back_from_storage', 'candle_moths', 'figure_alphabet', 'lenoir_chapel', 'marathon',
    'mouth_of_truth', 'night_watch', 'pinacotheca', 'seven_league_boots', 'trevi_fountain'
  ], 'the hidden exhibits are not the agreed eleven';
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'early_modern') = 5,
    'an era exhibit does not count the artworks of its era';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'modern') = array[1]::smallint[],
    'five modern artworks do not unlock the first tier of modern';
  assert (select tiers from public.exhibit_tiers where exhibit = 'early_modern') = 6,
    'a lit tier of an era exhibit does not keep its six tiers';
  assert not exists (select 1 from public.exhibit_tiers where exhibit = 'prehistory'),
    'an era without artworks unlocks a tier';
  assert (select array_agg(tier order by tier) from public.exhibit_tiers where exhibit = 'collection') = array[1, 2]::smallint[],
    'ten artworks do not unlock the first two tiers of the collection';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'eras') = array[1]::smallint[],
    'artworks of two eras do not unlock the first tier of eras';
  assert (select array_agg(distinct tiers) from public.exhibit_tiers where exhibit = 'collection') = array[9]::smallint[],
    'a lit tier does not keep how many tiers its exhibit has';
  assert (select tiers from public.exhibit_tiers where exhibit = 'eras') = 5,
    'a lit tier of the eras does not keep its five tiers';
  assert (select count(*) from public.exhibit_tiers where seen_at is not null) = 0, 'a new tier is already seen';
  assert (select new_tiers from public.career_standing('UTC', false))
      = (select count(*) from public.exhibit_tiers where seen_at is null),
    'career_standing does not count the tiers not seen yet';
  assert (select points from public.career_standing('UTC', false)) = public.learner_points(),
    'career_standing does not give the points of the ledger';
  assert (select rank_seen from public.career_standing('UTC', false)) = 0,
    'career_standing gives a seen rank to a learner without a profile';
  insert into public.profiles (rank_seen) values (3);
  assert (select rank_seen from public.career_standing('UTC', false)) = 3,
    'career_standing does not give the seen rank';

  delete from public.artworks where title in ('Work 9', 'Work 10', 'Work 8', 'Work 7', 'Work 6');
  perform public.unlock_exhibits('UTC');
  assert (select count(*) from public.exhibit_tiers where exhibit in ('collection', 'eras')) = 3,
    'deleting artworks takes an unlocked tier back';
  assert exists (select 1 from public.exhibit_tiers where exhibit = 'modern'),
    'deleting the artworks of an era takes its unlocked tier back';

  update public.exhibit_tiers set seen_at = now();
  assert (select count(*) from public.exhibit_tiers where seen_at is null) = 0, 'a tier cannot be marked as seen';

  perform public.record_free_answers('2026-10-29T00:00:00Z', 600);
  perform public.record_free_answers('2026-10-29T00:00:00Z', 400);
  assert (select answers from public.free_review_days) = 1000, 'free answers of a day are not added up';
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'marathon') = 1000,
    'the marathon does not count the free answers of a day';
  assert exists (select 1 from public.exhibit_tiers where exhibit = 'marathon'), 'the marathon is not unlocked';
  assert (select count(*) from public.point_events where kind = 'easter_egg' and code = 'marathon') = 1,
    'the marathon gives no bonus';
  perform public.unlock_exhibits('UTC');
  assert (select count(*) from public.point_events where kind = 'easter_egg') = 1, 'an easter egg pays twice';
  assert public.learner_points() = 70, 'an easter egg is not worth 50 points';
end;
$$;

reset role;

insert into public.review_log (artwork_id, owner_id, mode, rating, reviewed_at)
  select artwork.id, artwork.owner_id, 'flashcard', 3, '2026-10-28T01:30:00Z'
    from public.artworks as artwork where artwork.title = 'Work 1';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  assert (select value from public.unlock_exhibits('America/New_York') where exhibit = 'night_watch') = 0,
    'a review in the evening of the learner counts as a night one';
  assert (select value from public.unlock_exhibits('Europe/Warsaw') where exhibit = 'night_watch') = 1,
    'a review after midnight of the learner is not a night one';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert (select count(*) from public.exhibit_tiers) = 0, 'B reads the exhibit tiers of A';
  assert (select count(*) from public.free_review_days) = 0, 'B reads the free review days of A';
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'collection') = 0,
    'B counts the artworks of A';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}', true);

do $$
begin
  perform public.import_atelier(jsonb_build_object(
    'exhibit_tiers', jsonb_build_array(jsonb_build_object(
      'exhibit', 'collection', 'tier', 3, 'unlocked_at', '2026-10-01T00:00:00Z', 'seen_at', '2026-10-02T00:00:00Z')),
    'free_review_days', jsonb_build_array(jsonb_build_object('day_start', '2026-10-01T00:00:00Z', 'answers', 40))));
  assert (select unlocked_at from public.exhibit_tiers where tier = 3) = '2026-10-01T00:00:00Z',
    'the import does not restore the unlocked tiers of the copy';
  assert (select answers from public.free_review_days) = 40, 'the import does not restore the free review days';

  perform public.import_atelier(jsonb_build_object(
    'exhibit_tiers', jsonb_build_array(jsonb_build_object('exhibit', 'collection', 'tier', 3)),
    'free_review_days', jsonb_build_array(jsonb_build_object('day_start', '2026-10-01T00:00:00Z', 'answers', 40))));
  assert (select count(*) from public.exhibit_tiers) = 1, 'the import adds tiers to an account that has them';
end;
$$;

reset role;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000d', 'owner-d@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000d", "role": "authenticated"}', true);

do $$
declare
  work uuid;
begin
  perform public.save_artwork(
    jsonb_build_object('title', 'Returned', 'author_unknown', true, 'era_code', 'modern'),
    '{}', null,
    '[{"source_wikidata_id": "Q99", "source_image_file": "Returned.jpg"}]');
  select id into work from public.artworks where title = 'Returned';
  perform public.record_review(work,
    jsonb_build_object('due', '2026-12-30T00:00:00Z', 'stability', 9, 'difficulty', 5, 'state', 2, 'reps', 4,
      'lapses', 1, 'scheduled_days', 9, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3));

  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'back_from_storage') = array[1],
    'the Mona Lisa has more than one tier';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'back_from_storage') = array[1]::smallint[],
    'an artwork forgotten and settled again does not unlock the Mona Lisa';
  assert (select count(*) from public.point_events where kind = 'easter_egg' and code = 'back_from_storage') = 1,
    'the Mona Lisa gives no bonus';
end;
$$;

do $$
begin
  insert into public.feedback (kind, title) values ('bug', 'A bug');
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'mouth_of_truth') = 0,
    'a bug report counts as an idea';
  assert not exists (select 1 from public.exhibit_tiers where exhibit = 'mouth_of_truth'),
    'a bug report unlocks the mouth of truth';

  insert into public.feedback (kind, title) values ('idea', 'An idea'), ('idea', 'Another idea');
  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'mouth_of_truth') = array[1],
    'the mouth of truth has more than one tier';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'mouth_of_truth') = array[1]::smallint[],
    'an idea does not unlock the mouth of truth';
  perform public.unlock_exhibits('UTC');
  assert (select count(*) from public.point_events where kind = 'easter_egg' and code = 'mouth_of_truth') = 1,
    'the mouth of truth does not give its bonus once';
end;
$$;

do $$
declare
  pinned uuid;
  trashed uuid;
begin
  perform public.save_artwork(
    jsonb_build_object('title', 'Pinned', 'author_unknown', true, 'era_code', 'modern'),
    '{}', null, '[{"source_wikidata_id": "Q101", "source_image_file": "Pinned.jpg"}]');
  perform public.save_artwork(
    jsonb_build_object('title', 'Trashed', 'author_unknown', true, 'era_code', 'modern'),
    '{}', null, '[{"source_wikidata_id": "Q102", "source_image_file": "Trashed.jpg"}]');
  select image.id into pinned from public.artwork_images as image
    join public.artworks as artwork on artwork.id = image.artwork_id where artwork.title = 'Pinned';
  select image.id into trashed from public.artwork_images as image
    join public.artworks as artwork on artwork.id = image.artwork_id where artwork.title = 'Trashed';

  insert into public.artwork_pins (image_id, x, y, text)
    select pinned, 0.5, 0.5, 'Pin ' || number from generate_series(1, 9) as number;
  insert into public.artwork_pins (image_id, x, y, text)
    select trashed, 0.5, 0.5, 'Pin ' || number from generate_series(1, 10) as number;
  update public.artworks set deleted_at = now() where title = 'Trashed';

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'pinacotheca') = 9,
    'the pinacotheca does not count the most pins on one image outside the trash';
  assert not exists (select 1 from public.exhibit_tiers where exhibit = 'pinacotheca'),
    'an image in the trash or with fewer than ten pins unlocks the pinacotheca';

  insert into public.artwork_pins (image_id, x, y, text) values (pinned, 0.5, 0.5, 'Pin 10');
  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'pinacotheca') = array[10],
    'the pinacotheca does not have one tier at ten pins';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'pinacotheca') = array[1]::smallint[],
    'an image full of pins does not unlock the pinacotheca';

  delete from public.artwork_pins where image_id = pinned and text = 'Pin 10';
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'pinacotheca') = 9,
    'a deleted pin still counts';
  assert exists (select 1 from public.exhibit_tiers where exhibit = 'pinacotheca'),
    'a deleted pin takes the pinacotheca back';
  assert (select count(*) from public.point_events where kind = 'easter_egg' and code = 'pinacotheca') = 1,
    'the pinacotheca does not give its bonus once';
end;
$$;

reset role;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000e', 'owner-e@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000e", "role": "authenticated"}', true);

do $$
declare
  number integer;
  prolific uuid;
  shared uuid;
  trashed uuid;
begin
  insert into public.category_values (category_code, name) values
    ('author', 'Prolific'), ('author', 'Shared'), ('author', 'Trashed');
  select id into prolific from public.category_values where name = 'Prolific';
  select id into shared from public.category_values where name = 'Shared';
  select id into trashed from public.category_values where name = 'Trashed';
  for number in 1..29 loop
    perform public.save_artwork(
      jsonb_build_object('title', 'Authored ' || number, 'author_unknown', true, 'era_code', 'modern'),
      '{}', null,
      jsonb_build_array(jsonb_build_object('source_wikidata_id', 'Q' || (200 + number),
        'source_image_file', 'Authored' || number || '.jpg')));
  end loop;
  insert into public.artwork_values (artwork_id, value_id)
    select artwork.id,
        case when artwork.record_number <= 10 then prolific when artwork.record_number <= 19 then shared else trashed end
      from public.artworks as artwork;
  insert into public.artwork_values (artwork_id, value_id)
    select artwork.id, shared from public.artworks as artwork where artwork.title = 'Authored 1';
  update public.artworks set deleted_at = now() where title = 'Authored 29';

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'vasari_lives') = 2,
    'the book of Vasari does not count each author of an artwork, or counts an artwork in the trash';
  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'vasari_lives') = array[1, 3, 5, 10, 20],
    'the book of Vasari does not have the agreed tiers';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'vasari_lives') = array[1]::smallint[],
    'two authors with ten artworks do not unlock the first tier of the book of Vasari';
end;
$$;

do $$
declare
  first_place uuid;
  second_place uuid;
  third_place uuid;
  morning uuid;
  elsewhere uuid;
  later uuid;
  long_ago uuid;
begin
  insert into public.category_values (category_code, name) values
    ('location', 'First'), ('location', 'Second'), ('location', 'Third');
  select id into first_place from public.category_values where name = 'First';
  select id into second_place from public.category_values where name = 'Second';
  select id into third_place from public.category_values where name = 'Third';
  insert into public.visits (place_id, visited_on, date_precision) values
    (first_place, '2026-05-14', 'day'), (second_place, '2026-05-14', 'day'), (first_place, '2026-05-14', 'day'),
    (third_place, '2026-05-01', 'month'), (third_place, '2025-01-01', 'year');
  select id into morning from public.visits where place_id = first_place order by created_at, id limit 1;
  select id into elsewhere from public.visits where place_id = second_place;
  select id into later from public.visits where date_precision = 'month';
  select id into long_ago from public.visits where date_precision = 'year';

  insert into public.visit_artworks (visit_id, artwork_id)
    select visit, artwork.id from public.artworks as artwork, unnest(array[morning, elsewhere]) as visit
      where artwork.title = 'Authored 1';
  insert into public.visit_artworks (visit_id, artwork_id)
    select visit, artwork.id from public.artworks as artwork, unnest(array[morning, long_ago]) as visit
      where artwork.title = 'Authored 29';

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'trevi_fountain') = 1,
    'the Trevi fountain counts two visits of one day, or an artwork in the trash';
  assert not exists (select 1 from public.exhibit_tiers where exhibit = 'trevi_fountain'),
    'one day of visits unlocks the Trevi fountain';
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'seven_league_boots') = 2,
    'the seven-league boots count a place twice, or a visit without its day';
  assert not exists (select 1 from public.exhibit_tiers where exhibit = 'seven_league_boots'),
    'two places of one day unlock the seven-league boots';

  insert into public.visit_artworks (visit_id, artwork_id)
    select later, artwork.id from public.artworks as artwork where artwork.title = 'Authored 1';
  insert into public.visits (place_id, visited_on, date_precision) values (third_place, '2026-05-14', 'day');

  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'trevi_fountain') = array[2],
    'the Trevi fountain does not have one tier at two visits';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'trevi_fountain') = array[1]::smallint[],
    'an artwork seen on two days does not unlock the Trevi fountain';
  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'seven_league_boots') = array[3],
    'the seven-league boots do not have one tier at three places';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'seven_league_boots') = array[1]::smallint[],
    'three places of one day do not unlock the seven-league boots';

  delete from public.visits where place_id = third_place;
  perform public.unlock_exhibits('UTC');
  assert (select count(*) from public.exhibit_tiers where exhibit in ('trevi_fountain', 'seven_league_boots')) = 2,
    'deleting visits takes a hidden exhibit back';
  assert (select count(*) from public.point_events
      where kind = 'easter_egg' and code in ('trevi_fountain', 'seven_league_boots')) = 2,
    'the Trevi fountain and the seven-league boots do not give their bonus once';
end;
$$;

do $$
begin
  insert into public.glossary_entries (name, sort_name, category) values
    ('akwaforta', null, 'general'), ('barok', null, 'general'), ('chiaroscuro', null, 'general'),
    ('dyptyk', null, 'general'), ('Écorché', null, 'general'), ('fresk', null, 'general'),
    ('gotyk', null, 'general'), ('hieratyzm', null, 'general'), ('impast', null, 'general'),
    ('japonizm', null, 'general'), ('Kazimierz Michałowski', 'Michałowski', 'person'),
    ('Łuk triumfalny', null, 'general'), ('nawa', null, 'general'), ('„Ostatnia Wieczerza”', null, 'general'),
    ('putto', null, 'general'), ('rokoko', null, 'general'), ('ślimacznica', null, 'general'),
    ('tympanon', null, 'general'), ('umbra', null, 'general'), ('witraż', null, 'general'),
    ('yamato-e', null, 'general'), ('Żyrandol', null, 'general'), ('quattrocento', null, 'general'),
    ('veduta', null, 'general'), ('xoanon', null, 'general'), ('1. Mistrz', null, 'general');

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'figure_alphabet') = 22,
    'the alphabet does not read the first letter as the glossary index does';
  assert not exists (select 1 from public.exhibit_tiers where exhibit = 'figure_alphabet'),
    'twenty-two letters unlock the alphabet';

  insert into public.glossary_entries (name, category) values ('kamea', 'general');
  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'figure_alphabet') = array[23],
    'the alphabet does not have one tier at twenty-three letters';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'figure_alphabet') = array[1]::smallint[],
    'twenty-three letters do not unlock the alphabet';
  assert (select count(*) from public.point_events where kind = 'easter_egg' and code = 'figure_alphabet') = 1,
    'the alphabet does not give its bonus';
end;
$$;

do $$
declare
  described uuid;
  blank uuid;
  bare uuid;
begin
  insert into public.category_values (category_code, name) values
    ('style', 'Described'), ('style', 'Blank'), ('location', 'Bare');
  select id into described from public.category_values where name = 'Described';
  select id into blank from public.category_values where name = 'Blank';
  select id into bare from public.category_values where name = 'Bare';
  insert into public.style_details (value_id, summary) values (described, 'Opis');
  insert into public.style_details (value_id, notes) values (blank, E'  \n ');
  insert into public.location_details (value_id, place_type) values (bare, 'museum');
  insert into public.author_details (value_id, notes)
    select id, 'Notes only' from public.category_values where name = 'Trashed';
  insert into public.era_details (era_code, summary) values ('modern', 'Epoka');

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'hortus_cliffortianus') = 3,
    'the garden of Clifford does not count the values described with a summary or notes';
  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'hortus_cliffortianus')
      = array[1, 10, 25, 50, 100, 500],
    'the garden of Clifford does not have the agreed tiers';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'hortus_cliffortianus') = array[1]::smallint[],
    'a described value does not unlock the first tier of the garden of Clifford';
end;
$$;

reset role;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000f', 'owner-f@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000f", "role": "authenticated"}', true);

do $$
declare
  first_switch timestamptz;
begin
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'candle_moths') = 0,
    'a learner who never switched the theme counts for the night candlestick';
  perform public.record_night_light();
  select night_light_at into first_switch from public.profiles;
  assert first_switch is not null, 'record_night_light does not record the switch for a learner without a profile';
  perform public.record_night_light();
  assert (select night_light_at from public.profiles) = first_switch, 'a later switch replaces the first one';
end;
$$;

reset role;
update public.profiles set night_light_at = '2026-11-07T21:30:00Z'
  where owner_id = '00000000-0000-0000-0000-00000000000f';
set local role authenticated;

do $$
begin
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'candle_moths') = 0,
    'a switch at 21:30 of the learner counts as a night one';
  assert not exists (select 1 from public.exhibit_tiers where exhibit = 'candle_moths'),
    'a switch in the evening unlocks the night candlestick';
  assert (select thresholds from public.unlock_exhibits('Europe/Warsaw') where exhibit = 'candle_moths') = array[1],
    'the night candlestick does not have one tier';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'candle_moths') = array[1]::smallint[],
    'a switch at 22:30 of the learner does not unlock the night candlestick';
  assert (select count(*) from public.point_events where kind = 'easter_egg' and code = 'candle_moths') = 1,
    'the night candlestick does not give its bonus';
end;
$$;

reset role;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000010', 'owner-g@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-000000000010", "role": "authenticated"}', true);

do $$
declare
  first_look timestamptz;
begin
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'amateur_magnifier') = 0,
    'a learner who never stayed an hour with an artwork counts for the magnifier';
  perform public.record_long_look();
  select long_look_at into first_look from public.profiles;
  assert first_look is not null, 'record_long_look does not record the hour for a learner without a profile';
  perform public.record_long_look();
  assert (select long_look_at from public.profiles) = first_look, 'a later hour replaces the first one';
  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'amateur_magnifier') = array[1],
    'the magnifier does not have one tier';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'amateur_magnifier') = array[1]::smallint[],
    'an hour with one artwork does not unlock the magnifier';
  assert (select count(*) from public.point_events where kind = 'easter_egg' and code = 'amateur_magnifier') = 1,
    'the magnifier does not give its bonus';
end;
$$;

reset role;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000011', 'owner-h@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-000000000011", "role": "authenticated"}', true);

do $$
declare
  works uuid[];
  number integer;
  full_show uuid := gen_random_uuid();
  repeated uuid := gen_random_uuid();
  with_trashed uuid := gen_random_uuid();
  trashed_show uuid := gen_random_uuid();
begin
  for number in 1..6 loop
    works := works || (select id from public.save_artwork(
      jsonb_build_object('title', 'Shown ' || number, 'author_unknown', true), '{"author": [], "location": []}'));
  end loop;
  update public.artworks set deleted_at = now() where id = works[6];

  perform public.save_exhibition(full_show, 'Full', jsonb_build_object('type', 'doc', 'content',
    (select jsonb_agg(jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', work)))
      from unnest(works[1:5]) as work)));
  perform public.save_exhibition(repeated, 'Repeated', jsonb_build_object('type', 'doc', 'content',
    (select jsonb_agg(jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', work)))
      from unnest(works[1:4] || works[1]) as work)));
  perform public.save_exhibition(with_trashed, 'With trashed', jsonb_build_object('type', 'doc', 'content',
    (select jsonb_agg(jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', work)))
      from unnest(works[2:6]) as work)));
  perform public.save_exhibition(trashed_show, 'Trashed', jsonb_build_object('type', 'doc', 'content',
    (select jsonb_agg(jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', work)))
      from unnest(works[1:5]) as work)));
  update public.exhibitions set deleted_at = now() where id = trashed_show;

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'crystal_palace') = 1,
    'the crystal palace counts an artwork placed twice, an artwork or an exhibition in the trash';
  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'crystal_palace') = array[1, 3, 5, 10, 25],
    'the crystal palace does not have the agreed tiers';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'crystal_palace') = array[1]::smallint[],
    'an exhibition with five artworks does not unlock the first tier of the crystal palace';
  assert not exists (select 1 from public.point_events where kind = 'easter_egg' and code = 'crystal_palace'),
    'the tiered crystal palace gives a bonus of a hidden exhibit';
end;
$$;

reset role;

do $$
declare
  rejected boolean := false;
begin
  assert (select array_agg(code order by code) from public.exhibits)
      = (select array_agg(exhibit order by exhibit) from private.exhibit_values('00000000-0000-0000-0000-00000000000a', 'UTC')),
    'the catalogue and the computed values do not name the same exhibits';
  assert not exists (select 1 from public.exhibits where thresholds <> (select array_agg(t order by t) from unnest(thresholds) as t)),
    'the thresholds of an exhibit do not rise';
  begin
    insert into public.exhibit_tiers (owner_id, exhibit, tier)
      values ('00000000-0000-0000-0000-00000000000a', 'unknown_exhibit', 1);
  exception when foreign_key_violation then
    rejected := true;
  end;
  assert rejected, 'a tier of an exhibit missing from the catalogue was stored';
end;
$$;

reset role;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000012', 'owner-i@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-000000000012", "role": "authenticated"}', true);

do $$
declare
  eras constant text[] := array['prehistory', 'antiquity', 'middle_ages', 'early_modern', 'modern', 'contemporary'];
  works uuid[];
  era text;
  undated uuid;
  trashed uuid;
  archived_show uuid := gen_random_uuid();
begin
  foreach era in array eras loop
    works := works || (select id from public.save_artwork(
      jsonb_build_object('title', 'Of ' || era, 'author_unknown', true, 'era_code', era),
      '{"author": [], "location": []}'));
  end loop;
  undated := (select id from public.save_artwork(
    jsonb_build_object('title', 'Undated', 'author_unknown', true), '{"author": [], "location": []}'));
  trashed := (select id from public.save_artwork(
    jsonb_build_object('title', 'Trashed', 'author_unknown', true, 'era_code', 'contemporary'),
    '{"author": [], "location": []}'));
  update public.artworks set deleted_at = now() where id = trashed;

  perform public.save_exhibition(gen_random_uuid(), 'Five and more', jsonb_build_object('type', 'doc', 'content',
    (select jsonb_agg(jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', work)))
      from unnest(works[1:5] || undated || trashed) as work)));
  perform public.save_exhibition(archived_show, 'Archived', jsonb_build_object('type', 'doc', 'content',
    (select jsonb_agg(jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', work)))
      from unnest(works) as work)));
  update public.exhibitions set deleted_at = now() where id = archived_show;

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'lenoir_chapel') = 5,
    'the lenoir chapel counts an artwork without an era, an artwork or an exhibition in the trash';
  assert not exists (select 1 from public.exhibit_tiers where exhibit = 'lenoir_chapel'),
    'five eras in an exhibition unlock the lenoir chapel';

  perform public.save_exhibition(gen_random_uuid(), 'All six', jsonb_build_object('type', 'doc', 'content',
    (select jsonb_agg(jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', work)))
      from unnest(works[1:5]) as work)
    || jsonb_build_array(jsonb_build_object('type', 'closeUp', 'attrs',
      jsonb_build_object('artworkId', works[6], 'x', 0.5, 'y', 0.5, 'viewWidth', 0.2)))));

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'lenoir_chapel') = 6,
    'a close-up does not bring the era of its artwork to the lenoir chapel';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'lenoir_chapel') = array[1]::smallint[],
    'an exhibition through all six eras does not unlock the lenoir chapel';
  assert exists (select 1 from public.point_events where kind = 'easter_egg' and code = 'lenoir_chapel'),
    'the hidden lenoir chapel gives no bonus';
end;
$$;

rollback;
