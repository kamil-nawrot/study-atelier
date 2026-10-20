create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name <> '' and name = btrim(name) and char_length(name) <= 120),
  year_from integer check (year_from <> 0),
  year_to integer not null check (year_to <> 0),
  year_approximate boolean not null default false,
  description text
    check (description <> '' and description = btrim(description) and char_length(description) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (year_from is null or year_from < year_to)
);

create index timeline_events_owner_year_to_idx
  on public.timeline_events (owner_id, year_to);

create trigger timeline_events_set_updated_at
  before update on public.timeline_events
  for each row execute function private.set_updated_at();

alter table public.timeline_events enable row level security;

create policy "Owners manage their timeline events"
  on public.timeline_events for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.timeline_events from anon, authenticated;

grant select, delete on public.timeline_events to authenticated;

grant insert (name, year_from, year_to, year_approximate, description)
  on public.timeline_events to authenticated;
grant update (name, year_from, year_to, year_approximate, description)
  on public.timeline_events to authenticated;
