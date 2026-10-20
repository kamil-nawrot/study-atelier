create function public.review_streak(day_start timestamptz, time_zone text)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  with today as (
    select (day_start at time zone time_zone)::date as day
  ),
  days as (
    select distinct (entry.reviewed_at at time zone time_zone)::date as day
      from public.review_log as entry
  ),
  numbered as (
    select days.day, days.day - (row_number() over (order by days.day))::integer as run
      from days
  ),
  anchor as (
    select max(days.day) as day
      from days, today
      where days.day in (today.day, today.day - 1)
  ),
  target as (
    select numbered.run
      from numbered
      join anchor on numbered.day = anchor.day
  )
  select coalesce(
    (select count(*)::integer from numbered where numbered.run in (select target.run from target)),
    0
  );
$$;

revoke all on function public.review_streak(timestamptz, text) from public, anon;
grant execute on function public.review_streak(timestamptz, text) to authenticated;
