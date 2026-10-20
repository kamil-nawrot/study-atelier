create function public.unused_images()
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  with used as (
    select own_image_path as path from public.artworks where own_image_path is not null
    union all
    select own_image_path from public.artwork_images where own_image_path is not null
    union all
    select own_image_path from public.author_details where own_image_path is not null
  ),
  kept as (
    select path from used
    union
    select regexp_replace(path, '\.[^./]*$', '') || '-thumb.jpg' from used
  )
  select o.name
  from storage.objects o
  where o.bucket_id = 'artwork-images'
    and o.created_at < now() - interval '24 hours'
    and not exists (select 1 from kept k where k.path = o.name)
  order by o.created_at
  limit 1000;
$$;

revoke all on function public.unused_images() from public, anon, authenticated;
grant execute on function public.unused_images() to service_role;
