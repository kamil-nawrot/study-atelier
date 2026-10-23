create table public.profiles (
  owner_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text
    check (display_name <> '' and display_name = btrim(display_name) and char_length(display_name) <= 60),
  avatar_path text
    check (avatar_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/avatar-[0-9a-f-]{36}\.jpg$'
      and split_part(avatar_path, '/', 1) = owner_id::text),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

create policy "Owners manage their profile"
  on public.profiles for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;

grant select on public.profiles to authenticated;
grant insert (display_name, avatar_path) on public.profiles to authenticated;
grant update (display_name, avatar_path) on public.profiles to authenticated;

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
  )
  select o.name
  from storage.objects o
  where o.bucket_id = 'artwork-images'
    and o.created_at < now() - interval '24 hours'
    and not exists (select 1 from kept k where k.path = o.name)
  order by o.created_at
  limit 1000;
$$;
