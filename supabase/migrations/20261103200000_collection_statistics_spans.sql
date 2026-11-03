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
    ),
    reviewed as (
      select entry.artwork_id, count(*) as times, live.record_number
      from public.review_log as entry
      join live on live.id = entry.artwork_id
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

revoke all on function public.collection_statistics() from public, anon;
grant execute on function public.collection_statistics() to authenticated;
