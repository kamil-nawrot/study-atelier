create function public.search_key(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(
    replace(
      regexp_replace(
        normalize(lower(value), nfd),
        '[̀-ͯ᪰-᫿᷀-᷿⃐-⃿︠-︯]', '', 'g'
      ),
      'ł', 'l'
    ),
    '\s+', ' ', 'g'
  ));
$$;

revoke all on function public.search_key(text) from public, anon;
grant execute on function public.search_key(text) to authenticated;

create index artworks_title_key_idx
  on public.artworks (owner_id, public.search_key(title))
  where deleted_at is null;

create function public.duplicate_candidates(title text)
returns table (id uuid, record_number integer, title text, authors text[])
language sql
stable
security invoker
set search_path = ''
as $$
  select artwork.id, artwork.record_number, artwork.title,
    coalesce(
      (select array_agg(value.name order by value.name)
        from public.artwork_values as link
        join public.category_values as value on value.id = link.value_id
        where link.artwork_id = artwork.id and value.category_code = 'author'),
      '{}'
    )
    from public.artworks as artwork
    where artwork.owner_id = (select auth.uid())
      and artwork.deleted_at is null
      and public.search_key(artwork.title) = public.search_key(duplicate_candidates.title)
    order by artwork.record_number;
$$;

revoke all on function public.duplicate_candidates(text) from public, anon;
grant execute on function public.duplicate_candidates(text) to authenticated;

create function public.used_category_values()
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
    order by value.category_code, value.name, value.id;
$$;

revoke all on function public.used_category_values() from public, anon;
grant execute on function public.used_category_values() to authenticated;
