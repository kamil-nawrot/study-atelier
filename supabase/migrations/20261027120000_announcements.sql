create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text check (title <> '' and title = btrim(title) and char_length(title) <= 80),
  body text not null check (body <> '' and body = btrim(body) and char_length(body) <= 300),
  starts_at timestamptz not null default now(),
  ends_at timestamptz check (ends_at > starts_at),
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "Learners read current announcements"
  on public.announcements for select to authenticated
  using (starts_at <= now() and (ends_at is null or ends_at > now()));

revoke all on public.announcements from anon, authenticated;

grant select on public.announcements to authenticated;
