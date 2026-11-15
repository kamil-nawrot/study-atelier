\set ON_ERROR_STOP on

begin;

create schema poster_test;
grant usage on schema poster_test to authenticated;

create function poster_test.failure(statement text)
returns text
language plpgsql
as $$
declare
  state text;
begin
  execute statement;
  return null;
exception
  when others then
    get stacked diagnostics state = returned_sqlstate;
    return state;
end;
$$;

grant execute on all functions in schema poster_test to authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

create temporary table foreign_ids (artwork uuid, image uuid);
grant all on foreign_ids to authenticated;

do $$
declare
  stranger uuid;
begin
  select id into stranger from public.save_artwork(
    '{"title": "Stranger", "author_unknown": true}', '{"author": [], "location": []}');
  insert into public.artwork_images (artwork_id, position, own_image_url)
    values (stranger, 0, 'https://images.example.test/stranger.jpg');
  insert into foreign_ids
    select stranger, (select id from public.artwork_images where artwork_id = stranger);
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  judith uuid;
  olympia uuid;
  judith_first uuid;
  judith_detail uuid;
  olympia_first uuid;
  exhibition uuid := gen_random_uuid();
  stranger uuid := (select artwork from foreign_ids);
  stranger_image uuid := (select image from foreign_ids);
  saved public.exhibitions;
begin
  select id into judith from public.save_artwork(
    '{"title": "Judith", "author_unknown": true}', '{"author": [], "location": []}');
  select id into olympia from public.save_artwork(
    '{"title": "Olympia", "author_unknown": true}', '{"author": [], "location": []}');
  insert into public.artwork_images (artwork_id, position, own_image_url) values
    (judith, 0, 'https://images.example.test/judith.jpg'),
    (judith, 1, 'https://images.example.test/judith-detail.jpg'),
    (olympia, 0, 'https://images.example.test/olympia.jpg');
  select id into judith_first from public.artwork_images where artwork_id = judith and position = 0;
  select id into judith_detail from public.artwork_images where artwork_id = judith and position = 1;
  select id into olympia_first from public.artwork_images where artwork_id = olympia and position = 0;

  perform public.save_exhibition(exhibition, 'Light', jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', olympia)),
    jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', judith)))));

  select * into saved from public.exhibitions where id = exhibition;
  assert saved.cover_artwork_id is null and saved.cover_grayscale = 0 and saved.cover_sepia = 0
    and saved.cover_brightness = 100 and saved.cover_contrast = 100 and saved.cover_saturate = 100,
    'a new exhibition does not start with no poster and neutral filters';

  perform public.set_exhibition_cover(exhibition, judith, judith_detail, 0.25, 0.75, 2,
    40::smallint, 10::smallint, 120::smallint, 80::smallint, 150::smallint);
  select * into saved from public.exhibitions where id = exhibition;
  assert saved.cover_artwork_id = judith and saved.cover_image_id = judith_detail
    and saved.cover_x = 0.25 and saved.cover_y = 0.75 and saved.cover_zoom = 2
    and saved.cover_grayscale = 40 and saved.cover_sepia = 10 and saved.cover_brightness = 120
    and saved.cover_contrast = 80 and saved.cover_saturate = 150,
    'set_exhibition_cover does not store the poster';
  assert saved.revision = 1, 'set_exhibition_cover raises the revision of the document';

  assert poster_test.failure(format(
    'select public.set_exhibition_cover(%L, %L, %L)', exhibition, judith, olympia_first)) = '22023',
    'set_exhibition_cover takes an image of another artwork';
  assert poster_test.failure(format(
    'select public.set_exhibition_cover(%L, %L)', exhibition, stranger)) = '23503',
    'set_exhibition_cover takes an artwork of another owner';
  assert poster_test.failure(format(
    'select public.set_exhibition_cover(%L, %L, %L)', exhibition, stranger, stranger_image)) = '22023',
    'set_exhibition_cover takes an image of another owner';
  assert poster_test.failure(format(
    'select public.set_exhibition_cover(%L, %L, null, 0.5, 0.5, 4)', exhibition, judith)) = '23514',
    'set_exhibition_cover takes a zoom above 3';
  assert poster_test.failure(format(
    'select public.set_exhibition_cover(%L, %L, null, 1.5, 0.5, 1)', exhibition, judith)) = '23514',
    'set_exhibition_cover takes a crop outside the image';
  assert poster_test.failure(format(
    'select public.set_exhibition_cover(%L, null, null, null, null, null, 0::smallint, 0::smallint, 60::smallint)',
    exhibition)) = '23514',
    'set_exhibition_cover takes a brightness below 70';
  assert poster_test.failure(format(
    'select public.set_exhibition_cover(%L, null, null, null, null, null, 0::smallint, 0::smallint, 100::smallint, 100::smallint, 160::smallint)',
    exhibition)) = '23514',
    'set_exhibition_cover takes a saturation above 150';
  assert poster_test.failure(format(
    'select public.set_exhibition_cover(%L, %L, null, 0.5, null, 1)', exhibition, judith)) = '23514',
    'set_exhibition_cover takes half a crop';
  assert poster_test.failure(format(
    'select public.set_exhibition_cover(%L)', gen_random_uuid())) = 'P0002',
    'set_exhibition_cover finds an exhibition that does not exist';

  perform public.save_exhibition(exhibition, 'Light', jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', olympia)))), 1);
  assert (select cover_artwork_id from public.exhibitions where id = exhibition) = judith,
    'removing the artwork of the poster from the document forgets the choice';

  delete from public.artwork_images where id = judith_detail;
  select * into saved from public.exhibitions where id = exhibition;
  assert saved.cover_image_id is null and saved.cover_artwork_id = judith and saved.cover_zoom = 2,
    'deleting the image of the poster does not clear only the image';

  delete from public.artworks where id = judith;
  select * into saved from public.exhibitions where id = exhibition;
  assert saved.cover_artwork_id is null and saved.cover_grayscale = 40,
    'purging the artwork of the poster does not clear only the artwork';

  perform public.set_exhibition_cover(exhibition);
  select * into saved from public.exhibitions where id = exhibition;
  assert saved.cover_artwork_id is null and saved.cover_x is null and saved.cover_grayscale = 0
    and saved.cover_brightness = 100,
    'set_exhibition_cover without a poster does not start over';
end;
$$;

rollback;
