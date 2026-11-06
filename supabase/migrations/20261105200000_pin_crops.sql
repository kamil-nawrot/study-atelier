alter table public.artwork_pins
  add column crop_path text check (crop_path is null or view_width is not null);

create function private.forget_stale_pin_crop()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.view_width is null
    or (new.crop_path is not distinct from old.crop_path
      and (new.x, new.y, new.view_width, new.image_id)
        is distinct from (old.x, old.y, old.view_width, old.image_id)) then
    new.crop_path := null;
  end if;
  return new;
end;
$$;

revoke all on function private.forget_stale_pin_crop() from public, anon, authenticated;

create trigger artwork_pins_forget_stale_crop
  before update on public.artwork_pins
  for each row execute function private.forget_stale_pin_crop();

grant update (crop_path) on public.artwork_pins to authenticated;

create or replace function public.unused_images()
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  with used as (
    select own_image_path as path from public.artwork_images where own_image_path is not null
    union all
    select own_image_path from public.author_details where own_image_path is not null
    union all
    select avatar_path from public.profiles where avatar_path is not null
  ),
  kept as (
    select path from used
    union
    select regexp_replace(path, '\.[^./]*$', '') || '-thumb.jpg' from used
    union
    select crop_path from public.artwork_pins where crop_path is not null
  )
  select o.name
  from storage.objects o
  where o.bucket_id = 'artwork-images'
    and o.created_at < now() - interval '24 hours'
    and not exists (select 1 from kept k where k.path = o.name)
  order by o.created_at
  limit 1000;
$$;
