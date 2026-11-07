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
  ),
  described as (
    select details.value_id from public.author_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select details.value_id from public.period_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select details.value_id from public.style_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select details.value_id from public.material_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select details.value_id from public.location_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
    union all
    select null from public.era_details as details
      where details.owner_id = owner and (details.summary ~ '\S' or details.notes ~ '\S')
  ),
  initials as (
    select left(regexp_replace(
        upper(regexp_replace(normalize(translate(coalesce(nullif(btrim(entry.sort_name), ''), entry.name), 'łŁ', 'lL'), NFD),
          '[\u0300-\u036f]', '', 'g')),
        '^[^A-Z0-9]+', ''), 1) as letter
      from public.glossary_entries as entry
      where entry.owner_id = owner
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
      ('vasari_lives', 9,
        (select count(*)
          from (
            select author.id
              from public.category_values as author
              join public.artwork_values as credited on credited.value_id = author.id
              join live on live.id = credited.artwork_id
              where author.owner_id = owner and author.category_code = 'author'
              group by author.id
              having count(*) >= 10
          ) as prolific),
        array[1, 3, 5, 10, 20]),
      ('memory', 10, (select count(*) from cards where cards.stability >= 7), array[1, 25, 100, 250, 500, 1000, 2500]),
      ('bullseye', 11,
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner and entry.facet = 'date' and entry.year_miss = 0),
        array[1, 5, 25, 50, 100, 250]),
      ('regular', 12,
        (select coalesce(max(event.streak_days), 0) from public.point_events as event
          where event.owner_id = owner and event.kind = 'plan_day'),
        array[3, 7, 14, 30, 60, 100, 200, 365]),
      ('back_from_storage', 13, (select count(*) from cards where cards.lapses > 0 and cards.stability >= 7),
        array[1]),
      ('chronicle', 14, (select count(distinct visited.place_id) from visited), array[1, 5, 10, 25, 50, 100]),
      ('grand_tour', 15,
        (select count(distinct place.country_code)
          from visited join public.location_details as place on place.value_id = visited.place_id),
        array[1, 2, 3, 5, 10, 20]),
      ('seen_live', 16,
        (select count(distinct seen.artwork_id) from public.visit_artworks as seen where seen.owner_id = owner),
        array[1, 10, 50, 100, 250, 500]),
      ('timeline', 17,
        (select count(*) from public.timeline_events as event where event.owner_id = owner),
        array[1, 10, 50, 100, 250]),
      ('glossary', 18,
        (select count(*) from public.glossary_entries as entry where entry.owner_id = owner),
        array[1, 10, 25, 50, 100, 250, 500]),
      ('hortus_cliffortianus', 19, (select count(*) from described), array[1, 10, 25, 50, 100, 500]),
      ('own_eye', 20,
        (select count(*) from public.artwork_images as image
          join live on live.id = image.artwork_id
          where image.own_image_path is not null),
        array[1, 5, 25, 50, 100]),
      ('night_watch', 21,
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner
            and entry.facet = 'recognise'
            and extract(hour from entry.reviewed_at at time zone time_zone) < 4),
        array[1]),
      ('marathon', 22,
        (select coalesce(max(day.answers), 0) from public.free_review_days as day where day.owner_id = owner),
        array[1000]),
      ('mouth_of_truth', 23,
        (select count(*) from public.feedback as report where report.owner_id = owner and report.kind = 'idea'),
        array[1]),
      ('pinacotheca', 24,
        (select coalesce(max(pinned.pins), 0)
          from (
            select count(*) as pins
              from public.artwork_pins as pin
              join public.artwork_images as image on image.id = pin.image_id
              join live on live.id = image.artwork_id
              group by pin.image_id
          ) as pinned),
        array[10]),
      ('trevi_fountain', 25,
        (select coalesce(max(returns.days), 0)
          from (
            select count(distinct visit.visited_on) as days
              from public.visit_artworks as seen
              join public.visits as visit on visit.id = seen.visit_id
              join live on live.id = seen.artwork_id
              where seen.owner_id = owner
              group by seen.artwork_id
          ) as returns),
        array[2]),
      ('seven_league_boots', 26,
        (select coalesce(max(journeys.places), 0)
          from (
            select count(distinct visit.place_id) as places
              from public.visits as visit
              where visit.owner_id = owner and visit.date_precision = 'day'
              group by visit.visited_on
          ) as journeys),
        array[3]),
      ('figure_alphabet', 27,
        (select count(distinct initials.letter) from initials
          where initials.letter <> '' and strpos('ABCDEFGHIJKLMNOPRSTUWYZ', initials.letter) > 0),
        array[23])
    ) as exhibit (code, place, value, thresholds);
$$;

create or replace function private.unlock_exhibits_for(owner uuid, time_zone text)
returns table (exhibit text, value integer, thresholds integer[])
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
    with current_values as (
      select * from private.exhibit_values(owner, time_zone)
    ),
    unlocked as (
      insert into public.exhibit_tiers (owner_id, exhibit, tier, tiers)
        select owner, current_values.exhibit, tier.number, cardinality(current_values.thresholds)
          from current_values,
            generate_subscripts(current_values.thresholds, 1) as tier (number)
          where current_values.thresholds[tier.number] <= current_values.value
        on conflict do nothing
    ),
    rewarded as (
      insert into public.point_events (owner_id, kind, code)
        select owner, 'easter_egg', current_values.exhibit
          from current_values
          where current_values.exhibit in ('night_watch', 'marathon', 'back_from_storage', 'mouth_of_truth', 'pinacotheca',
            'trevi_fountain', 'seven_league_boots', 'figure_alphabet')
            and current_values.thresholds[1] <= current_values.value
            and (select count(*) from public.point_events as existing where existing.owner_id = owner) < 50000
        on conflict do nothing
    )
    select current_values.exhibit, current_values.value, current_values.thresholds
      from current_values
      order by current_values.place;
end;
$$;
