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
  work uuid;
  number integer;
begin
  perform public.save_artwork(
    jsonb_build_object('title', 'Work', 'author_unknown', true, 'era_code', 'early_modern'),
    '{}', null,
    '[{"source_wikidata_id": "Q1", "source_image_file": "Work.jpg"}]');
  select id into work from public.artworks where title = 'Work';

  for number in 1..19 loop
    perform public.save_artwork(
      jsonb_build_object('title', 'Waiting ' || number, 'author_unknown', true, 'era_code', 'early_modern'),
      '{}', null,
      jsonb_build_array(jsonb_build_object('source_wikidata_id', 'Q' || (number + 1),
        'source_image_file', 'Waiting' || number || '.jpg')));
  end loop;

  assert public.review_streak('2026-10-17T00:00:00Z', 'UTC') = 0, 'a learner without reviews has a streak';

  perform public.record_review(work,
    jsonb_build_object('due', now(), 'stability', 1, 'difficulty', 5, 'state', 2, 'reps', 1,
      'lapses', 0, 'scheduled_days', 1, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3));
end;
$$;

reset role;

update public.review_log set reviewed_at = '2026-10-17T09:00:00Z';
update public.artworks set created_at = '2026-10-01T00:00:00Z';
update public.review_cards set created_at = '2026-10-12T00:00:00Z';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  assert public.review_streak('2026-10-17T00:00:00Z', 'UTC') = 1, 'a review today does not start a streak';
end;
$$;

reset role;

insert into public.review_log (artwork_id, owner_id, mode, rating, reviewed_at)
  select artwork.id, artwork.owner_id, 'flashcard', 3, day
    from public.artworks as artwork,
      unnest(array['2026-10-17T11:00:00Z', '2026-10-16T10:00:00Z', '2026-10-15T22:00:00Z',
        '2026-10-14T08:00:00Z', '2026-10-12T11:00:00Z']::timestamptz[]) as day;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  assert public.review_streak('2026-10-17T00:00:00Z', 'UTC') = 4,
    'the streak is not the run of consecutive days ending today';
  assert public.review_streak('2026-10-18T00:00:00Z', 'UTC') = 4,
    'a streak that ended yesterday dies before the day is over';
  assert public.review_streak('2026-10-19T00:00:00Z', 'UTC') = 0,
    'a streak survives a whole day without a review';
  assert public.review_streak('2026-10-16T22:00:00Z', 'Europe/Warsaw') = 2,
    'the day is not read in the learner time zone';
  assert public.review_streak('2026-10-16T22:00:00Z', 'Pacific/Honolulu') = 2,
    'the day ignores the time zone of the learner';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert public.review_streak('2026-10-17T00:00:00Z', 'UTC') = 0, 'B has the streak of A';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}', true);

do $$
declare
  number integer;
begin
  for number in 1..20 loop
    perform public.save_artwork(
      jsonb_build_object('title', 'Known ' || number, 'author_unknown', true, 'era_code', 'early_modern'),
      '{}', null,
      jsonb_build_array(jsonb_build_object('source_wikidata_id', 'Q' || (number + 100),
        'source_image_file', 'Known' || number || '.jpg')));
  end loop;
end;
$$;

reset role;

update public.artworks set created_at = '2026-10-01T00:00:00Z'
  where owner_id = '00000000-0000-0000-0000-00000000000c';

insert into public.review_cards (artwork_id, owner_id, due, stability, difficulty, state, reps, created_at)
  select artwork.id, artwork.owner_id, '2026-11-30T00:00:00Z', 30, 5, 2, 3, '2026-10-01T00:00:00Z'
    from public.artworks as artwork
    where artwork.owner_id = '00000000-0000-0000-0000-00000000000c';

insert into public.review_log (artwork_id, owner_id, mode, rating, reviewed_at, due_before)
  select artwork.id, artwork.owner_id, 'flashcard', 3, entry.reviewed_at, entry.due_before
    from public.artworks as artwork,
      (values
        ('2026-10-10T09:00:00Z'::timestamptz, '2026-10-10T08:00:00Z'::timestamptz),
        ('2026-10-11T09:00:00Z', '2026-10-11T08:00:00Z'),
        ('2026-10-13T09:00:00Z', '2026-10-13T08:00:00Z')) as entry (reviewed_at, due_before)
    where artwork.title = 'Known 1' and artwork.owner_id = '00000000-0000-0000-0000-00000000000c';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}', true);

do $$
begin
  assert public.review_streak('2026-10-13T00:00:00Z', 'UTC') = 3,
    'a day on which nothing waited breaks the streak';
  assert public.review_streak('2026-10-16T00:00:00Z', 'UTC') = 3,
    'days on which nothing waits since the last review end the streak';
end;
$$;

reset role;

update public.review_log set due_before = '2026-10-12T08:00:00Z'
  where owner_id = '00000000-0000-0000-0000-00000000000c' and reviewed_at = '2026-10-13T09:00:00Z';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}', true);

do $$
begin
  assert public.review_streak('2026-10-13T00:00:00Z', 'UTC') = 1,
    'a day on which an artwork waited does not break the streak';
end;
$$;

reset role;

update public.review_log set due_before = '2026-10-13T08:00:00Z'
  where owner_id = '00000000-0000-0000-0000-00000000000c' and reviewed_at = '2026-10-13T09:00:00Z';
update public.review_cards set created_at = '2026-10-13T12:00:00Z'
  where artwork_id = (select id from public.artworks where title = 'Known 2');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}', true);

do $$
begin
  assert public.review_streak('2026-10-13T00:00:00Z', 'UTC') = 1,
    'a day on which a new artwork waited does not break the streak';
end;
$$;

do $$
declare
  work uuid := (select id from public.artworks where title = 'Known 3');
begin
  perform public.record_review(work,
    jsonb_build_object('due', '2026-12-30T00:00:00Z', 'stability', 40, 'difficulty', 5, 'state', 2,
      'reps', 4, 'lapses', 0, 'scheduled_days', 30, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3));
  assert (select due_before from public.review_log where artwork_id = work) = '2026-11-30T00:00:00Z',
    'record_review does not keep the due date before the answer';
end;
$$;

rollback;
