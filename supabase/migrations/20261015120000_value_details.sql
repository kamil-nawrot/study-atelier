alter table public.category_values
  add constraint category_values_id_owner_id_category_code_key unique (id, owner_id, category_code);

create table public.era_details (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  era_code text not null references public.eras (code),
  summary text check (summary <> '' and summary = btrim(summary) and char_length(summary) <= 300),
  notes text check (notes <> ''),
  updated_at timestamptz not null default now(),
  primary key (owner_id, era_code)
);

create table public.period_details (
  value_id uuid primary key,
  owner_id uuid not null default auth.uid(),
  category_code text not null default 'period' check (category_code = 'period'),
  summary text check (summary <> '' and summary = btrim(summary) and char_length(summary) <= 300),
  notes text check (notes <> ''),
  updated_at timestamptz not null default now(),
  foreign key (value_id, owner_id, category_code)
    references public.category_values (id, owner_id, category_code) on delete cascade
);

create table public.style_details (
  value_id uuid primary key,
  owner_id uuid not null default auth.uid(),
  category_code text not null default 'style' check (category_code = 'style'),
  summary text check (summary <> '' and summary = btrim(summary) and char_length(summary) <= 300),
  notes text check (notes <> ''),
  updated_at timestamptz not null default now(),
  foreign key (value_id, owner_id, category_code)
    references public.category_values (id, owner_id, category_code) on delete cascade
);

create table public.material_details (
  value_id uuid primary key,
  owner_id uuid not null default auth.uid(),
  category_code text not null default 'material' check (category_code = 'material'),
  summary text check (summary <> '' and summary = btrim(summary) and char_length(summary) <= 300),
  notes text check (notes <> ''),
  updated_at timestamptz not null default now(),
  foreign key (value_id, owner_id, category_code)
    references public.category_values (id, owner_id, category_code) on delete cascade
);

create table public.author_details (
  value_id uuid primary key,
  owner_id uuid not null default auth.uid(),
  category_code text not null default 'author' check (category_code = 'author'),
  summary text check (summary <> '' and summary = btrim(summary) and char_length(summary) <= 300),
  notes text check (notes <> ''),
  birth_year integer check (birth_year <> 0),
  death_year integer check (death_year <> 0),
  years_approximate boolean not null default false,
  sort_name text check (sort_name <> '' and sort_name = btrim(sort_name)),
  source_wikidata_id text check (source_wikidata_id ~ '^Q[1-9][0-9]*$'),
  source_image_file text,
  source_image_licence text,
  source_image_licence_url text,
  source_image_attribution text,
  own_image_path text,
  own_image_url text check (own_image_url ~ '^https://'),
  own_image_source_url text,
  image_width integer check (image_width > 0),
  image_height integer check (image_height > 0),
  updated_at timestamptz not null default now(),
  foreign key (value_id, owner_id, category_code)
    references public.category_values (id, owner_id, category_code) on delete cascade,
  check (birth_year is null or death_year is null or birth_year <= death_year),
  check (birth_year is not null or death_year is not null or not years_approximate),
  check (source_image_file is null or source_wikidata_id is not null),
  check (own_image_path is null or own_image_url is null),
  check (own_image_path is null or split_part(own_image_path, '/', 1) = owner_id::text),
  check ((image_width is null) = (image_height is null))
);

create table public.location_details (
  value_id uuid primary key,
  owner_id uuid not null default auth.uid(),
  category_code text not null default 'location' check (category_code = 'location'),
  summary text check (summary <> '' and summary = btrim(summary) and char_length(summary) <= 300),
  notes text check (notes <> ''),
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  place_type text check (place_type in ('museum', 'private_collection', 'on_site')),
  updated_at timestamptz not null default now(),
  foreign key (value_id, owner_id, category_code)
    references public.category_values (id, owner_id, category_code) on delete cascade
);

create trigger era_details_set_updated_at
  before update on public.era_details
  for each row execute function private.set_updated_at();

create trigger period_details_set_updated_at
  before update on public.period_details
  for each row execute function private.set_updated_at();

create trigger style_details_set_updated_at
  before update on public.style_details
  for each row execute function private.set_updated_at();

create trigger material_details_set_updated_at
  before update on public.material_details
  for each row execute function private.set_updated_at();

create trigger author_details_set_updated_at
  before update on public.author_details
  for each row execute function private.set_updated_at();

create trigger location_details_set_updated_at
  before update on public.location_details
  for each row execute function private.set_updated_at();

alter table public.era_details enable row level security;
alter table public.period_details enable row level security;
alter table public.style_details enable row level security;
alter table public.material_details enable row level security;
alter table public.author_details enable row level security;
alter table public.location_details enable row level security;

create policy "Owners manage their era details"
  on public.era_details for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their period details"
  on public.period_details for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their style details"
  on public.style_details for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their material details"
  on public.material_details for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their author details"
  on public.author_details for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their location details"
  on public.location_details for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.era_details, public.period_details, public.style_details,
  public.material_details, public.author_details, public.location_details
  from anon, authenticated;

grant select, delete on public.era_details, public.period_details, public.style_details,
  public.material_details, public.author_details, public.location_details
  to authenticated;

grant insert (era_code, summary, notes) on public.era_details to authenticated;
grant update (summary, notes) on public.era_details to authenticated;

grant insert (value_id, summary, notes) on public.period_details to authenticated;
grant update (summary, notes) on public.period_details to authenticated;

grant insert (value_id, summary, notes) on public.style_details to authenticated;
grant update (summary, notes) on public.style_details to authenticated;

grant insert (value_id, summary, notes) on public.material_details to authenticated;
grant update (summary, notes) on public.material_details to authenticated;

grant insert (
  value_id, summary, notes, birth_year, death_year, years_approximate, sort_name,
  source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
  source_image_attribution, own_image_path, own_image_url, own_image_source_url,
  image_width, image_height
) on public.author_details to authenticated;
grant update (
  summary, notes, birth_year, death_year, years_approximate, sort_name,
  source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
  source_image_attribution, own_image_path, own_image_url, own_image_source_url,
  image_width, image_height
) on public.author_details to authenticated;

grant insert (value_id, summary, notes, country_code, place_type)
  on public.location_details to authenticated;
grant update (summary, notes, country_code, place_type)
  on public.location_details to authenticated;

create function public.value_page_content(target_value uuid)
returns table (has_content boolean, own_image_path text)
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(bool_or(content.filled), false), max(content.own_image_path)
    from (
      select details.summary is not null or details.notes is not null as filled,
          null::text as own_image_path
        from public.period_details as details where details.value_id = target_value
      union all
      select details.summary is not null or details.notes is not null, null
        from public.style_details as details where details.value_id = target_value
      union all
      select details.summary is not null or details.notes is not null, null
        from public.material_details as details where details.value_id = target_value
      union all
      select details.summary is not null or details.notes is not null
          or details.birth_year is not null or details.death_year is not null
          or details.sort_name is not null or details.source_image_file is not null
          or details.own_image_path is not null or details.own_image_url is not null,
          details.own_image_path
        from public.author_details as details where details.value_id = target_value
      union all
      select details.summary is not null or details.notes is not null
          or details.country_code is not null or details.place_type is not null,
          null
        from public.location_details as details where details.value_id = target_value
    ) as content;
$$;

revoke all on function public.value_page_content(uuid) from public, anon;
grant execute on function public.value_page_content(uuid) to authenticated;
