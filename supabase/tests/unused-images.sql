\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  author uuid;
  trashed uuid;
  refused boolean := false;
begin
  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}',
    '{}', null,
    '[{"own_image_path": "00000000-0000-0000-0000-00000000000a/main.png", "image_width": 4, "image_height": 3},
      {"own_image_path": "00000000-0000-0000-0000-00000000000a/plan.jpg", "image_width": 3, "image_height": 4}]');

  select id into trashed from public.save_artwork(
    '{"title": "Erechtheion", "author_unknown": true}',
    '{}', null,
    '[{"own_image_path": "00000000-0000-0000-0000-00000000000a/trashed.jpg", "image_width": 4, "image_height": 3}]');
  update public.artworks set deleted_at = now() where id = trashed;

  insert into public.category_values (category_code, name) values ('author', 'Phidias') returning id into author;
  insert into public.author_details (value_id, own_image_path)
    values (author, '00000000-0000-0000-0000-00000000000a/portrait.webp');

  insert into public.profiles (avatar_path)
    values ('00000000-0000-0000-0000-00000000000a/avatar-11111111-1111-1111-1111-111111111111.jpg');

  begin
    perform public.unused_images();
  exception
    when insufficient_privilege then refused := true;
  end;
  assert refused, 'a signed-in learner can list the unused images';

  refused := false;
  begin
    perform public.deleted_account_images();
  exception
    when insufficient_privilege then refused := true;
  end;
  assert refused, 'a signed-in learner can list the files of deleted accounts';
end;
$$;

reset role;

insert into storage.objects (bucket_id, name, created_at) values
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/main.png', now() - interval '3 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/main-thumb.jpg', now() - interval '3 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/plan.jpg', now() - interval '3 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/plan-thumb.jpg', now() - interval '3 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/trashed.jpg', now() - interval '3 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/portrait.webp', now() - interval '3 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/portrait-thumb.jpg', now() - interval '3 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/avatar-11111111-1111-1111-1111-111111111111.jpg', now() - interval '3 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/avatar-22222222-2222-2222-2222-222222222222.jpg', now() - interval '3 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/left.jpg', now() - interval '2 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/left-thumb.jpg', now() - interval '2 days'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/fresh.jpg', now() - interval '1 hour'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000d/gone.jpg', now() - interval '1 hour');

set local role service_role;

do $$
begin
  assert (select array_agg(path order by path) from public.unused_images() as unused (path)) =
    '{00000000-0000-0000-0000-00000000000a/avatar-22222222-2222-2222-2222-222222222222.jpg,00000000-0000-0000-0000-00000000000a/left-thumb.jpg,00000000-0000-0000-0000-00000000000a/left.jpg}',
    'unused_images does not list exactly the unused files older than a day, or lists the avatar in use';
  assert (select array_agg(path) from public.deleted_account_images() as deleted (path)) =
    '{00000000-0000-0000-0000-00000000000d/gone.jpg}',
    'deleted_account_images does not list exactly the files of accounts that no longer exist';
end;
$$;

rollback;
