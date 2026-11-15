\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

create function pg_temp.work(title text, authors jsonb, styles jsonb)
returns uuid
language sql
as $$
  select (public.save_artwork(
    jsonb_build_object('title', title),
    jsonb_build_object('author', authors, 'style', styles),
    null,
    jsonb_build_array(jsonb_build_object('source_wikidata_id', 'Q1', 'source_image_file', title || '.jpg'))
  )).id;
$$;

create function pg_temp.pair_answer(work uuid, kind text, asked text, other text, correct boolean, at timestamptz)
returns void
language plpgsql
as $$
begin
  perform public.record_pair_answer(work, kind, asked, other, correct);
  update public.review_log set reviewed_at = at where id = (select max(id) from public.review_log);
end;
$$;

reset role;

do $$
declare
  monet uuid := pg_temp.work('Impression', '["Claude Monet"]', '["Impressionism", "Plein air"]');
  manet uuid := pg_temp.work('Olympia', '["Édouard Manet"]', '["Realism"]');
  pair record;
begin
  assert not exists (select 1 from public.confused_pairs()), 'a learner without wrong answers has pairs';

  insert into public.review_log (artwork_id, mode, rating, correct, wrong_answer, reviewed_at)
    values (monet, 'quiz_author', 1, false, 'Édouard Manet', '2026-11-01 10:00+00'),
      (monet, 'quiz_title', 1, false, 'Olympia', '2026-11-01 10:01+00'),
      (manet, 'quiz_author', 2, true, null, '2026-11-01 10:02+00');

  select * into pair from public.confused_pairs();
  assert (select count(*) from public.confused_pairs()) = 1, 'a wrong title or a right answer makes a pair';
  assert pair.kind = 'author' and pair.first_value = 'Claude Monet' and pair.second_value = 'Édouard Manet',
    'a wrong author answer does not pair the right author with the picked one: ' || pair::text;
  assert pair.confused_at = '2026-11-01 10:00+00', 'the pair does not keep the time of the confusion';

  insert into public.review_log (artwork_id, mode, rating, correct, wrong_answer, reviewed_at)
    values (manet, 'quiz_author', 1, false, 'claude monet', '2026-11-02 10:00+00');
  assert (select count(*) from public.confused_pairs()) = 1, 'the same pair the other way round counts twice';
  assert (select confused_at from public.confused_pairs()) = '2026-11-02 10:00+00',
    'the pair does not keep its last confusion';

  perform pg_temp.pair_answer(monet, 'author', 'Claude Monet', 'Édouard Manet', true, '2026-11-03 10:00+00');
  perform pg_temp.pair_answer(manet, 'author', 'Édouard Manet', 'Claude Monet', true, '2026-11-04 10:00+00');
  assert (select count(*) from public.confused_pairs()) = 1, 'two right answers settle a pair';
  perform pg_temp.pair_answer(manet, 'author', 'Édouard Manet', 'Claude Monet', false, '2026-11-05 10:00+00');
  perform pg_temp.pair_answer(monet, 'author', 'Claude Monet', 'Édouard Manet', true, '2026-11-06 10:00+00');
  assert (select count(*) from public.confused_pairs()) = 1,
    'right answers before a wrong pair answer still count';
  assert (select confused_at from public.confused_pairs()) = '2026-11-05 10:00+00',
    'a wrong pair answer is not the last confusion';
  perform pg_temp.pair_answer(manet, 'author', 'Édouard Manet', 'Claude Monet', true, '2026-11-06 12:00+00');
  perform pg_temp.pair_answer(monet, 'author', 'Claude Monet', 'Édouard Manet', true, '2026-11-06 14:00+00');
  assert (select count(*) from public.confused_pairs()) = 1,
    'three right answers on one day settle a pair';
  perform pg_temp.pair_answer(monet, 'author', 'Claude Monet', 'Édouard Manet', true, '2026-11-07 10:00+00');
  perform pg_temp.pair_answer(manet, 'author', 'Édouard Manet', 'Claude Monet', true, '2026-11-08 10:00+00');
  assert not exists (select 1 from public.confused_pairs()), 'three right answers do not settle a pair';

  insert into public.review_log (artwork_id, mode, rating, correct, wrong_answer, reviewed_at)
    values (monet, 'quiz_style', 1, false, 'Realism', '2026-11-09 10:00+00');
  select * into pair from public.confused_pairs();
  assert pair.kind = 'style' and pair.first_value = 'Impressionism' and pair.second_value = 'Realism',
    'a wrong style answer does not pair the first style with the picked one: ' || pair::text;

  assert (select facet from public.review_log where mode = 'pair_author' limit 1) = 'pair',
    'a pair answer is not logged as a pair';
  assert not exists (select 1 from public.review_cards), 'a pair answer schedules an artwork';

  begin
    perform public.record_pair_answer(monet, 'title', 'Claude Monet', 'Édouard Manet', true);
    assert false, 'a pair of titles is logged';
  exception when check_violation then null;
  end;
  begin
    perform public.record_pair_answer(monet, 'author', 'Claude Monet', 'Claude Monet', true);
    assert false, 'a pair of one value is logged';
  exception when check_violation then null;
  end;
end;
$$;

set local role authenticated;

do $$
begin
  perform public.record_pair_answer((select id from public.artworks where title = 'Olympia'), 'style', 'Realism',
    'Impressionism', true);
  assert (select count(*) from public.review_log where facet = 'pair') = 9, 'the learner cannot log a pair answer';
  assert (select count(*) from public.confused_pairs()) = 1, 'the learner cannot read their own pairs';
end;
$$;

reset role;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert not exists (select 1 from public.confused_pairs()), 'B sees the pairs of A';
end;
$$;

rollback;
