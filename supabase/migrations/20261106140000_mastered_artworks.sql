create function public.mastered_artworks(artwork_ids uuid[])
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
    from public.review_cards as card
    where card.artwork_id = any (artwork_ids)
      and card.facet = 'recognise'
      and card.stability >= 7;
$$;

revoke all on function public.mastered_artworks(uuid[]) from public, anon;
grant execute on function public.mastered_artworks(uuid[]) to authenticated;
