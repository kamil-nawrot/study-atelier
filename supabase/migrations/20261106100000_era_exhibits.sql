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
      ('prehistory', 3, (select count(*) from live where live.era_code = 'prehistory'), array[1, 10, 25, 50, 100, 250]),
      ('antiquity', 4, (select count(*) from live where live.era_code = 'antiquity'), array[1, 10, 25, 50, 100, 250]),
      ('middle_ages', 5, (select count(*) from live where live.era_code = 'middle_ages'), array[1, 10, 25, 50, 100, 250]),
      ('early_modern', 6, (select count(*) from live where live.era_code = 'early_modern'), array[1, 10, 25, 50, 100, 250]),
      ('modern', 7, (select count(*) from live where live.era_code = 'modern'), array[1, 10, 25, 50, 100, 250]),
      ('contemporary', 8, (select count(*) from live where live.era_code = 'contemporary'), array[1, 10, 25, 50, 100, 250]),
      ('memory', 9, (select count(*) from cards where cards.stability >= 7), array[1, 25, 100, 250, 500, 1000, 2500]),
      ('bullseye', 10,
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner and entry.facet = 'date' and entry.year_miss = 0),
        array[1, 5, 25, 50, 100, 250]),
      ('regular', 11,
        (select coalesce(max(event.streak_days), 0) from public.point_events as event
          where event.owner_id = owner and event.kind = 'plan_day'),
        array[3, 7, 14, 30, 60, 100, 200, 365]),
      ('back_from_storage', 12, (select count(*) from cards where cards.lapses > 0 and cards.stability >= 7),
        array[1]),
      ('chronicle', 13, (select count(distinct visited.place_id) from visited), array[1, 5, 10, 25, 50, 100]),
      ('grand_tour', 14,
        (select count(distinct place.country_code)
          from visited join public.location_details as place on place.value_id = visited.place_id),
        array[1, 2, 3, 5, 10, 20]),
      ('seen_live', 15,
        (select count(distinct seen.artwork_id) from public.visit_artworks as seen where seen.owner_id = owner),
        array[1, 10, 50, 100, 250, 500]),
      ('timeline', 16,
        (select count(*) from public.timeline_events as event where event.owner_id = owner),
        array[1, 10, 50, 100, 250]),
      ('glossary', 17,
        (select count(*) from public.glossary_entries as entry where entry.owner_id = owner),
        array[1, 10, 25, 50, 100, 250, 500]),
      ('own_eye', 18,
        (select count(*) from public.artwork_images as image
          join live on live.id = image.artwork_id
          where image.own_image_path is not null),
        array[1, 5, 25, 50, 100]),
      ('night_watch', 19,
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner
            and entry.facet = 'recognise'
            and extract(hour from entry.reviewed_at at time zone time_zone) < 4),
        array[1]),
      ('marathon', 20,
        (select coalesce(max(day.answers), 0) from public.free_review_days as day where day.owner_id = owner),
        array[1000]),
      ('mouth_of_truth', 21,
        (select count(*) from public.feedback as report where report.owner_id = owner and report.kind = 'idea'),
        array[1])
    ) as exhibit (code, place, value, thresholds);
$$;
