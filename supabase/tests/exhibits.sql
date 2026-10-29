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

  assert (select array_agg(exhibit order by exhibit) from public.unlock_exhibits('UTC')) = array[
    'back_from_storage', 'chronicle', 'collection', 'eras', 'glossary', 'grand_tour', 'marathon', 'memory',
    'night_watch', 'own_eye', 'regular', 'seen_live', 'timeline'
  ], 'the exhibits are not the agreed thirteen';
  assert (select array_agg(tier order by tier) from public.exhibit_tiers where exhibit = 'collection') = array[1, 2]::smallint[],
    'ten artworks do not unlock the first two tiers of the collection';
  assert (select array_agg(tier) from public.exhibit_tiers where exhibit = 'eras') = array[1]::smallint[],
    'artworks of two eras do not unlock the first tier of eras';
  assert (select count(*) from public.exhibit_tiers where seen_at is not null) = 0, 'a new tier is already seen';

  delete from public.artworks where title in ('Work 9', 'Work 10', 'Work 8', 'Work 7', 'Work 6');
  perform public.unlock_exhibits('UTC');
  assert (select count(*) from public.exhibit_tiers where exhibit in ('collection', 'eras')) = 3,
    'deleting artworks takes an unlocked tier back';

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

rollback;
