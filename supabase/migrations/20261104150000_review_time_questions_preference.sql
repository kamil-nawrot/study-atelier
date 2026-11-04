alter table public.profiles
  add column review_time_questions boolean not null default false;

grant insert (review_time_questions) on public.profiles to authenticated;
grant update (review_time_questions) on public.profiles to authenticated;
