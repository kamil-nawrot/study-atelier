create function public.career_standing(time_zone text, unlock boolean)
returns table (points integer, new_tiers integer, rank_seen integer)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if unlock then
    perform public.unlock_exhibits(time_zone);
  end if;
  return query select
    public.learner_points(),
    (select count(*)::integer from public.exhibit_tiers as tier where tier.seen_at is null),
    coalesce((select profile.rank_seen from public.profiles as profile), 0)::integer;
end;
$$;

revoke all on function public.career_standing(text, boolean) from public, anon;
grant execute on function public.career_standing(text, boolean) to authenticated;
