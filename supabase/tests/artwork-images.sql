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
  facade uuid;
  plan uuid;
  interior uuid;
  rejected boolean := false;
begin
  select id into saved from public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}',
    '{}', null,
    '[{"own_image_url": "https://example.com/facade.jpg", "image_width": 4, "image_height": 3},
      {"own_image_url": "https://example.com/plan.jpg", "image_width": 3, "image_height": 4},
      {"source_wikidata_id": "Q10288", "source_image_file": "Interior.jpg", "image_width": 2, "image_height": 2}]');

  assert (select array_agg(position order by position) from public.artwork_images where artwork_id = saved) = '{0,1,2}',
    'save_artwork does not number the images from the main one in their order';
  assert (select own_image_url from public.artwork_images where artwork_id = saved and position = 0) = 'https://example.com/facade.jpg',
    'save_artwork does not keep the main image at position 0';
  assert (select source_image_file from public.artwork_images where artwork_id = saved and position = 2) = 'Interior.jpg',
    'save_artwork does not store the source of an image';

  select id into facade from public.artwork_images where artwork_id = saved and position = 0;
  select id into plan from public.artwork_images where artwork_id = saved and position = 1;
  select id into interior from public.artwork_images where artwork_id = saved and position = 2;

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', saved,
    jsonb_build_array(
      jsonb_build_object('id', plan, 'own_image_url', 'https://example.com/plan.jpg', 'image_width', 3, 'image_height', 4),
      jsonb_build_object('id', facade, 'own_image_url', 'https://example.com/facade.jpg', 'image_width', 4, 'image_height', 3),
      jsonb_build_object('id', interior, 'source_wikidata_id', 'Q10288', 'source_image_file', 'Interior.jpg')));
  assert (select id from public.artwork_images where artwork_id = saved and position = 0) = plan,
    'save_artwork does not make another image the main one with its id';
  assert (select id from public.artwork_images where artwork_id = saved and position = 1) = facade,
    'save_artwork does not keep the id of an image that moved';
  assert (select count(*) from public.artwork_images where artwork_id = saved) = 3,
    'save_artwork adds images when it reorders them';

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', saved,
    jsonb_build_array(
      jsonb_build_object('id', plan, 'own_image_url', 'https://example.com/replaced.jpg', 'image_width', 5, 'image_height', 5),
      jsonb_build_object('id', facade, 'own_image_url', 'https://example.com/facade.jpg', 'image_width', 4, 'image_height', 3)));
  assert (select own_image_url from public.artwork_images where id = plan) = 'https://example.com/replaced.jpg',
    'save_artwork does not replace an image under its id';
  assert not exists (select 1 from public.artwork_images where id = interior),
    'save_artwork keeps an image that is missing from the list';

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', saved,
    '[{"own_image_url": "https://example.com/new.jpg"}]');
  assert (select array_agg(own_image_url) from public.artwork_images where artwork_id = saved) = '{https://example.com/new.jpg}',
    'save_artwork does not drop the images missing from the list';
  assert not exists (select 1 from public.artwork_images where id in (plan, facade)),
    'save_artwork keeps the old ids when it drops their images';

  perform public.save_artwork('{"title": "Parthenon", "author_unknown": true}', '{}', saved);
  assert (select count(*) from public.artwork_images where artwork_id = saved) = 1,
    'save_artwork without a list of images touches the images';

  perform public.save_artwork('{"title": "Parthenon", "author_unknown": true}', '{}', saved, '[]');
  assert (select count(*) from public.artwork_images where artwork_id = saved) = 0,
    'save_artwork with an empty list keeps the images';

  begin
    perform public.save_artwork('{"title": "Too many", "author_unknown": true}', '{}', null,
      '[{"own_image_url": "https://example.com/1.jpg"}, {"own_image_url": "https://example.com/2.jpg"},
        {"own_image_url": "https://example.com/3.jpg"}, {"own_image_url": "https://example.com/4.jpg"},
        {"own_image_url": "https://example.com/5.jpg"}, {"own_image_url": "https://example.com/6.jpg"}]');
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'save_artwork takes more than five images';

  rejected := false;
  begin
    perform public.save_artwork('{"title": "Empty slot", "author_unknown": true}', '{}', null, '[{}]');
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'save_artwork stores an image without a source';

  rejected := false;
  begin
    perform public.save_artwork('{"title": "Stranger", "author_unknown": true}', '{}', null,
      jsonb_build_array(jsonb_build_object('id', facade, 'own_image_url', 'https://example.com/facade.jpg')));
  exception
    when no_data_found then rejected := true;
  end;
  assert rejected, 'save_artwork takes an id that is not an image of the artwork';

  perform public.save_artwork(
    '{"title": "Gone", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/gone.jpg"}]');
  delete from public.artworks where title = 'Gone';
  assert not exists (select 1 from public.artwork_images where own_image_url = 'https://example.com/gone.jpg'),
    'deleting an artwork keeps its images';
end;
$$;

rollback;
