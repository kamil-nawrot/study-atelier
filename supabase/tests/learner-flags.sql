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
  painting uuid;
  other_painting uuid;
  image uuid;
  other_image uuid;
  pin uuid;
  other_pin uuid;
  term uuid;
  skull uuid;
  created boolean;
  rejected boolean;
begin
  select id into painting from public.save_artwork(
    '{"title": "Saint Jerome", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/jerome.jpg", "image_width": 1200, "image_height": 800},
      {"own_image_url": "https://example.com/detail.jpg", "image_width": 600, "image_height": 400}]');
  select id into image from public.artwork_images where artwork_id = painting and position = 0;
  select id into other_painting from public.save_artwork(
    '{"title": "Other", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/other.jpg", "image_width": 1200, "image_height": 800}]');
  select id into other_image from public.artwork_images where artwork_id = other_painting;
  insert into public.glossary_entries (name, category, definition) values ('Vanitas', 'painting', 'A still life')
    returning id into term;
  skull := public.save_symbol('Skull', '[]');
  insert into public.artwork_pins (image_id, x, y, glossary_entry_id) values (image, 0.25, 0.5, term)
    returning id into pin;
  insert into public.artwork_pins (image_id, x, y, glossary_entry_id) values (other_image, 0.5, 0.5, term)
    returning id into other_pin;
  perform set_config('test.painting', painting::text, true);
  perform set_config('test.term', term::text, true);

  created := public.save_flag(jsonb_build_object('artwork_id', painting, 'image_id', image, 'pin_id', pin,
    'reason', 'pin', 'question', jsonb_build_object('mode', 'quiz_pin', 'text', 'Co to jest?')));
  assert created, 'save_flag does not say that it created the first flag';
  created := public.save_flag(jsonb_build_object('artwork_id', painting, 'image_id', image, 'pin_id', pin,
    'reason', 'pin', 'comment', '  Wrong detail  '));
  assert not created, 'save_flag creates a second flag for the same pin and reason';
  assert (select count(*) from public.learner_flags where pin_id = pin) = 1,
    'a second flag of the same pin and reason is stored beside the first';
  assert (select comment from public.learner_flags where pin_id = pin) = 'Wrong detail',
    'a second flag does not replace the comment of the first';
  assert (select question ->> 'mode' from public.learner_flags where pin_id = pin) = 'quiz_pin',
    'a second flag without a question drops the question of the first';

  assert public.save_flag(jsonb_build_object('artwork_id', painting, 'reason', 'data')),
    'a flag of another reason on the same artwork is not created';
  assert public.save_flag(jsonb_build_object('artwork_id', painting, 'image_id', image, 'reason', 'image')),
    'a flag of one image is not created';
  assert public.save_flag(jsonb_build_object('term_id', term, 'reason', 'hidden',
    'question', jsonb_build_object('mode', 'note_gap', 'note', 1))),
    'a flag of a term is not created';
  assert public.save_flag(jsonb_build_object('symbol_id', skull, 'reason', 'meaning')),
    'a flag of a symbol is not created';

  begin
    perform public.save_flag(jsonb_build_object('artwork_id', painting, 'pin_id', other_pin, 'reason', 'pin'));
    rejected := false;
  exception when foreign_key_violation then
    rejected := true;
  end;
  assert rejected, 'a flag points to a pin of another artwork';

  begin
    perform public.save_flag(jsonb_build_object('artwork_id', painting, 'image_id', other_image, 'reason', 'image'));
    rejected := false;
  exception when foreign_key_violation then
    rejected := true;
  end;
  assert rejected, 'a flag points to an image of another artwork';

  begin
    perform public.save_flag(jsonb_build_object('artwork_id', painting, 'term_id', term, 'reason', 'other',
      'comment', 'Two items'));
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a flag points to two items at once';

  begin
    perform public.save_flag(jsonb_build_object('reason', 'other', 'comment', 'Nothing'));
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a flag points to no item';

  begin
    perform public.save_flag(jsonb_build_object('term_id', term, 'reason', 'other', 'comment', '   '));
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a flag of something else is saved without a comment';

  begin
    perform public.save_flag(jsonb_build_object('term_id', term, 'image_id', image, 'reason', 'definition'));
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a flag of a term keeps an image';

  begin
    perform public.save_flag(jsonb_build_object('term_id', term, 'reason', 'definition',
      'comment', repeat('x', 201)));
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a comment longer than 200 characters is saved';

  assert public.flag_count() = 5, 'flag_count does not count every flag of the learner';
  update public.artworks set deleted_at = now() where id = painting;
  assert public.flag_count() = 2, 'flag_count counts the flags of an artwork in Archiwum';
  update public.artworks set deleted_at = null where id = painting;

  delete from public.artwork_pins where id = pin;
  assert exists (select 1 from public.learner_flags where reason = 'pin' and pin_id is null and image_id = image),
    'deleting a pin deletes its flag instead of keeping it on the image';

  perform public.save_artwork('{"title": "Saint Jerome", "author_unknown": true}', '{}', painting,
    '[{"own_image_url": "https://example.com/detail.jpg", "image_width": 600, "image_height": 400}]');
  assert (select count(*) from public.learner_flags where artwork_id = painting and image_id is not null) = 0,
    'deleting an image keeps it on its flags';
  assert (select count(*) from public.learner_flags where artwork_id = painting) = 3,
    'deleting an image deletes the flags of its artwork';

  delete from public.symbols where id = skull;
  assert not exists (select 1 from public.learner_flags where reason = 'meaning'),
    'deleting a symbol keeps its flags';
end;
$$;

do $$
declare
  held uuid;
  pinned uuid;
  pin uuid;
  in_round boolean;
begin
  select id into held from public.save_artwork('{"title": "Held", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/held.jpg", "image_width": 10, "image_height": 10}]');
  select id into pinned from public.save_artwork('{"title": "Pinned", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/pinned.jpg", "image_width": 10, "image_height": 10}]');
  insert into public.artwork_pins (image_id, x, y, text)
    select id, 0.5, 0.5, 'A pin' from public.artwork_images where artwork_id = pinned
    returning id into pin;

  perform public.save_flag(jsonb_build_object('artwork_id', held, 'reason', 'image', 'holds', true));
  perform public.save_flag(jsonb_build_object('artwork_id', pinned, 'pin_id', pin, 'reason', 'pin',
    'holds', true));
  assert (select holds from public.learner_flags where artwork_id = held),
    'a flag does not keep that it holds its question';
  perform public.save_flag(jsonb_build_object('artwork_id', held, 'reason', 'image', 'comment', 'Blurry'));
  assert (select holds from public.learner_flags where artwork_id = held),
    'a second flag without the hold releases the question';

  select exists (
    select 1 from jsonb_array_elements(public.review_round('2026-11-16T00:00:00Z') -> 'facts') as fact
      where (fact ->> 'id')::uuid = held
  ) into in_round;
  assert not in_round, 'the round asks about an artwork held by a flag of its image';
  select exists (
    select 1 from jsonb_array_elements(public.review_round('2026-11-16T00:00:00Z') -> 'facts') as fact
      where (fact ->> 'id')::uuid = pinned
  ) into in_round;
  assert in_round, 'a held pin keeps the whole artwork out of the round';

  delete from public.learner_flags where artwork_id = held;
  select exists (
    select 1 from jsonb_array_elements(public.review_round('2026-11-16T00:00:00Z') -> 'facts') as fact
      where (fact ->> 'id')::uuid = held
  ) into in_round;
  assert in_round, 'an artwork stays out of the round after its flag is gone';
  delete from public.artworks where id in (held, pinned);
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  rejected boolean;
begin
  assert (select count(*) from public.learner_flags) = 0, 'B reads the flags of A';
  assert public.flag_count() = 0, 'flag_count counts the flags of A for B';
  begin
    perform public.save_flag(jsonb_build_object('artwork_id', current_setting('test.painting')::uuid,
      'reason', 'data'));
    rejected := false;
  exception when foreign_key_violation then
    rejected := true;
  end;
  assert rejected, 'B flags an artwork of A';
  begin
    perform public.save_flag(jsonb_build_object('term_id', current_setting('test.term')::uuid,
      'reason', 'definition'));
    rejected := false;
  exception when foreign_key_violation then
    rejected := true;
  end;
  assert rejected, 'B flags a term of A';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  delete from public.glossary_entries where id = current_setting('test.term')::uuid;
  assert not exists (select 1 from public.learner_flags where term_id is not null),
    'deleting a term keeps its flags';
  delete from public.artworks where id = current_setting('test.painting')::uuid;
  assert not exists (select 1 from public.learner_flags), 'deleting an artwork keeps its flags';
end;
$$;

rollback;
