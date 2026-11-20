\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  number integer;
begin
  for number in 1..22 loop
    perform public.save_artwork(
      jsonb_build_object('title', 'Work ' || number, 'author_unknown', true),
      '{}', null,
      jsonb_build_array(jsonb_build_object('source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work' || number || '.jpg')));
  end loop;
end;
$$;

reset role;
insert into public.review_cards (artwork_id, owner_id, due, stability, difficulty, state, created_at)
  select artwork.id, artwork.owner_id, now() - interval '1 day', 5, 5, 2, now() - interval '3 days'
    from public.artworks as artwork
    where artwork.title in ('Work 21', 'Work 22');
set local role authenticated;

do $$
declare
  held uuid;
  broken uuid;
  answered uuid;
begin
  select id into held from public.artworks where title = 'Work 21';
  select id into broken from public.artworks where title = 'Work 22';
  select id into answered from public.artworks where title = 'Work 1';
  insert into public.learner_flags (artwork_id, reason, holds) values (held, 'image', true);
  update public.artwork_images set broken_at = now() where artwork_id = broken;

  perform public.record_review(answered,
    jsonb_build_object('due', now() + interval '1 day', 'stability', 1, 'difficulty', 5, 'state', 1, 'reps', 1,
      'lapses', 0, 'scheduled_days', 1, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3),
    date_trunc('day', now()), 'UTC');

  assert (select plan_share from public.point_events where kind = 'plan_day') = 0.1::real,
    'a held artwork or one with a broken image still waits in the day''s plan';
end;
$$;

rollback;
