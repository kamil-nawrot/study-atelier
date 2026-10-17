create table public.glossary_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name <> '' and name = btrim(name) and char_length(name) <= 120),
  category text not null
    check (category in ('person', 'architecture', 'painting', 'sculpture', 'technique', 'general')),
  definition text check (definition <> '' and definition = btrim(definition) and char_length(definition) <= 4000),
  forms text[] not null default '{}'
    check (array_position(forms, null) is null and cardinality(forms) <= 50 and '' <> all (forms)),
  source_title text check (source_title <> ''),
  source_url text check (source_url ~ '^https://'),
  source_licence text check (source_licence <> ''),
  source_fetched_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_title is null) = (source_url is null)
    and (source_title is null) = (source_licence is null)
    and (source_title is null) = (source_fetched_on is null)
  )
);

create unique index glossary_entries_name_key
  on public.glossary_entries (owner_id, lower(name));

create trigger glossary_entries_set_updated_at
  before update on public.glossary_entries
  for each row execute function private.set_updated_at();

alter table public.glossary_entries enable row level security;

create policy "Owners manage their glossary entries"
  on public.glossary_entries for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.glossary_entries from anon, authenticated;

grant select, delete on public.glossary_entries to authenticated;

grant insert (
  name, category, definition, forms,
  source_title, source_url, source_licence, source_fetched_on
) on public.glossary_entries to authenticated;
grant update (
  name, category, definition, forms,
  source_title, source_url, source_licence, source_fetched_on
) on public.glossary_entries to authenticated;
