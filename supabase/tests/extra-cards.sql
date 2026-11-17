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
  term uuid;
  skull uuid;
  term_card uuid;
  first_card jsonb := '{"due": "2026-11-18T08:00:00Z", "stability": 2.3, "difficulty": 5, "state": 2,
    "reps": 1, "lapses": 0, "scheduled_days": 2, "learning_steps": 0, "last_review": "2026-11-16T08:00:00Z"}';
  later_card jsonb := '{"due": "2026-11-30T08:00:00Z", "stability": 9, "difficulty": 4.5, "state": 2,
    "reps": 2, "lapses": 0, "scheduled_days": 12, "learning_steps": 0, "last_review": "2026-11-18T08:00:00Z"}';
  scheduled boolean;
  rejected boolean;
begin
  insert into public.glossary_entries (name, category, definition) values ('Vanitas', 'painting', 'A still life')
    returning id into term;
  skull := public.save_symbol('Skull', '[]');
  perform set_config('test.term', term::text, true);
  perform set_config('test.skull', skull::text, true);

  scheduled := public.record_extra_review(term, null, first_card,
    '{"mode": "quiz_definition", "rating": 2, "correct": true, "answer_ms": 3200}', date_trunc('day', now()));
  assert scheduled, 'the first answer of a term does not schedule it';
  select id into term_card from public.extra_cards where glossary_entry_id = term;
  assert term_card is not null, 'the first answer does not create the card of the term';
  assert (select due from public.extra_cards where id = term_card) = '2026-11-18T08:00:00Z',
    'the card of the term does not take the given due date';
  assert (select due_before is null and not practice from public.extra_review_log where card_id = term_card),
    'the first answer is logged with a due date or as practice';

  scheduled := public.record_extra_review(term, null, later_card,
    '{"mode": "quiz_definition", "rating": 1, "correct": false, "wrong_answer": " Tympanum "}',
    date_trunc('day', now()));
  assert not scheduled, 'a second answer on the same day schedules the term';
  assert (select due from public.extra_cards where id = term_card) = '2026-11-18T08:00:00Z',
    'a second answer on the same day changes the card';
  assert (select practice and wrong_answer = 'Tympanum' from public.extra_review_log
      where card_id = term_card and rating = 1),
    'a second answer on the same day is not logged as practice with the wrong answer';

  scheduled := public.record_extra_review(term, null, later_card,
    '{"mode": "quiz_definition", "rating": 2, "correct": true}', date_trunc('day', now()) + interval '2 days');
  assert scheduled, 'the first answer of the next day does not schedule the term';
  assert (select due = '2026-11-30T08:00:00Z' and reps = 2 and last_rating = 2
      from public.extra_cards where id = term_card),
    'the first answer of the next day does not update the card';
  assert (select due_before from public.extra_review_log
      where card_id = term_card order by id desc limit 1) = '2026-11-18T08:00:00Z',
    'an answer does not keep the due date the card had before';

  perform public.record_extra_review(null, skull, first_card,
    '{"mode": "symbol_meaning", "rating": 1, "correct": false}', date_trunc('day', now()));
  assert (select count(*) from public.extra_cards) = 2, 'a symbol does not get a card of its own';

  begin
    perform public.record_extra_review(term, skull, first_card,
      '{"mode": "quiz_definition", "rating": 2, "correct": true}', '2026-11-20T00:00:00Z');
    rejected := false;
  exception when invalid_parameter_value then
    rejected := true;
  end;
  assert rejected, 'an answer belongs to a term and a symbol at once';

  begin
    perform public.record_extra_review(null, null, first_card,
      '{"mode": "quiz_definition", "rating": 2, "correct": true}', '2026-11-20T00:00:00Z');
    rejected := false;
  exception when invalid_parameter_value then
    rejected := true;
  end;
  assert rejected, 'an answer belongs to nothing';

  begin
    perform public.record_extra_review(term, null, first_card,
      '{"mode": "quiz_title", "rating": 2, "correct": true}', '2026-11-20T00:00:00Z');
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'an answer of an artwork question is logged on a term';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  rejected boolean;
begin
  assert (select count(*) from public.extra_cards) = 0, 'B reads the extra cards of A';
  assert (select count(*) from public.extra_review_log) = 0, 'B reads the extra answers of A';
  begin
    perform public.record_extra_review(current_setting('test.term')::uuid, null,
      '{"due": "2026-11-18T08:00:00Z", "stability": 2, "difficulty": 5, "state": 2}',
      '{"mode": "quiz_definition", "rating": 2, "correct": true}', date_trunc('day', now()));
    rejected := false;
  exception when foreign_key_violation then
    rejected := true;
  end;
  assert rejected, 'B schedules a term of A';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  delete from public.glossary_entries where id = current_setting('test.term')::uuid;
  assert not exists (select 1 from public.extra_cards where glossary_entry_id is not null),
    'deleting a term keeps its card';
  delete from public.symbols where id = current_setting('test.skull')::uuid;
  assert not exists (select 1 from public.extra_cards), 'deleting a symbol keeps its card';
  assert not exists (select 1 from public.extra_review_log), 'deleting a card keeps its answers';
end;
$$;

rollback;
