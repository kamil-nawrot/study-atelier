\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  saved uuid;
  rejected boolean := false;
begin
  select id into saved from public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true, "own_image_url": "https://example.com/facade.jpg", "image_width": 4, "image_height": 3}',
    '{}', null,
    '[{"own_image_url": "https://example.com/plan.jpg", "image_width": 3, "image_height": 4},
      {"source_wikidata_id": "Q10288", "source_image_file": "Interior.jpg", "image_width": 2, "image_height": 2}]');

  assert (select own_image_url from public.artworks where id = saved) = 'https://example.com/facade.jpg',
    'save_artwork does not keep the main image in the artwork';
  assert (select array_agg(position order by position) from public.artwork_images where artwork_id = saved) = '{1,2}',
    'save_artwork does not number the other images in their order';
  assert (select source_image_file from public.artwork_images where artwork_id = saved and position = 2) = 'Interior.jpg',
    'save_artwork does not store the source of another image';

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true, "own_image_url": "https://example.com/facade.jpg", "image_width": 4, "image_height": 3}',
    '{}', saved);
  assert (select count(*) from public.artwork_images where artwork_id = saved) = 2,
    'save_artwork without other images drops the ones the artwork has';

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true, "own_image_url": "https://example.com/plan.jpg", "image_width": 3, "image_height": 4}',
    '{}', saved,
    '[{"own_image_url": "https://example.com/facade.jpg", "image_width": 4, "image_height": 3}]');
  assert (select own_image_url from public.artworks where id = saved) = 'https://example.com/plan.jpg',
    'save_artwork does not make another image the main one';
  assert (select array_agg(own_image_url) from public.artwork_images where artwork_id = saved) = '{https://example.com/facade.jpg}',
    'save_artwork does not replace the other images';

  perform public.save_artwork('{"title": "Parthenon", "author_unknown": true}', '{}', saved, '[]');
  assert (select count(*) from public.artwork_images where artwork_id = saved) = 0,
    'save_artwork with an empty list keeps the other images';

  begin
    perform public.save_artwork('{"title": "Too many", "author_unknown": true}', '{}', null,
      '[{"own_image_url": "https://example.com/1.jpg"}, {"own_image_url": "https://example.com/2.jpg"},
        {"own_image_url": "https://example.com/3.jpg"}, {"own_image_url": "https://example.com/4.jpg"},
        {"own_image_url": "https://example.com/5.jpg"}]');
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'save_artwork takes more than four images besides the main one';

  rejected := false;
  begin
    perform public.save_artwork('{"title": "Empty slot", "author_unknown": true}', '{}', null, '[{}]');
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'save_artwork stores another image without a source';

  perform public.save_artwork(
    '{"title": "Gone", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/gone.jpg"}]');
  delete from public.artworks where title = 'Gone';
  assert not exists (select 1 from public.artwork_images where own_image_url = 'https://example.com/gone.jpg'),
    'deleting an artwork keeps its other images';
end;
$$;

rollback;
