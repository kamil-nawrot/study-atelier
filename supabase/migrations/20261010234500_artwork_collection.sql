create schema if not exists private;

revoke all on schema private from public;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.artwork_types (
  code text primary key,
  position smallint not null unique
);

insert into public.artwork_types (code, position) values
  ('architecture', 1),
  ('painting', 2),
  ('sculpture', 3),
  ('drawing', 4),
  ('printmaking', 5),
  ('applied_arts', 6),
  ('photography', 7),
  ('other', 8);

create table public.categories (
  code text primary key,
  multiple boolean not null,
  position smallint not null unique
);

insert into public.categories (code, multiple, position) values
  ('author', true, 1),
  ('period', true, 2),
  ('style', true, 3),
  ('material', true, 4),
  ('location', false, 5);

create table private.record_counters (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  last_record_number integer not null
);

create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  record_number integer not null,
  title text not null check (btrim(title) <> ''),
  author_unknown boolean not null default false,
  year integer check (year <> 0),
  year_approximate boolean not null default false,
  type_code text references public.artwork_types (code),
  notes text,
  source_wikidata_id text check (source_wikidata_id ~ '^Q[1-9][0-9]*$'),
  source_image_file text,
  source_image_licence text,
  source_image_licence_url text,
  source_image_attribution text,
  own_image_path text,
  own_image_url text check (own_image_url ~ '^https://'),
  own_image_source_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, record_number),
  unique (id, owner_id),
  check (year is not null or not year_approximate),
  check (source_image_file is null or source_wikidata_id is not null),
  check (own_image_path is null or own_image_url is null),
  check (own_image_path is null or split_part(own_image_path, '/', 1) = owner_id::text)
);

create table public.category_values (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_code text not null references public.categories (code),
  name text not null check (name <> '' and name = btrim(name)),
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create unique index category_values_name_key
  on public.category_values (owner_id, category_code, lower(name));

create table public.artwork_values (
  artwork_id uuid not null,
  value_id uuid not null,
  owner_id uuid not null default auth.uid(),
  position smallint not null default 0,
  primary key (artwork_id, value_id),
  foreign key (artwork_id, owner_id) references public.artworks (id, owner_id) on delete cascade,
  foreign key (value_id, owner_id) references public.category_values (id, owner_id) on delete cascade
);

create index artwork_values_value_id_idx on public.artwork_values (value_id);

create function private.assign_record_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.record_counters as counter (owner_id, last_record_number)
  values (new.owner_id, 1)
  on conflict (owner_id)
    do update set last_record_number = counter.last_record_number + 1
  returning counter.last_record_number into new.record_number;
  return new;
end;
$$;

create trigger artworks_assign_record_number
  before insert on public.artworks
  for each row execute function private.assign_record_number();

create trigger artworks_set_updated_at
  before update on public.artworks
  for each row execute function private.set_updated_at();

create function private.check_artwork_value()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  value_category text;
  allows_multiple boolean;
begin
  select value.category_code, category.multiple
    into value_category, allows_multiple
    from public.category_values as value
    join public.categories as category on category.code = value.category_code
    where value.id = new.value_id;

  if not allows_multiple and exists (
    select 1
      from public.artwork_values as existing
      join public.category_values as existing_value on existing_value.id = existing.value_id
      where existing.artwork_id = new.artwork_id
        and existing_value.category_code = value_category
        and existing.value_id <> new.value_id
  ) then
    raise exception 'category % allows only one value per artwork', value_category
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger artwork_values_check
  before insert on public.artwork_values
  for each row execute function private.check_artwork_value();

revoke all on function private.set_updated_at() from public;
revoke all on function private.assign_record_number() from public;
revoke all on function private.check_artwork_value() from public;

alter table public.artwork_types enable row level security;
alter table public.categories enable row level security;
alter table private.record_counters enable row level security;
alter table public.artworks enable row level security;
alter table public.category_values enable row level security;
alter table public.artwork_values enable row level security;

create policy "Signed-in users read artwork types"
  on public.artwork_types for select to authenticated
  using (true);

create policy "Signed-in users read categories"
  on public.categories for select to authenticated
  using (true);

create policy "Owners manage their artworks"
  on public.artworks for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their category values"
  on public.category_values for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their artwork values"
  on public.artwork_values for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.artwork_types, public.categories, public.artworks,
  public.category_values, public.artwork_values from anon, authenticated;
revoke all on private.record_counters from anon, authenticated;

grant select on public.artwork_types, public.categories to authenticated;

grant select, delete on public.artworks to authenticated;
grant insert (
  id, title, author_unknown, year, year_approximate, type_code, notes,
  source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
  source_image_attribution, own_image_path, own_image_url, own_image_source_url
) on public.artworks to authenticated;
grant update (
  title, author_unknown, year, year_approximate, type_code, notes,
  source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
  source_image_attribution, own_image_path, own_image_url, own_image_source_url, deleted_at
) on public.artworks to authenticated;

grant select, delete on public.category_values to authenticated;
grant insert (id, category_code, name) on public.category_values to authenticated;
grant update (name) on public.category_values to authenticated;

grant select, delete on public.artwork_values to authenticated;
grant insert (artwork_id, value_id, position) on public.artwork_values to authenticated;
grant update (position) on public.artwork_values to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artwork-images',
  'artwork-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
);

create policy "Owners read their artwork images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners upload their artwork images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners replace their artwork images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners delete their artwork images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
