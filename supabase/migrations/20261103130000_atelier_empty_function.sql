create function public.atelier_empty()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select not exists (select 1 from public.artworks)
    and not exists (select 1 from public.category_values)
    and not exists (select 1 from public.glossary_entries)
    and not exists (select 1 from public.timeline_events)
    and not exists (select 1 from public.artwork_fields)
    and not exists (select 1 from public.visits);
$$;

revoke all on function public.atelier_empty() from public, anon;
grant execute on function public.atelier_empty() to authenticated;
