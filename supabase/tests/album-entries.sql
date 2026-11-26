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
  image uuid;
  rejected boolean;
begin
  select id into saved from public.save_artwork(
    '{"title": "Venus of Willendorf", "author_unknown": true,
      "album_entry": "palaeolithic-venuses/willendorf", "album_revision": 1}',
    '{}', null,
    '[{"album_image_path": "palaeolithic-venuses/images/willendorf.webp",
       "source_image_licence": "CC BY-SA 4.0", "source_image_attribution": "Jane Doe",
       "image_width": 600, "image_height": 900}]');

  assert (select album_entry from public.artworks where id = saved) = 'palaeolithic-venuses/willendorf',
    'save_artwork does not store the album entry of a new artwork';
  assert (select album_revision from public.artworks where id = saved) = 1,
    'save_artwork does not store the album revision of a new artwork';
  assert (select album_image_path from public.artwork_images where artwork_id = saved)
      = 'palaeolithic-venuses/images/willendorf.webp',
    'save_artwork does not store the path of an album image';

  select id into image from public.artwork_images where artwork_id = saved;
  update public.artwork_images set palette = '[{"hex": "#aa8866", "share": 1}]', broken_at = now()
    where id = image;

  perform public.save_artwork(
    '{"title": "Venus of Willendorf", "author_unknown": true}', '{}', saved,
    jsonb_build_array(jsonb_build_object('id', image,
      'album_image_path', 'palaeolithic-venuses/images/willendorf.webp',
      'source_image_licence', 'CC BY-SA 4.0', 'image_width', 600, 'image_height', 900)));
  assert (select album_entry || '@' || album_revision from public.artworks where id = saved)
      = 'palaeolithic-venuses/willendorf@1',
    'an edit of the artwork without its album entry forgets the entry';
  assert (select palette is not null and broken_at is not null from public.artwork_images where id = image),
    'saving the same album image forgets its palette or its broken state';

  perform public.save_artwork(
    '{"title": "Venus of Willendorf", "author_unknown": true, "album_revision": 2}', '{}', saved);
  assert (select album_revision from public.artworks where id = saved) = 2,
    'save_artwork does not record a newer album revision';

  perform public.save_artwork(
    '{"title": "Venus of Willendorf", "author_unknown": true}', '{}', saved,
    jsonb_build_array(jsonb_build_object('id', image,
      'album_image_path', 'palaeolithic-venuses/images/willendorf-2.webp',
      'source_image_licence', 'CC BY-SA 4.0')));
  assert (select palette is null and broken_at is null from public.artwork_images where id = image),
    'a changed album image keeps the palette or the broken state of the old one';

  rejected := false;
  begin
    perform public.save_artwork(
      '{"title": "No revision", "author_unknown": true, "album_entry": "palaeolithic-venuses/lespugue"}',
      '{}', null);
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'an artwork takes an album entry without a revision';

  rejected := false;
  begin
    perform public.save_artwork(
      '{"title": "Bad entry", "author_unknown": true, "album_entry": "Lespugue", "album_revision": 1}',
      '{}', null);
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'an artwork takes an album entry that does not name its album';

  rejected := false;
  begin
    perform public.save_artwork('{"title": "No licence", "author_unknown": true}', '{}', null,
      '[{"album_image_path": "palaeolithic-venuses/images/lespugue.webp"}]');
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'an album image is saved without its licence';

  rejected := false;
  begin
    perform public.save_artwork('{"title": "Two sources", "author_unknown": true}', '{}', null,
      '[{"album_image_path": "palaeolithic-venuses/images/lespugue.webp", "source_image_licence": "CC0",
         "own_image_url": "https://example.com/lespugue.jpg"}]');
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'an album image is saved together with another source';

  rejected := false;
  begin
    perform public.save_artwork('{"title": "Escape", "author_unknown": true}', '{}', null,
      '[{"album_image_path": "palaeolithic-venuses/../secret.webp", "source_image_licence": "CC0"}]');
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'an album image path leaves the folder of the albums';
end;
$$;

rollback;
