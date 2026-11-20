alter table public.artwork_fields
  add column closed boolean not null default false,
  add constraint artwork_fields_closed_check check (kind = 'list' or not closed);

grant insert (closed), update (closed) on public.artwork_fields to authenticated;
