alter table public.profiles
  add column fetch_image boolean not null default true,
  add column fetch_definition boolean not null default true,
  add column fetch_forms boolean not null default true,
  add column fetch_event boolean not null default true;

grant insert (fetch_image, fetch_definition, fetch_forms, fetch_event)
  on public.profiles to authenticated;
grant update (fetch_image, fetch_definition, fetch_forms, fetch_event)
  on public.profiles to authenticated;
