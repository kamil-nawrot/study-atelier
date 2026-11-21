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
  today constant timestamptz := '2026-11-16T00:00:00Z';
  due_card constant jsonb := '{"due": "2026-11-15T08:00:00Z", "stability": 2, "difficulty": 5, "state": 2,
    "reps": 1, "lapses": 0, "scheduled_days": 2, "learning_steps": 0, "last_review": "2026-11-13T08:00:00Z"}';
  later_card constant jsonb := '{"due": "2026-11-30T08:00:00Z", "stability": 9, "difficulty": 5, "state": 2,
    "reps": 1, "lapses": 0, "scheduled_days": 14, "learning_steps": 0, "last_review": "2026-11-13T08:00:00Z"}';
  answer constant jsonb := '{"rating": 2, "correct": true}';
  overdue uuid;
  waiting uuid;
  held uuid;
  undefined_term uuid;
  peter uuid;
  painting uuid;
  image uuid;
  skull uuid;
  dove uuid;
  lily uuid;
  owl uuid;
  penance uuid;
  skull_pin uuid;
  dove_pin uuid;
  round jsonb;
  ids uuid[];
begin
  insert into public.profiles (review_glossary_questions, review_symbol_questions) values (1, 1);

  insert into public.glossary_entries (name, category, definition) values
    ('Fresco', 'technique', 'Paint on wet plaster'),
    ('Tempera', 'technique', 'Paint bound with egg'),
    ('Vanitas', 'painting', 'A still life about death');
  insert into public.glossary_entries (name, category, definition) values ('Tondo', 'painting', 'A round painting')
    returning id into overdue;
  insert into public.glossary_entries (name, category, definition) values ('Predella', 'painting', 'The base of an altarpiece')
    returning id into waiting;
  insert into public.glossary_entries (name, category, definition) values ('Sfumato', 'technique', 'Soft shading')
    returning id into held;
  insert into public.glossary_entries (name, category) values ('Impasto', 'technique') returning id into undefined_term;
  insert into public.glossary_entries (name, category) values ('Saint Peter', 'sacred') returning id into peter;
  insert into public.glossary_entries (name, category) values
    ('Saint Paul', 'sacred'), ('Saint Jerome', 'scholar'), ('Mary Magdalene', 'sacred');

  perform public.record_extra_review(overdue, null, due_card, answer || '{"mode": "quiz_definition"}', '2026-11-13T00:00:00Z');
  perform public.record_extra_review(waiting, null, later_card, answer || '{"mode": "quiz_definition"}', '2026-11-13T00:00:00Z');
  update public.extra_cards set due = '2026-11-15T08:00:00Z' where glossary_entry_id = overdue;
  perform public.save_flag(jsonb_build_object('term_id', held, 'reason', 'hidden', 'holds', true));

  select id into painting from public.save_artwork(
    '{"title": "Saint Jerome", "author_unknown": true, "era_code": "early_modern"}', '{}', null,
    '[{"own_image_url": "https://example.com/jerome.jpg", "image_width": 1200, "image_height": 800}]');
  select id into image from public.artwork_images where artwork_id = painting;

  skull := public.save_symbol('Skull', jsonb_build_array(
    jsonb_build_object('text', 'transience', 'contexts', '[]'::jsonb),
    jsonb_build_object('text', 'penance', 'contexts', jsonb_build_array(
      jsonb_build_object('glossary_entry_id', peter)))));
  select id into penance from public.symbol_meanings where symbol_id = skull and position = 1;
  dove := public.save_symbol('Dove', jsonb_build_array(jsonb_build_object('text', 'peace', 'contexts', '[]'::jsonb)));
  lily := public.save_symbol('Lily', jsonb_build_array(jsonb_build_object('text', 'purity', 'contexts', '[]'::jsonb)));
  owl := public.save_symbol('Owl', jsonb_build_array(jsonb_build_object('text', 'wisdom', 'contexts', '[]'::jsonb)));

  insert into public.artwork_pins (image_id, x, y, view_width, symbol_id, symbol_meaning_id)
    values (image, 0.5, 0.5, 0.2, skull, penance)
    returning id into skull_pin;
  insert into public.artwork_pins (image_id, x, y, view_width, symbol_id)
    values (image, 0.3, 0.3, 0.2, dove)
    returning id into dove_pin;
  insert into public.artwork_pins (image_id, x, y, symbol_id) values (image, 0.2, 0.2, lily);
  insert into public.artwork_pins (image_id, x, y, view_width, symbol_id)
    values (image, 0.7, 0.7, 0.2, owl);
  reset role;
  update public.artwork_pins set crop_path = '00000000-0000-0000-0000-00000000000a/' || id || '.jpg'
    where image_id = image and view_width is not null;
  set local role authenticated;
  perform public.save_flag(jsonb_build_object('symbol_id', owl, 'reason', 'meaning', 'holds', true));

  perform public.record_extra_review(null, skull, due_card, answer || '{"mode": "symbol_symbol"}', '2026-11-12T00:00:00Z');
  perform public.record_extra_review(null, skull, due_card, answer || '{"mode": "symbol_meaning"}', '2026-11-13T00:00:00Z');
  update public.extra_cards set due = '2026-11-15T08:00:00Z' where symbol_id = skull;

  round := public.extra_round(today);
  select array_agg((term ->> 'id')::uuid) into ids from jsonb_array_elements(round -> 'terms') as term;
  assert cardinality(ids) = 3, 'the round does not take the count and the reserve of glossary questions';
  assert ids[1] = overdue, 'a due term does not come first';
  assert (round -> 'terms' -> 0 -> 'card' ->> 'due')::timestamptz = '2026-11-15T08:00:00Z',
    'a due term comes without its card';
  assert round -> 'terms' -> 1 -> 'card' = 'null'::jsonb, 'a new term comes with a card';
  assert not ids && array[waiting, held, undefined_term],
    'the round takes a term not due, held or without a definition';

  assert jsonb_array_length(round -> 'symbols') = 2, 'the round takes a symbol without a question or held';
  assert (round -> 'symbols' -> 0 ->> 'symbol_id')::uuid = skull, 'a due symbol does not come first';
  assert (round -> 'symbols' -> 0 ->> 'pin_id')::uuid = skull_pin, 'the symbol comes with a pin of another symbol';
  assert round -> 'symbols' -> 0 ->> 'kind' = 'attribute', 'the kind never asked does not come first';
  assert (round -> 'symbols' -> 1 ->> 'symbol_id')::uuid = dove
      and (round -> 'symbols' -> 1 ->> 'pin_id')::uuid = dove_pin
      and round -> 'symbols' -> 1 ->> 'kind' = 'symbol',
    'a new symbol without a meaning is not asked what it shows';

  perform public.record_extra_review(null, skull, due_card, answer || '{"mode": "symbol_attribute"}', '2026-11-14T00:00:00Z');
  update public.extra_cards set due = '2026-11-15T08:00:00Z' where symbol_id = skull;
  reset role;
  update public.extra_review_log set reviewed_at = case mode
      when 'symbol_symbol' then '2026-11-12T08:00:00Z'::timestamptz
      when 'symbol_meaning' then '2026-11-13T08:00:00Z'::timestamptz
      else '2026-11-14T08:00:00Z'::timestamptz end
    where owner_id = '00000000-0000-0000-0000-00000000000a';
  set local role authenticated;
  round := public.extra_round(today);
  assert round -> 'symbols' -> 0 ->> 'kind' = 'symbol', 'the kind asked longest ago does not come next';

  update public.profiles set review_glossary_on = false, review_symbol_questions = 3;
  round := public.extra_round(today, 0);
  assert round -> 'terms' = '[]'::jsonb, 'the round takes terms with the glossary questions off';
  assert jsonb_array_length(round -> 'symbols') = 2, 'the round makes up symbols it cannot ask';

  perform public.save_flag(jsonb_build_object('artwork_id', painting, 'pin_id', dove_pin, 'reason', 'pin',
    'holds', true));
  round := public.extra_round(today, 0);
  assert not (round -> 'symbols') @> jsonb_build_array(jsonb_build_object('symbol_id', dove)),
    'a held pin still asks its symbol';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  round jsonb;
  rejected boolean;
begin
  round := public.extra_round('2026-11-16T00:00:00Z');
  assert round = '{"terms": [], "symbols": [], "events": []}'::jsonb, 'B gets the terms, symbols or events of A';

  insert into public.glossary_entries (name, category, definition) values
    ('Fresco', 'technique', 'Paint on wet plaster'),
    ('Tempera', 'technique', 'Paint bound with egg'),
    ('Tondo', 'painting', 'A round painting');
  round := public.extra_round('2026-11-16T00:00:00Z');
  assert round -> 'terms' = '[]'::jsonb, 'the round asks a definition with fewer than four terms to choose from';

  begin
    perform public.extra_round('2026-11-16T00:00:00Z', -1);
    rejected := false;
  exception when invalid_parameter_value then
    rejected := true;
  end;
  assert rejected, 'the round takes a negative reserve';
end;
$$;

rollback;
