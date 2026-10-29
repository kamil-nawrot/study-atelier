alter table public.review_log add column due_before timestamptz;

grant insert (due_before) on public.review_log to authenticated;

create index review_log_artwork_id_reviewed_at_idx on public.review_log (artwork_id, reviewed_at);
drop index public.review_log_artwork_id_idx;

create or replace function public.record_review(
  target_artwork uuid,
  card jsonb,
  answer jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_card public.review_cards := jsonb_populate_record(null::public.review_cards, card);
  given public.review_log := jsonb_populate_record(null::public.review_log, answer);
  target_facet text := coalesce(given.facet, 'recognise');
  previous_due timestamptz;
begin
  select existing.due into previous_due
    from public.review_cards as existing
    where existing.artwork_id = target_artwork and existing.facet = target_facet;

  insert into public.review_cards (
    artwork_id, facet, due, stability, difficulty, state, reps, lapses, scheduled_days,
    learning_steps, last_review
  )
  values (
    target_artwork, target_facet, next_card.due, next_card.stability, next_card.difficulty,
    next_card.state, next_card.reps, next_card.lapses, next_card.scheduled_days,
    next_card.learning_steps, next_card.last_review
  )
  on conflict (artwork_id, facet) do update
    set due = excluded.due,
      stability = excluded.stability,
      difficulty = excluded.difficulty,
      state = excluded.state,
      reps = excluded.reps,
      lapses = excluded.lapses,
      scheduled_days = excluded.scheduled_days,
      learning_steps = excluded.learning_steps,
      last_review = excluded.last_review;

  insert into public.review_log (artwork_id, facet, mode, rating, correct, answer_ms, due_before)
  values (
    target_artwork, target_facet, given.mode, given.rating, given.correct, given.answer_ms,
    previous_due
  );
end;
$$;

create or replace function public.review_streak(day_start timestamptz, time_zone text)
returns integer
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  today date := (day_start at time zone time_zone)::date;
  review_days date[];
  first_day date;
  day date := today - 1;
  streak integer := 0;
  nothing_waited boolean;
begin
  select array_agg(distinct (entry.reviewed_at at time zone time_zone)::date)
    into review_days
    from public.review_log as entry;
  if review_days is null then
    return 0;
  end if;

  select min(reviewed) into first_day from unnest(review_days) as reviewed;
  if today = any(review_days) then
    streak := 1;
  end if;

  while day >= first_day loop
    if day = any(review_days) then
      streak := streak + 1;
    else
      with bounds as (
        select ((day + 1)::timestamp at time zone time_zone) as day_end
      ),
      live as (
        select artwork.id
          from public.artworks as artwork, bounds
          where artwork.created_at < bounds.day_end
            and (artwork.deleted_at is null or artwork.deleted_at >= bounds.day_end)
            and exists (
                select 1 from public.artwork_images as image
                where image.artwork_id = artwork.id and image.position = 0
              )
      )
      select (select count(*) from live) < 20
        or (
          not exists (
            select 1
              from live, bounds
              where not exists (
                  select 1 from public.review_cards as card
                  where card.artwork_id = live.id and card.created_at < bounds.day_end
                )
          )
          and not exists (
            select 1
              from public.review_cards as card
              join live on live.id = card.artwork_id
              cross join bounds
              left join lateral (
                select entry.id, entry.due_before
                  from public.review_log as entry
                  where entry.artwork_id = card.artwork_id
                    and entry.facet = card.facet
                    and entry.reviewed_at >= bounds.day_end
                  order by entry.reviewed_at
                  limit 1
              ) as next_entry on true
              where card.created_at < bounds.day_end
                and case
                  when next_entry.id is null then card.due < bounds.day_end
                  else next_entry.due_before is null or next_entry.due_before < bounds.day_end
                end
          )
        )
      into nothing_waited;
      if not nothing_waited then
        exit;
      end if;
    end if;
    day := day - 1;
  end loop;

  return streak;
end;
$$;
