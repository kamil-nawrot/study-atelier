drop function if exists public.review_counts(timestamptz);

create function public.review_counts(day_start timestamptz)
returns table (due integer, new_available integer, new_today integer, with_image integer, style_waiting integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with live as (
    select artwork.id
      from public.artworks as artwork
      where artwork.deleted_at is null
        and exists (
            select 1 from public.artwork_images as image
            where image.artwork_id = artwork.id and image.position = 0
          )
  )
  select
    (select count(*)::integer
      from public.review_cards as card
      join live on live.id = card.artwork_id
      where card.facet = 'recognise' and card.due < day_start + interval '1 day'),
    (select count(*)::integer
      from live
      where not exists (select 1 from public.review_cards as card where card.artwork_id = live.id)),
    (select count(*)::integer
      from public.review_cards as card
      where card.facet = 'recognise' and card.created_at >= day_start),
    (select count(*)::integer from live),
    (select count(*)::integer
      from live
      join public.review_cards as known on known.artwork_id = live.id and known.facet = 'recognise'
      left join public.review_cards as style on style.artwork_id = live.id and style.facet = 'style'
      where (style.artwork_id is null or style.due < day_start + interval '1 day')
        and exists (
            select 1
              from public.artwork_values as link
              join public.category_values as value on value.id = link.value_id
              where link.artwork_id = live.id and value.category_code = 'style'
          ));
$$;

revoke all on function public.review_counts(timestamptz) from public, anon;
grant execute on function public.review_counts(timestamptz) to authenticated;
