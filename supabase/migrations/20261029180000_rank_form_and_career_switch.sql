alter table public.profiles
  add column rank_form text not null default 'masculine' check (rank_form in ('masculine', 'feminine')),
  add column career_shown boolean not null default true,
  add column rank_seen smallint not null default 0 check (rank_seen >= 0);

grant insert (rank_form, career_shown, rank_seen) on public.profiles to authenticated;
grant update (rank_form, career_shown, rank_seen) on public.profiles to authenticated;
