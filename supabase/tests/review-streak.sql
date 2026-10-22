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
  work uuid;
begin
  perform public.save_artwork(
    jsonb_build_object('title', 'Work', 'author_unknown', true, 'era_code', 'early_modern'),
    '{}', null,
    '[{"source_wikidata_id": "Q1", "source_image_file": "Work.jpg"}]');
  select id into work from public.artworks where title = 'Work';

  assert public.review_streak('2026-10-17T00:00:00Z', 'UTC') = 0, 'a learner without reviews has a streak';

  perform public.record_review(work,
    jsonb_build_object('due', now(), 'stability', 1, 'difficulty', 5, 'state', 2, 'reps', 1,
      'lapses', 0, 'scheduled_days', 1, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3));
end;
$$;

reset role;

update public.review_log set reviewed_at = '2026-10-17T09:00:00Z';

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
  assert public.review_streak('2026-10-16T22:00:00Z', 'Pacific/Honolulu') = 3,
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

rollback;
