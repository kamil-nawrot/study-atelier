\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test'),
  ('00000000-0000-0000-0000-00000000000c', 'owner-c@example.test'),
  ('00000000-0000-0000-0000-00000000000d', 'owner-d@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  number integer;
  work uuid;
begin
  for number in 1..20 loop
    perform public.save_artwork(
      jsonb_build_object('title', 'Work ' || number, 'author_unknown', true, 'era_code', 'early_modern'),
      '{}', null,
      jsonb_build_array(jsonb_build_object('source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work' || number || '.jpg')));
  end loop;
  insert into public.glossary_entries (name, category) values ('Sfumato', 'technique');

  assert (select count(*) from public.point_events where kind = 'artwork_added') = 20,
    'adding an artwork records no event';
  assert (select count(*) from public.point_events where kind = 'definition_added') = 1,
    'adding a definition records no event';
  assert public.learner_points() = 42, 'points of additions are not 2 each';

  select id into work from public.artworks where title = 'Work 1';
  perform public.record_review(work,
    jsonb_build_object('due', '2026-11-20T00:00:00Z', 'stability', 8, 'difficulty', 5, 'state', 2, 'reps', 1,
      'lapses', 0, 'scheduled_days', 8, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3),
    date_trunc('day', now()), 'UTC');

  assert (select count(*) from public.point_events where kind = 'settled' and item_id = work) = 1,
    'a settled artwork records no event';
  assert (select plan_share from public.point_events where kind = 'plan_day') = 0.1::real,
    'the plan share is not the answered part of the day''s plan';
  assert (select streak_days from public.point_events where kind = 'plan_day') = 1,
    'the plan day does not keep the streak';
  assert public.learner_points() = 63, 'points of a settled artwork and a plan day are not counted';

  perform public.record_review(work,
    jsonb_build_object('due', '2026-11-30T00:00:00Z', 'stability', 12, 'difficulty', 5, 'state', 2, 'reps', 2,
      'lapses', 0, 'scheduled_days', 12, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3),
    date_trunc('day', now()), 'UTC');
  assert (select count(*) from public.point_events where kind = 'settled') = 1,
    'an artwork settled again counts twice';
  assert (select count(*) from public.point_events where kind = 'plan_day') = 1,
    'a second answer of the day adds a second plan day';

  perform public.record_review(work,
    jsonb_build_object('due', '2026-12-30T00:00:00Z', 'stability', 20, 'difficulty', 5, 'state', 2, 'reps', 3,
      'lapses', 0, 'scheduled_days', 20, 'learning_steps', 0, 'last_review', now()),
    jsonb_build_object('mode', 'flashcard', 'rating', 3));
  assert (select count(*) from public.point_events where kind = 'plan_day') = 1,
    'an answer without the learner''s day records a plan day';

  delete from public.artworks where id = work;
  assert public.learner_points() = 63, 'deleting an artwork takes its points back';

  assert public.learner_points() = (
    select 42 + 20 + round(10 * plan_share)::integer from public.point_events where kind = 'plan_day'
  ), 'the points are not the sum of the events';
end;
$$;

reset role;

update public.point_events set streak_days = 15, plan_share = 1
  where owner_id = '00000000-0000-0000-0000-00000000000a' and kind = 'plan_day';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  assert public.learner_points() = 77, 'the streak bonus is not capped at half of the plan points';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert public.learner_points() = 0, 'B counts the points of A';
  assert (select count(*) from public.point_events) = 0, 'B reads the point events of A';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}', true);

do $$
begin
  perform public.import_atelier(jsonb_build_object(
    'artworks', jsonb_build_array(jsonb_build_object(
      'id', '10000000-0000-0000-0000-000000000001', 'record_number', 1, 'title', 'Imported',
      'author_unknown', true, 'created_at', '2026-10-01T00:00:00Z', 'updated_at', '2026-10-01T00:00:00Z')),
    'point_events', jsonb_build_array(
      jsonb_build_object('kind', 'settled', 'item_id', '10000000-0000-0000-0000-000000000009',
        'occurred_at', '2026-10-02T00:00:00Z'),
      jsonb_build_object('kind', 'artwork_added', 'item_id', '10000000-0000-0000-0000-000000000001',
        'occurred_at', '2026-10-01T00:00:00Z'))));
  assert public.learner_points() = 22, 'the import does not restore the points of the copy alone';

  delete from public.artworks;
  perform public.import_atelier(jsonb_build_object(
    'point_events', jsonb_build_array(
      jsonb_build_object('kind', 'settled', 'item_id', '10000000-0000-0000-0000-000000000008',
        'occurred_at', '2026-10-02T00:00:00Z'))));
  assert public.learner_points() = 22, 'the import adds points to an account that has them';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000d", "role": "authenticated"}', true);

do $$
begin
  perform public.import_atelier(jsonb_build_object(
    'artworks', jsonb_build_array(jsonb_build_object(
      'id', '20000000-0000-0000-0000-000000000001', 'record_number', 1, 'title', 'Old copy',
      'author_unknown', true, 'created_at', '2026-10-01T00:00:00Z', 'updated_at', '2026-10-01T00:00:00Z'))));
  assert public.learner_points() = 2, 'a copy without points does not count its atelier';
end;
$$;

rollback;
