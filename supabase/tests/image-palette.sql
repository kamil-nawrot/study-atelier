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
  image uuid;
  rejected boolean := false;
begin
  select id into saved from public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/facade.jpg", "image_width": 4, "image_height": 3}]');
  select id into image from public.artwork_images where artwork_id = saved;

  assert (select palette from public.artwork_images where id = image) is null,
    'a new image has a palette';

  update public.artwork_images
    set palette = '[{"color": "#aa8855", "share": 0.6}, {"color": "#223344", "share": 0.4}]'
    where id = image;
  assert (select jsonb_array_length(palette) from public.artwork_images where id = image) = 2,
    'the owner cannot store a palette';

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', saved,
    jsonb_build_array(jsonb_build_object(
      'id', image, 'own_image_url', 'https://example.com/facade.jpg', 'image_width', 4, 'image_height', 3)));
  assert (select jsonb_array_length(palette) from public.artwork_images where id = image) = 2,
    'saving the artwork with the same image loses its palette';

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', saved,
    jsonb_build_array(jsonb_build_object(
      'id', image, 'own_image_url', 'https://example.com/other.jpg', 'image_width', 4, 'image_height', 3)));
  assert (select palette from public.artwork_images where id = image) is null,
    'replacing the image keeps the old palette';

  begin
    update public.artwork_images set palette = '[]' where id = image;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'an empty palette is accepted';

  rejected := false;
  begin
    update public.artwork_images
      set palette = '[1, 2, 3, 4, 5, 6, 7]' where id = image;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a palette of seven colours is accepted';

  rejected := false;
  begin
    update public.artwork_images set palette = '{"color": "#000000"}' where id = image;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a palette that is not a list is accepted';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert (select count(*) from public.artwork_images) = 0, 'B reads images of A';
  update public.artwork_images set palette = '[{"color": "#000000", "share": 1}]';
  assert not found, 'B stores a palette on an image of A';
end;
$$;

rollback;
