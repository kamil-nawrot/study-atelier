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

  assert (select array_agg(exhibit order by exhibit) from public.unlock_exhibits('UTC')) = array[
    'antiquity', 'back_from_storage', 'bullseye', 'chronicle', 'collection', 'contemporary', 'early_modern', 'eras',
    'glossary', 'grand_tour', 'marathon', 'memory', 'middle_ages', 'modern', 'mouth_of_truth', 'night_watch',
    'own_eye', 'pinacotheca', 'prehistory', 'regular', 'seen_live', 'timeline'
  ], 'the exhibits are not the agreed twenty-two';
  assert (select (array_agg(exhibit order by position))[1:8]
      from public.unlock_exhibits('UTC') with ordinality as listed (exhibit, value, thresholds, position)) = array[
    'collection', 'eras', 'prehistory', 'antiquity', 'middle_ages', 'early_modern', 'modern', 'contemporary'
  ], 'the era exhibits do not follow eras in their order';
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

rollback;
