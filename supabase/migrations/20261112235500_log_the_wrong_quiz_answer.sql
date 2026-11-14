alter table public.review_log
  add column wrong_answer text,
  add constraint review_log_wrong_answer_check
    check (wrong_answer is null or (correct is false and char_length(wrong_answer) between 1 and 500));

grant insert (wrong_answer) on public.review_log to authenticated;

create or replace function public.record_review(
  target_artwork uuid,
  card jsonb,
  answer jsonb,
  day_start timestamptz default null,
  time_zone text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  next_card public.review_cards := jsonb_populate_record(null::public.review_cards, card);
  given public.review_log := jsonb_populate_record(null::public.review_log, answer);
  target_facet text := coalesce(given.facet, 'recognise');
  previous_due timestamptz;
  counts record;
  new_per_day integer;
  done integer;
  waiting integer;
  streak integer;
  first_year integer;
  last_year integer;
  miss integer;
begin
  if target_facet = 'date' and not exists (
    select 1 from public.review_cards as known
      where known.artwork_id = target_artwork and known.facet = 'recognise'
  ) then
    raise exception using errcode = '22023', message = 'the artwork was not reviewed yet';
  end if;

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

  if target_facet = 'date' and given.guessed_year is not null then
    select coalesce(artwork.year_from, artwork.year_to), coalesce(artwork.year_to, artwork.year_from)
      into first_year, last_year
      from public.artworks as artwork
      where artwork.id = target_artwork;
    miss := case
      when given.guessed_year < first_year then
        first_year - given.guessed_year - case when given.guessed_year < 0 and first_year > 0 then 1 else 0 end
      when given.guessed_year > last_year then
        given.guessed_year - last_year - case when last_year < 0 and given.guessed_year > 0 then 1 else 0 end
      when first_year is not null then 0
    end;
  end if;

  insert into public.review_log (
    artwork_id, facet, mode, rating, correct, answer_ms, due_before, guessed_year, year_miss,
    wrong_answer
  )
  values (
    target_artwork, target_facet, given.mode, given.rating, given.correct, given.answer_ms,
    previous_due, case when target_facet = 'date' then given.guessed_year end, miss,
    case when given.correct is false then nullif(left(btrim(given.wrong_answer), 500), '') end
  );

  if day_start is null or time_zone is null then
    return;
  end if;

  if target_facet = 'date' then
    if given.rating >= 2 then
      perform public.record_right_answer(day_start);
    end if;
    return;
  end if;

  select * into counts from public.review_counts(day_start);
  select coalesce((select profile.review_new_per_day from public.profiles as profile), 10) into new_per_day;
  select count(distinct entry.artwork_id) into done
    from public.review_log as entry
    where entry.facet = 'recognise'
      and entry.reviewed_at >= day_start and entry.reviewed_at < day_start + interval '1 day';
  waiting := case
    when counts.with_image < 20 then 0
    else counts.due + least(counts.new_available, greatest(0, new_per_day - counts.new_today))
  end;

  select event.streak_days into streak
    from public.point_events as event
    where event.kind = 'plan_day' and event.day_start = record_review.day_start;

  insert into public.point_events (kind, day_start, plan_share, streak_days)
  values (
    'plan_day', day_start, coalesce(done::real / nullif(done + waiting, 0), 0),
    coalesce(streak, public.review_streak(day_start, time_zone))
  )
  on conflict (owner_id, day_start) where kind = 'plan_day' do update
    set plan_share = excluded.plan_share,
      streak_days = excluded.streak_days,
      occurred_at = now();
end;
$$;
