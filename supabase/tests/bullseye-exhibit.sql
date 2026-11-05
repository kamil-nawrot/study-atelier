\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

create function pg_temp.add_work(number integer, year_from integer, year_to integer)
returns uuid
language sql
as $$
  select saved.id from public.save_artwork(
    jsonb_strip_nulls(jsonb_build_object(
      'title', 'Work ' || number,
      'author_unknown', true,
      'era_code', 'early_modern',
      'year_from', year_from,
      'year_to', year_to
    )),
    '{}',
    null,
    jsonb_build_array(jsonb_build_object(
      'source_wikidata_id', 'Q' || number,
      'source_image_file', 'Work_' || number || '.jpg'
    ))
  ) as saved;
$$;

create function pg_temp.card()
returns jsonb
language sql
as $$
  select jsonb_build_object('due', now() + interval '3 days', 'stability', 3, 'difficulty', 5, 'state', 2,
    'reps', 1, 'lapses', 0, 'scheduled_days', 3, 'learning_steps', 0, 'last_review', now());
$$;

create function pg_temp.guess(work uuid, year integer)
returns integer
language plpgsql
as $$
declare
  saved integer;
begin
  perform public.record_review(work, pg_temp.card(),
    jsonb_build_object('facet', 'date', 'mode', 'year', 'rating', 3, 'correct', true, 'guessed_year', year));
  select entry.year_miss into saved
    from public.review_log as entry
    where entry.artwork_id = work and entry.facet = 'date'
    order by entry.id desc
    limit 1;
  return saved;
end;
$$;

do $$
declare
  single uuid := pg_temp.add_work(1, null, 1500);
  span uuid := pg_temp.add_work(2, 1480, 1500);
  ancient uuid := pg_temp.add_work(3, -5, 10);
  work uuid;
begin
  foreach work in array array[single, span, ancient] loop
    perform public.record_review(work, pg_temp.card(), '{"mode": "flashcard", "rating": 3}');
  end loop;

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'bullseye') = 0,
    'a learner without year answers has exact hits';
  assert (select array_position(array_agg(exhibit), 'bullseye') - array_position(array_agg(exhibit), 'memory')
      from public.unlock_exhibits('UTC')) = 1,
    'the exhibit does not stand right after memory';
  assert (select thresholds from public.unlock_exhibits('UTC') where exhibit = 'bullseye')
      = array[1, 5, 25, 50, 100, 250],
    'the exhibit does not have the agreed tiers';

  assert pg_temp.guess(single, 1500) = 0, 'the very year is not an exact hit';
  assert pg_temp.guess(single, 1490) = 10, 'an early guess does not save how far it missed';
  assert pg_temp.guess(single, 1512) = 12, 'a late guess does not save how far it missed';
  assert pg_temp.guess(span, 1480) = 0, 'the first year of a span is not an exact hit';
  assert pg_temp.guess(span, 1491) = 0, 'a year inside a span is not an exact hit';
  assert pg_temp.guess(span, 1500) = 0, 'the last year of a span is not an exact hit';
  assert pg_temp.guess(span, 1470) = 10, 'a guess before a span does not miss its first year';
  assert pg_temp.guess(ancient, -7) = 2, 'a guess before the common era misses by the wrong count';
  assert pg_temp.guess(ancient, 12) = 2, 'a guess after a span across the era misses by the wrong count';
  assert pg_temp.guess(single, 1500) = 0, 'the same artwork hit again is not an exact hit';

  assert (select guessed_year from public.review_log where artwork_id = span and year_miss = 0
      order by id limit 1) = 1480,
    'the guessed year is not saved';
  assert (select count(*) from public.review_log
      where facet = 'recognise' and (guessed_year is not null or year_miss is not null)) = 0,
    'a recognise answer has a guessed year';

  perform public.record_review(single, pg_temp.card(),
    '{"facet": "date", "mode": "year", "rating": 3, "correct": true}');
  assert (select year_miss is null from public.review_log where artwork_id = single order by id desc limit 1),
    'a year answer without a guess has a miss';

  perform public.record_review(single, pg_temp.card(), '{"mode": "flashcard", "rating": 3, "guessed_year": 1500}');
  assert (select guessed_year is null from public.review_log where artwork_id = single order by id desc limit 1),
    'a recognise answer keeps a guessed year';

  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'bullseye') = 5,
    'the exhibit does not count every exact hit';
  assert (select array_agg(tier order by tier) from public.exhibit_tiers where exhibit = 'bullseye')
      = array[1, 2]::smallint[],
    'five exact hits do not unlock the first two tiers';

  update public.artworks set year_to = 1600 where id = single;
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'bullseye') = 5,
    'changing the year of an artwork changes past hits';

  update public.artworks set deleted_at = now() where id = span;
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'bullseye') = 5,
    'moving an artwork to the archive takes its hits away';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert (select value from public.unlock_exhibits('UTC') where exhibit = 'bullseye') = 0,
    'the exact hits of another learner count';
end;
$$;

rollback;
