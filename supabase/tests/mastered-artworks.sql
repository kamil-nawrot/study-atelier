\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  settled uuid;
  fresh uuid;
  unasked uuid;
begin
  select id into settled from public.save_artwork(
    '{"title": "Settled", "author_unknown": true}', '{}', null, '[]');
  select id into fresh from public.save_artwork(
    '{"title": "Fresh", "author_unknown": true}', '{}', null, '[]');
  select id into unasked from public.save_artwork(
    '{"title": "Unasked", "author_unknown": true}', '{}', null, '[]');

  perform public.record_review(settled,
    jsonb_build_object('due', '2026-12-30T00:00:00Z', 'stability', 9, 'difficulty', 5, 'state', 2, 'reps', 4,
      'lapses', 0, 'scheduled_days', 9, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3));
  perform public.record_review(fresh,
    jsonb_build_object('due', '2026-12-01T00:00:00Z', 'stability', 2, 'difficulty', 5, 'state', 1, 'reps', 1,
      'lapses', 0, 'scheduled_days', 1, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3));

  assert public.mastered_artworks(array[settled, fresh, unasked]) = 1,
    'mastered_artworks does not count only the settled artworks';
  assert public.mastered_artworks(array[fresh, unasked]) = 0, 'an unsettled artwork counts as mastered';
  assert public.mastered_artworks('{}') = 0, 'no artworks count as mastered';
end;
$$;

rollback;
