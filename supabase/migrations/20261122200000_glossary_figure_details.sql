alter table public.glossary_entries
  add column birth_year integer check (birth_year <> 0),
  add column death_year integer check (death_year <> 0),
  add column years_approximate boolean not null default false,
  add column country text
    check (country <> '' and country = btrim(country) and char_length(country) <= 60),
  add column source_wikidata_id text check (source_wikidata_id ~ '^Q[1-9][0-9]*$'),
  add column source_image_file text,
  add column source_image_licence text,
  add column source_image_licence_url text,
  add column source_image_attribution text,
  add column own_image_path text,
  add column own_image_url text check (own_image_url ~ '^https://'),
  add column image_width integer check (image_width > 0),
  add column image_height integer check (image_height > 0),
  add constraint glossary_entries_life_years_check
    check (birth_year is null or death_year is null or birth_year <= death_year),
  add constraint glossary_entries_years_approximate_check
    check (birth_year is not null or death_year is not null or not years_approximate),
  add constraint glossary_entries_source_image_check
    check (source_image_file is null or source_wikidata_id is not null),
  add constraint glossary_entries_one_own_image_check
    check (own_image_path is null or own_image_url is null),
  add constraint glossary_entries_own_image_owner_check
    check (own_image_path is null or split_part(own_image_path, '/', 1) = owner_id::text),
  add constraint glossary_entries_image_size_check
    check ((image_width is null) = (image_height is null));

grant insert (
  birth_year, death_year, years_approximate, country, source_wikidata_id, source_image_file,
  source_image_licence, source_image_licence_url, source_image_attribution, own_image_path,
  own_image_url, image_width, image_height
) on public.glossary_entries to authenticated;
grant update (
  birth_year, death_year, years_approximate, country, source_wikidata_id, source_image_file,
  source_image_licence, source_image_licence_url, source_image_attribution, own_image_path,
  own_image_url, image_width, image_height
) on public.glossary_entries to authenticated;

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
    select own_image_path from public.glossary_entries where own_image_path is not null
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
