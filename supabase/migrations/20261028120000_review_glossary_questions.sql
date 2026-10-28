alter table public.profiles
  add column review_glossary_questions smallint not null default 1
    check (review_glossary_questions in (1, 2, 3));

grant insert (review_glossary_questions) on public.profiles to authenticated;
grant update (review_glossary_questions) on public.profiles to authenticated;
