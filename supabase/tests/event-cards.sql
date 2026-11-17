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
  today constant timestamptz := '2026-11-17T00:00:00Z';
  due_card constant jsonb := '{"due": "2026-11-16T08:00:00Z", "stability": 2, "difficulty": 5, "state": 2,
    "reps": 1, "lapses": 0, "scheduled_days": 2, "learning_steps": 0, "last_review": "2026-11-14T08:00:00Z"}';
  later_card constant jsonb := '{"due": "2026-11-30T08:00:00Z", "stability": 9, "difficulty": 5, "state": 2,
    "reps": 1, "lapses": 0, "scheduled_days": 14, "learning_steps": 0, "last_review": "2026-11-14T08:00:00Z"}';
  war uuid;
  battle uuid;
  waiting uuid;
  term uuid;
  round jsonb;
  scheduled boolean;
  rejected boolean;
begin
  insert into public.profiles (review_event_questions) values (2);
  insert into public.timeline_events (name, year_from, year_to) values ('Thirty Years War', 1618, 1648)
    returning id into war;
  insert into public.timeline_events (name, year_to) values ('Battle of Grunwald', 1410)
    returning id into battle;
  insert into public.timeline_events (name, year_to) values ('Council of Trent', 1545)
    returning id into waiting;
  insert into public.glossary_entries (name, category) values ('Fresco', 'technique') returning id into term;
  perform set_config('test.battle', battle::text, true);

  scheduled := public.record_extra_review(null, null, due_card,
    '{"mode": "event_start", "rating": 3, "correct": true}', '2026-11-14T00:00:00Z', war);
  assert scheduled, 'the first answer to an event does not schedule its card';
  assert (select timeline_event_id from public.extra_cards) = war, 'the card does not reference its event';
  assert (select rating from public.extra_review_log) = 3, 'the answer does not keep a rating of three';
  perform public.record_extra_review(null, null, later_card,
    '{"mode": "event_year", "rating": 2, "correct": true}', '2026-11-14T00:00:00Z', waiting);
  update public.extra_cards set due = '2026-11-16T08:00:00Z' where timeline_event_id = war;

  begin
    perform public.record_extra_review(term, null, due_card,
      '{"mode": "event_year", "rating": 2, "correct": true}', today, battle);
    rejected := false;
  exception when invalid_parameter_value then
    rejected := true;
  end;
  assert rejected, 'an answer takes a term and an event at once';

  begin
    insert into public.extra_cards (glossary_entry_id, timeline_event_id, due, stability, difficulty, state)
      values (term, battle, today, 1, 1, 0);
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a card takes a term and an event at once';

  round := public.extra_round(today);
  assert jsonb_array_length(round -> 'events') = 2, 'the round does not take the count of events';
  assert (round -> 'events' -> 0 ->> 'id')::uuid = war, 'a due event does not come first';
  assert round -> 'events' -> 0 ->> 'kind' = 'end', 'a period asked for its start is not asked for its end';
  assert round -> 'events' -> 0 -> 'card' ->> 'id' is not null, 'a due event comes without its card';
  assert (round -> 'events' -> 1 ->> 'id')::uuid = battle
      and round -> 'events' -> 1 ->> 'kind' = 'year'
      and round -> 'events' -> 1 -> 'card' = 'null'::jsonb,
    'a new event of a single year is not asked for its year';
  assert not (round -> 'events') @> jsonb_build_array(jsonb_build_object('id', waiting)),
    'the round takes an event not due';

  perform public.record_extra_review(null, null, due_card,
    '{"mode": "event_end", "rating": 1, "correct": false}', '2026-11-15T00:00:00Z', war);
  update public.extra_cards set due = '2026-11-16T08:00:00Z' where timeline_event_id = war;
  reset role;
  update public.extra_review_log set reviewed_at = case mode
      when 'event_start' then '2026-11-14T08:00:00Z'::timestamptz
      else '2026-11-15T08:00:00Z'::timestamptz end
    where owner_id = '00000000-0000-0000-0000-00000000000a';
  set local role authenticated;
  update public.profiles set review_event_questions = 1;
  round := public.extra_round(today, 2);
  assert jsonb_array_length(round -> 'events') = 1, 'the round adds a reserve of events, which are never skipped';
  assert round -> 'events' -> 0 ->> 'kind' = 'start', 'the end asked longest ago does not come next';

  perform public.record_extra_review(null, null, due_card,
    '{"mode": "event_start", "rating": 2, "correct": true}', '2026-11-15T00:00:00Z', war);
  round := public.extra_round(today, 0);
  assert round -> 'events' -> 0 ->> 'kind' = 'start',
    'a practice answer changes the end asked next';

  update public.profiles set review_events_on = false;
  round := public.extra_round(today);
  assert round -> 'events' = '[]'::jsonb, 'the round takes events with the event questions off';

  begin
    update public.profiles set review_event_questions = 4;
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'the count of event questions takes 4';

  delete from public.timeline_events where id = war;
  assert not exists (select 1 from public.extra_cards where timeline_event_id = war),
    'the card of a deleted event stays';
  assert (select count(*) from public.extra_review_log) = 1, 'the answers of a deleted event stay';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  rejected boolean;
begin
  assert (public.extra_round('2026-11-17T00:00:00Z') -> 'events') = '[]'::jsonb, 'B gets the events of A';
  begin
    perform public.record_extra_review(null, null, '{"due": "2026-11-18T08:00:00Z", "stability": 1,
      "difficulty": 5, "state": 1}', '{"mode": "event_year", "rating": 2, "correct": true}', null,
      current_setting('test.battle')::uuid);
    rejected := false;
  exception when foreign_key_violation then
    rejected := true;
  end;
  assert rejected, 'B answers about an event of A';
end;
$$;

rollback;
