alter table public.artworks
  add column favourite boolean not null default false;

grant update (favourite) on public.artworks to authenticated;
