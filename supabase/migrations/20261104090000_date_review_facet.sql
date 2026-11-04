alter table public.review_cards
  drop constraint review_cards_facet_check,
  add constraint review_cards_facet_check check (facet in ('recognise', 'date'));

alter table public.review_log
  drop constraint review_log_facet_check,
  drop constraint review_log_mode_check,
  add constraint review_log_facet_check check (facet in ('recognise', 'date')),
  add constraint review_log_mode_check
    check (mode in ('flashcard', 'quiz_image', 'quiz_title', 'quiz_author', 'quiz_style', 'quiz_pin', 'year')),
  add constraint review_log_year_check check ((facet = 'date') = (mode = 'year'));

alter table public.point_events
  add column answers integer check (answers between 1 and 50),
  drop constraint point_events_kind_check,
  drop constraint point_events_item_check,
  add constraint point_events_kind_check check (kind in (
    'plan_day', 'settled', 'artwork_added', 'definition_added', 'event_added', 'visit_added', 'easter_egg',
    'right_answers'
  )),
  add constraint point_events_item_check
    check ((kind in ('plan_day', 'easter_egg', 'right_answers')) = (item_id is null)),
  add constraint point_events_right_answers_check
    check ((kind = 'right_answers') = (answers is not null and day_start is not null));

create unique index point_events_answers_idx on public.point_events (owner_id, day_start)
  where kind = 'right_answers';

grant insert (answers) on public.point_events to authenticated;
grant update (answers) on public.point_events to authenticated;

create or replace function public.learner_points()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(round(sum(
    case event.kind
      when 'plan_day' then
        10 * event.plan_share * (1 + 0.05 * least(greatest(event.streak_days - 1, 0), 10))
      when 'settled' then 20
      when 'easter_egg' then 50
      when 'right_answers' then event.answers
      else 2
    end
  )), 0)::integer
    from public.point_events as event;
$$;

create function public.record_right_answer(day_start timestamptz)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.point_events as event (kind, day_start, answers)
  values ('right_answers', record_right_answer.day_start, 1)
  on conflict (owner_id, day_start) where kind = 'right_answers' do update
    set answers = least(event.answers + 1, 50),
      occurred_at = now();
$$;

revoke all on function public.record_right_answer(timestamptz) from public, anon;
grant execute on function public.record_right_answer(timestamptz) to authenticated;

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

  insert into public.review_log (artwork_id, facet, mode, rating, correct, answer_ms, due_before)
  values (
    target_artwork, target_facet, given.mode, given.rating, given.correct, given.answer_ms,
    previous_due
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

create or replace function public.review_counts(day_start timestamptz)
returns table (due integer, new_available integer, new_today integer, with_image integer)
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
    (select count(*)::integer from live);
$$;

create or replace function private.point_event_on_settled()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.facet = 'recognise' and new.stability >= 7 and coalesce(current_setting('study_atelier.importing', true), '') <> 'on' then
    perform private.add_point_event(new.owner_id, 'settled', new.artwork_id, coalesce(new.last_review, now()));
  end if;
  return null;
end;
$$;

create or replace function private.fill_point_events(owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.point_events (owner_id, kind, item_id, occurred_at)
    select owner, 'artwork_added', artwork.id, artwork.created_at
      from public.artworks as artwork where artwork.owner_id = owner
    union all
    select owner, 'definition_added', entry.id, entry.created_at
      from public.glossary_entries as entry where entry.owner_id = owner
    union all
    select owner, 'event_added', event.id, event.created_at
      from public.timeline_events as event where event.owner_id = owner
    union all
    select owner, 'visit_added', visit.id, visit.created_at
      from public.visits as visit where visit.owner_id = owner
    union all
    select owner, 'settled', card.artwork_id, coalesce(card.last_review, card.created_at)
      from public.review_cards as card where card.owner_id = owner and card.facet = 'recognise' and card.stability >= 7
    on conflict do nothing;

  insert into public.point_events (owner_id, kind, day_start, plan_share, streak_days, occurred_at)
    with days as (
      select distinct (entry.reviewed_at at time zone 'Europe/Warsaw')::date as day
        from public.review_log as entry where entry.owner_id = owner and entry.facet = 'recognise'
    ),
    runs as (
      select day, day - (row_number() over (order by day))::integer as run from days
    )
    select owner, 'plan_day', day::timestamp at time zone 'Europe/Warsaw', 1,
        row_number() over (partition by run order by day),
        (day + 1)::timestamp at time zone 'Europe/Warsaw'
      from runs
    on conflict do nothing;
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
    from public.review_log as entry
    where entry.facet = 'recognise';
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
              where card.facet = 'recognise'
                and card.created_at < bounds.day_end
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
      ('regular', 4,
        (select coalesce(max(event.streak_days), 0) from public.point_events as event
          where event.owner_id = owner and event.kind = 'plan_day'),
        array[3, 7, 14, 30, 60, 100, 200, 365]),
      ('back_from_storage', 5, (select count(*) from cards where cards.lapses > 0 and cards.stability >= 7),
        array[1]),
      ('chronicle', 6, (select count(distinct visited.place_id) from visited), array[1, 5, 10, 25, 50, 100]),
      ('grand_tour', 7,
        (select count(distinct place.country_code)
          from visited join public.location_details as place on place.value_id = visited.place_id),
        array[1, 2, 3, 5, 10, 20]),
      ('seen_live', 8,
        (select count(distinct seen.artwork_id) from public.visit_artworks as seen where seen.owner_id = owner),
        array[1, 10, 50, 100, 250, 500]),
      ('timeline', 9,
        (select count(*) from public.timeline_events as event where event.owner_id = owner),
        array[1, 10, 50, 100, 250]),
      ('glossary', 10,
        (select count(*) from public.glossary_entries as entry where entry.owner_id = owner),
        array[1, 10, 25, 50, 100, 250, 500]),
      ('own_eye', 11,
        (select count(*) from public.artwork_images as image
          join live on live.id = image.artwork_id
          where image.own_image_path is not null),
        array[1, 5, 25, 50, 100]),
      ('night_watch', 12,
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner
            and entry.facet = 'recognise'
            and extract(hour from entry.reviewed_at at time zone time_zone) < 4),
        array[1]),
      ('marathon', 13,
        (select coalesce(max(day.answers), 0) from public.free_review_days as day where day.owner_id = owner),
        array[1000])
    ) as exhibit (code, place, value, thresholds);
$$;

create or replace function public.collection_statistics()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with
    live as (
      select artwork.id, artwork.record_number,
        (artwork.created_at at time zone 'Europe/Warsaw')::date as added_on
      from public.artworks as artwork
      where artwork.deleted_at is null
    ),
    today as (
      select (now() at time zone 'Europe/Warsaw')::date as day
    ),
    span as (
      select min(live.added_on) as first_day,
        case
          when today.day - min(live.added_on) < 30 then 'day'
          when date_trunc('week', today.day) - date_trunc('week', min(live.added_on)) < interval '26 weeks' then 'week'
          else 'month'
        end as unit
      from live, today
      group by today.day
    ),
    buckets as (
      select bucket::date as start
      from span, today,
        generate_series(
          date_trunc(span.unit, span.first_day::timestamp),
          date_trunc(span.unit, today.day::timestamp),
          ('1 ' || span.unit)::interval
        ) as bucket
    ),
    added as (
      select date_trunc(span.unit, live.added_on::timestamp)::date as start, count(*) as added
      from live, span
      group by 1
    ),
    growth as (
      select buckets.start, coalesce(added.added, 0) as added
      from buckets
      left join added on added.start = buckets.start
    ),
    answers as (
      select count(*) filter (where entry.correct is not null) as quiz_answers,
        count(*) filter (where entry.correct) as correct_answers
      from public.review_log as entry
      join live on live.id = entry.artwork_id
      where entry.facet = 'recognise'
    ),
    reviewed as (
      select entry.artwork_id, count(*) as times, live.record_number
      from public.review_log as entry
      join live on live.id = entry.artwork_id
      where entry.facet = 'recognise'
      group by entry.artwork_id, live.record_number
      having count(*) >= 3
      order by count(*) desc, live.record_number
      limit 5
    ),
    authors as (
      select author.id, author.name, details.birth_year, details.death_year, details.years_approximate,
        details.death_year - details.birth_year
          - case when details.birth_year < 0 and details.death_year > 0 then 1 else 0 end as lifespan,
        count(distinct live.id) as artworks,
        coalesce(details.sort_name, author.name) as sort_key
      from public.category_values as author
      join public.author_details as details on details.value_id = author.id
      join public.artwork_values as link on link.value_id = author.id
      join live on live.id = link.artwork_id
      where author.category_code = 'author'
        and details.birth_year is not null
        and details.death_year is not null
      group by author.id, details.value_id
    ),
    longest_lived as (
      select authors.*, count(*) over (partition by authors.lifespan) - 1 as tied
      from authors
      order by authors.lifespan desc, authors.artworks desc, authors.sort_key
      limit 1
    ),
    pinned as (
      select live.id, live.record_number, count(*) as pins
      from public.artwork_pins as pin
      join public.artwork_images as image on image.id = pin.image_id
      join live on live.id = image.artwork_id
      group by live.id, live.record_number
    ),
    most_pinned as (
      select pinned.*, count(*) over (partition by pinned.pins) - 1 as tied
      from pinned
      order by pinned.pins desc, pinned.record_number
      limit 1
    ),
    visit_sizes as (
      select visit.id, place.name as place, visit.visited_on, visit.date_precision,
        count(*) as artworks
      from public.visits as visit
      join public.category_values as place on place.id = visit.place_id
      join public.visit_artworks as seen on seen.visit_id = visit.id
      join live on live.id = seen.artwork_id
      group by visit.id, place.name
    ),
    largest_visit as (
      select visit_sizes.*, count(*) over (partition by visit_sizes.artworks) - 1 as tied
      from visit_sizes
      order by visit_sizes.artworks desc, visit_sizes.visited_on, visit_sizes.id
      limit 1
    )
  select jsonb_build_object(
    'terms', (select count(*) from public.glossary_entries),
    'events', (select count(*) from public.timeline_events),
    'visits', (select count(*) from public.visits),
    'quiz_answers', (select quiz_answers from answers),
    'correct_answers', (select correct_answers from answers),
    'most_reviewed', coalesce(
      (select jsonb_agg(jsonb_build_object('artwork_id', artwork_id, 'times', times)
        order by times desc, record_number) from reviewed),
      '[]'::jsonb
    ),
    'growth', (
      select jsonb_build_object(
        'unit', span.unit,
        'first_day', span.first_day,
        'buckets', (select jsonb_agg(jsonb_build_object('start', start, 'added', added) order by start) from growth)
      )
      from span
    ),
    'authors_with_years', (select count(*) from authors),
    'longest_lived', (
      select jsonb_build_object('value_id', id, 'name', name, 'birth_year', birth_year,
        'death_year', death_year, 'years_approximate', years_approximate, 'tied', tied)
      from longest_lived
    ),
    'most_pinned', (
      select jsonb_build_object('artwork_id', id, 'pins', pins, 'tied', tied) from most_pinned
    ),
    'largest_visit', (
      select jsonb_build_object('visit_id', id, 'place', place, 'visited_on', visited_on,
        'date_precision', date_precision, 'artworks', artworks, 'tied', tied)
      from largest_visit
    )
  );
$$;
