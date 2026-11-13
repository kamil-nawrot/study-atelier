alter table public.profiles
  add column review_symbol_questions smallint not null default 1
    check (review_symbol_questions between 0 and 3);

grant insert (review_symbol_questions) on public.profiles to authenticated;
grant update (review_symbol_questions) on public.profiles to authenticated;
