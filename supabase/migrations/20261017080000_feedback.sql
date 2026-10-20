create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('bug', 'idea')),
  title text not null check (title <> '' and title = btrim(title) and char_length(title) <= 120),
  description text check (description <> '' and description = btrim(description) and char_length(description) <= 4000),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Owners send feedback"
  on public.feedback for insert to authenticated
  with check (owner_id = (select auth.uid()));

revoke all on public.feedback from anon, authenticated;

grant insert (kind, title, description) on public.feedback to authenticated;
