create function public.flag_count()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
    from public.learner_flags as flag
    left join public.artworks as artwork on artwork.id = flag.artwork_id
    where flag.owner_id = (select auth.uid())
      and (flag.artwork_id is null or artwork.deleted_at is null);
$$;

revoke all on function public.flag_count() from public, anon;
grant execute on function public.flag_count() to authenticated;
