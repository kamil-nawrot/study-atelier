alter table public.review_log
  add column guessed_year integer check (guessed_year <> 0),
  add column year_miss integer check (year_miss >= 0),
  add constraint review_log_guess_facet_check check (guessed_year is null or facet = 'date'),
  add constraint review_log_miss_guess_check check (year_miss is null or guessed_year is not null);

grant insert (guessed_year, year_miss) on public.review_log to authenticated;

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
    artwork_id, facet, mode, rating, correct, answer_ms, due_before, guessed_year, year_miss
  )
  values (
    target_artwork, target_facet, given.mode, given.rating, given.correct, given.answer_ms,
    previous_due, case when target_facet = 'date' then given.guessed_year end, miss
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

create or replace function private.exhibit_values(owner uuid, time_zone text)
returns table (exhibit text, place integer, value integer, thresholds integer[])
language sql
stable
security definer
set search_path = ''
as $$
  with live as (
    select artwork.id, artwork.era_code
      from public.artworks as artwork
      where artwork.owner_id = owner and artwork.deleted_at is null
  ),
  cards as (
    select card.stability, card.lapses
      from public.review_cards as card
      join live on live.id = card.artwork_id
      where card.facet = 'recognise'
  ),
  visited as (
    select visit.place_id from public.visits as visit where visit.owner_id = owner
  )
  select exhibit.code, exhibit.place, exhibit.value::integer, exhibit.thresholds
    from (values
      ('collection', 1, (select count(*) from live), array[1, 10, 50, 100, 250, 500, 1000, 2500, 5000]),
      ('eras', 2, (select count(distinct live.era_code) from live), array[2, 3, 4, 5, 6]),
      ('memory', 3, (select count(*) from cards where cards.stability >= 7), array[1, 25, 100, 250, 500, 1000, 2500]),
      ('bullseye', 4,
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner and entry.facet = 'date' and entry.year_miss = 0),
        array[1, 5, 25, 50, 100, 250]),
      ('regular', 5,
        (select coalesce(max(event.streak_days), 0) from public.point_events as event
          where event.owner_id = owner and event.kind = 'plan_day'),
        array[3, 7, 14, 30, 60, 100, 200, 365]),
      ('back_from_storage', 6, (select count(*) from cards where cards.lapses > 0 and cards.stability >= 7),
        array[1]),
      ('chronicle', 7, (select count(distinct visited.place_id) from visited), array[1, 5, 10, 25, 50, 100]),
      ('grand_tour', 8,
        (select count(distinct place.country_code)
          from visited join public.location_details as place on place.value_id = visited.place_id),
        array[1, 2, 3, 5, 10, 20]),
      ('seen_live', 9,
        (select count(distinct seen.artwork_id) from public.visit_artworks as seen where seen.owner_id = owner),
        array[1, 10, 50, 100, 250, 500]),
      ('timeline', 10,
        (select count(*) from public.timeline_events as event where event.owner_id = owner),
        array[1, 10, 50, 100, 250]),
      ('glossary', 11,
        (select count(*) from public.glossary_entries as entry where entry.owner_id = owner),
        array[1, 10, 25, 50, 100, 250, 500]),
      ('own_eye', 12,
        (select count(*) from public.artwork_images as image
          join live on live.id = image.artwork_id
          where image.own_image_path is not null),
        array[1, 5, 25, 50, 100]),
      ('night_watch', 13,
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner
            and entry.facet = 'recognise'
            and extract(hour from entry.reviewed_at at time zone time_zone) < 4),
        array[1]),
      ('marathon', 14,
        (select coalesce(max(day.answers), 0) from public.free_review_days as day where day.owner_id = owner),
        array[1000])
    ) as exhibit (code, place, value, thresholds);
$$;
