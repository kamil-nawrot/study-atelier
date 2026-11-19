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
  saved uuid;
  main uuid;
  extra uuid;
  in_round boolean;
begin
  select id into saved from public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/facade.jpg", "image_width": 4, "image_height": 3},
      {"own_image_url": "https://example.com/frieze.jpg", "image_width": 4, "image_height": 3}]');
  select id into main from public.artwork_images where artwork_id = saved and position = 0;
  select id into extra from public.artwork_images where artwork_id = saved and position = 1;

  assert (select broken_at from public.artwork_images where id = main) is null,
    'a new image is broken';

  update public.artwork_images set broken_at = now() where id = extra;
  assert (select broken_at from public.artwork_images where id = extra) is not null,
    'the owner cannot mark an image broken';

  select exists (
    select 1 from jsonb_array_elements(public.review_round('2026-11-19T00:00:00Z') -> 'facts') as fact
      where (fact ->> 'id')::uuid = saved
  ) into in_round;
  assert in_round, 'a broken extra image holds the artwork in the review';

  update public.artwork_images set broken_at = now() where id = main;
  select exists (
    select 1 from jsonb_array_elements(public.review_round('2026-11-19T00:00:00Z') -> 'facts') as fact
      where (fact ->> 'id')::uuid = saved
  ) into in_round;
  assert not in_round, 'the round asks about an artwork whose main image is broken';

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', saved,
    jsonb_build_array(
      jsonb_build_object('id', main, 'own_image_url', 'https://example.com/facade.jpg',
        'image_width', 4, 'image_height', 3),
      jsonb_build_object('id', extra, 'own_image_url', 'https://example.com/frieze.jpg',
        'image_width', 4, 'image_height', 3)));
  assert (select broken_at from public.artwork_images where id = main) is not null,
    'saving the artwork with the same image forgets that it is broken';

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', saved,
    jsonb_build_array(
      jsonb_build_object('id', main, 'own_image_url', 'https://example.com/new-facade.jpg',
        'image_width', 4, 'image_height', 3),
      jsonb_build_object('id', extra, 'own_image_url', 'https://example.com/frieze.jpg',
        'image_width', 4, 'image_height', 3)));
  assert (select broken_at from public.artwork_images where id = main) is null,
    'replacing the image keeps it broken';
  assert (select broken_at from public.artwork_images where id = extra) is not null,
    'replacing another image forgets that this one is broken';

  select exists (
    select 1 from jsonb_array_elements(public.review_round('2026-11-19T00:00:00Z') -> 'facts') as fact
      where (fact ->> 'id')::uuid = saved
  ) into in_round;
  assert in_round, 'the artwork stays out of the round after its image is replaced';

  update public.artwork_images set broken_at = null where id = extra;
  assert (select broken_at from public.artwork_images where id = extra) is null,
    'the owner cannot clear a broken image';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  update public.artwork_images set broken_at = now();
  assert not found, 'B marks an image of A broken';
end;
$$;

rollback;
