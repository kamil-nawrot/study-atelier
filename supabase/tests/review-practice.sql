\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

create function pg_temp.card(days integer, lapses integer)
returns jsonb
language sql
as $$
  select jsonb_build_object('due', now() + make_interval(days => days), 'stability', days,
    'difficulty', 5, 'state', 2, 'reps', 1, 'lapses', lapses, 'scheduled_days', days,
    'learning_steps', 0, 'last_review', now());
$$;

do $$
declare
  work uuid;
  today timestamptz := date_trunc('day', now());
  saved public.review_cards;
begin
  select created.id into work from public.save_artwork(
    '{"title": "Work 1", "author_unknown": true}', '{}', null,
    '[{"source_wikidata_id": "Q1", "source_image_file": "Work_1.jpg"}]'
  ) as created;

  perform public.record_review(work, pg_temp.card(1, 1),
    '{"mode": "flashcard", "rating": 1}', today, 'UTC');
  perform public.record_review(work, pg_temp.card(3, 1),
    '{"mode": "flashcard", "rating": 3}', today, 'UTC');

  select * into saved from public.review_cards as card where card.artwork_id = work;
  assert saved.scheduled_days = 1, 'a repeated answer moved the next review';
  assert saved.lapses = 1, 'a repeated answer changed the lapses';
  assert saved.last_rating = 1, 'the card does not keep the rating of the first answer';
  assert (select array_agg(entry.practice order by entry.id) from public.review_log as entry
    where entry.artwork_id = work) = '{false,true}', 'the second answer of the day is not practice';

  perform public.record_review(work, pg_temp.card(5, 1),
    '{"mode": "flashcard", "rating": 3}', today + interval '1 day', 'UTC');
  select * into saved from public.review_cards as card where card.artwork_id = work;
  assert saved.scheduled_days = 5 and saved.last_rating = 3,
    'the first answer of the next day does not schedule';

  perform public.record_review(work, pg_temp.card(2, 1),
    '{"mode": "flashcard", "rating": 2}');
  select * into saved from public.review_cards as card where card.artwork_id = work;
  assert saved.scheduled_days = 2, 'an answer without a day does not schedule';

  assert (select count(*) from public.review_log as entry where not entry.practice) = 3,
    'scheduling answers are not counted apart from practice';
end;
$$;

reset role;

do $$
declare
  owner uuid := '00000000-0000-0000-0000-00000000000a';
  work uuid := (select artwork.id from public.artworks as artwork where artwork.owner_id = owner limit 1);
begin
  update public.review_log set practice = false;
  update public.review_cards set last_rating = null;
  update public.review_log set reviewed_at = '2026-11-01 10:00+00' where id = (select min(id) from public.review_log);
  update public.review_log set reviewed_at = '2026-11-01 10:05+00'
    where id = (select min(id) + 1 from public.review_log);
  update public.review_log set reviewed_at = '2026-11-02 09:00+00'
    where id = (select min(id) + 2 from public.review_log);
  update public.review_log set reviewed_at = '2026-11-02 09:30+00'
    where id = (select min(id) + 3 from public.review_log);

  perform private.fill_review_practice(owner);

  assert (select array_agg(entry.practice order by entry.id) from public.review_log as entry
    where entry.artwork_id = work) = '{false,true,false,true}',
    'the filling does not mark the later answers of a day as practice';
  assert (select card.last_rating from public.review_cards as card where card.artwork_id = work) = 3,
    'the filling does not take the rating of the first answer of the last day';
end;
$$;

rollback;
