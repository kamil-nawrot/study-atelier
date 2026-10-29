create or replace function public.used_category_values()
returns table (category_code text, name text)
language sql
stable
security invoker
set search_path = ''
as $$
  select value.category_code, value.name
    from public.category_values as value
    where exists (
        select 1 from public.artwork_values as link
          join public.artworks as artwork on artwork.id = link.artwork_id
          where link.value_id = value.id and artwork.deleted_at is null
      )
      or exists (select 1 from public.visits as visit where visit.place_id = value.id)
      or not exists (select 1 from public.artwork_values as link where link.value_id = value.id)
    order by value.category_code, value.name, value.id;
$$;
