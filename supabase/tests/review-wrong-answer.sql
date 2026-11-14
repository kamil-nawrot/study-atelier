\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

create function pg_temp.card()
returns jsonb
language sql
as $$
  select jsonb_build_object('due', now() + interval '1 day', 'stability', 3, 'difficulty', 5,
    'state', 2, 'reps', 1, 'lapses', 0, 'scheduled_days', 1, 'learning_steps', 0, 'last_review', now());
$$;

create function pg_temp.last_wrong_answer(work uuid)
returns text
language sql
as $$
  select entry.wrong_answer from public.review_log as entry
    where entry.artwork_id = work
    order by entry.id desc
    limit 1;
$$;

do $$
declare
  work uuid;
begin
  select saved.id into work from public.save_artwork(
    '{"title": "Work 1", "author_unknown": true}', '{}', null,
    '[{"source_wikidata_id": "Q1", "source_image_file": "Work_1.jpg"}]'
  ) as saved;

  perform public.record_review(work, pg_temp.card(),
    '{"mode": "quiz_author", "rating": 1, "correct": false, "wrong_answer": "  Édouard Manet "}');
  assert pg_temp.last_wrong_answer(work) = 'Édouard Manet',
    'a wrong quiz answer does not keep the picked option';

  perform public.record_review(work, pg_temp.card(),
    '{"mode": "quiz_author", "rating": 3, "correct": true, "wrong_answer": "Claude Monet"}');
  assert pg_temp.last_wrong_answer(work) is null, 'a right quiz answer keeps a wrong option';

  perform public.record_review(work, pg_temp.card(),
    '{"mode": "flashcard", "rating": 1, "wrong_answer": "Claude Monet"}');
  assert pg_temp.last_wrong_answer(work) is null, 'a flashcard keeps a wrong option';

  perform public.record_review(work, pg_temp.card(),
    '{"mode": "quiz_style", "rating": 1, "correct": false}');
  assert pg_temp.last_wrong_answer(work) is null, 'a wrong answer without an option invents one';

  perform public.record_review(work, pg_temp.card(),
    jsonb_build_object('mode', 'quiz_title', 'rating', 1, 'correct', false, 'wrong_answer', repeat('a', 600)));
  assert char_length(pg_temp.last_wrong_answer(work)) = 500, 'a long option is not cut to 500 characters';
end;
$$;

rollback;
