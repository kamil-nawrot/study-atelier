alter table public.profiles
  add column review_glossary_on boolean not null default true;

grant insert (review_glossary_on) on public.profiles to authenticated;
grant update (review_glossary_on) on public.profiles to authenticated;
