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
            and extract(hour from entry.reviewed_at at time zone time_zone) < 4),
        array[1]),
      ('marathon', 13,
        (select coalesce(max(day.answers), 0) from public.free_review_days as day where day.owner_id = owner),
        array[1000])
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
      insert into public.exhibit_tiers (owner_id, exhibit, tier)
        select owner, current_values.exhibit, tier.number
          from current_values,
            generate_subscripts(current_values.thresholds, 1) as tier (number)
          where current_values.thresholds[tier.number] <= current_values.value
        on conflict do nothing
    ),
    rewarded as (
      insert into public.point_events (owner_id, kind, code)
        select owner, 'easter_egg', current_values.exhibit
          from current_values
          where current_values.exhibit in ('night_watch', 'marathon', 'back_from_storage')
            and current_values.thresholds[1] <= current_values.value
            and (select count(*) from public.point_events as existing where existing.owner_id = owner) < 50000
        on conflict do nothing
    )
    select current_values.exhibit, current_values.value, current_values.thresholds
      from current_values
      order by current_values.place;
end;
$$;

delete from public.exhibit_tiers where exhibit = 'back_from_storage' and tier > 1;

do $$
declare
  account record;
begin
  for account in select id from auth.users loop
    perform private.unlock_exhibits_for(account.id, 'Europe/Warsaw');
  end loop;
end;
$$;
