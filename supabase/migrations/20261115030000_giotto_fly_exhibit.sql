alter table public.profiles add column giotto_fly_at timestamptz;

grant insert (giotto_fly_at) on public.profiles to authenticated;
grant update (giotto_fly_at) on public.profiles to authenticated;

create function public.record_giotto_fly()
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.profiles as profile (giotto_fly_at)
  values (now())
  on conflict (owner_id) do update
    set giotto_fly_at = coalesce(profile.giotto_fly_at, excluded.giotto_fly_at);
$$;

revoke all on function public.record_giotto_fly() from public, anon;
grant execute on function public.record_giotto_fly() to authenticated;

insert into public.exhibits (code, room_code, position, thresholds, hidden)
  select 'giotto_fly', 'crypt', max(exhibit.position) + 1, array[1], true
    from public.exhibits as exhibit
    where exhibit.room_code = 'crypt';

create or replace function private.exhibit_values(owner uuid, time_zone text)
returns table (exhibit text, value integer)
language sql
stable
security definer
set search_path = ''
as $$
  with found as (
    select tier.exhibit, catalogue.thresholds[1] as threshold
      from public.exhibit_tiers as tier
      join public.exhibits as catalogue on catalogue.code = tier.exhibit
      where tier.owner_id = owner and tier.tier = 1 and catalogue.hidden
  ),
  live as (
    select artwork.id, artwork.era_code, artwork.type_code
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
  exhibited as (
    select exhibition.id
      from public.exhibitions as exhibition
      join public.exhibition_artworks as placed on placed.exhibition_id = exhibition.id
      join live on live.id = placed.artwork_id
      where exhibition.owner_id = owner and exhibition.deleted_at is null
      group by exhibition.id
      having count(*) >= 5
  ),
  storied as (
    select count(distinct live.era_code) as eras
      from public.exhibitions as exhibition
      join public.exhibition_artworks as placed on placed.exhibition_id = exhibition.id
      join live on live.id = placed.artwork_id
      where exhibition.owner_id = owner and exhibition.deleted_at is null
      group by exhibition.id
  ),
  placed as (
    select exhibition.id as exhibition_id, node
      from public.exhibitions as exhibition
      cross join lateral jsonb_array_elements(coalesce(exhibition.document -> 'content', '[]')) as top (node)
      where exhibition.owner_id = owner and exhibition.deleted_at is null and top.node ->> 'type' <> 'columns'
    union all
    select exhibition.id, inner_block.node
      from public.exhibitions as exhibition
      cross join lateral jsonb_array_elements(coalesce(exhibition.document -> 'content', '[]')) as top (node)
      cross join lateral jsonb_array_elements(coalesce(top.node -> 'content', '[]')) as column_node (node)
      cross join lateral jsonb_array_elements(coalesce(column_node.node -> 'content', '[]')) as inner_block (node)
      where exhibition.owner_id = owner and exhibition.deleted_at is null and top.node ->> 'type' = 'columns'
  ),
  blocks as (
    select placed.exhibition_id, placed.node from placed where placed.node ->> 'type' <> 'set'
    union all
    select placed.exhibition_id, item.node
      from placed
      cross join lateral jsonb_array_elements(coalesce(placed.node -> 'content', '[]')) as item (node)
      where placed.node ->> 'type' = 'set'
  ),
  block_kinds as (
    select distinct blocks.exhibition_id,
        case
          when blocks.node ->> 'type' = 'artwork' and blocks.node -> 'attrs' -> 'paletteOnly' = 'true'::jsonb
            then 'palette'
          else blocks.node ->> 'type'
        end as kind
      from blocks
      left join live as shown
        on blocks.node ->> 'type' in ('artwork', 'closeUp')
        and shown.id::text = blocks.node -> 'attrs' ->> 'artworkId'
      left join public.glossary_entries as entry
        on blocks.node ->> 'type' = 'term'
        and entry.owner_id = owner and entry.id::text = blocks.node -> 'attrs' ->> 'termId'
      left join public.symbols as symbol
        on blocks.node ->> 'type' = 'symbol'
        and symbol.owner_id = owner and symbol.id::text = blocks.node -> 'attrs' ->> 'symbolId'
      where case blocks.node ->> 'type'
        when 'textBlock' then jsonb_path_exists(blocks.node, 'lax $.**.text ? (@ like_regex "\\S")')
        when 'heading' then jsonb_path_exists(blocks.node, 'lax $.**.text ? (@ like_regex "\\S")')
        when 'quote' then jsonb_path_exists(blocks.node, 'lax $.**.text ? (@ like_regex "\\S")')
        when 'artwork' then shown.id is not null
        when 'closeUp' then shown.id is not null
        when 'term' then entry.id is not null
        when 'symbol' then symbol.id is not null
        else true
      end
  ),
  every_kind as (
    select kind.value as kind
      from jsonb_array_elements_text(private.exhibition_children() -> 'doc') as kind (value)
      where kind.value not in ('set', 'columns')
    union
    select 'palette'
  ),
  shown_meanings as (
    select distinct image.artwork_id, pin.symbol_id,
        lower(btrim(regexp_replace(meaning.text, '\s+', ' ', 'g'))) as meaning
      from public.artwork_pins as pin
      join public.artwork_images as image on image.id = pin.image_id
      join live on live.id = image.artwork_id
      join public.symbol_meanings as meaning on meaning.symbol_id = pin.symbol_id
      where pin.symbol_id is not null
        and (pin.symbol_meaning_id = meaning.id
          or (pin.symbol_meaning_id is null
            and not exists (
              select 1 from public.symbol_meanings as other
                where other.symbol_id = pin.symbol_id and other.id <> meaning.id)))
  ),
  initials as (
    select left(regexp_replace(
        upper(regexp_replace(normalize(translate(coalesce(nullif(btrim(entry.sort_name), ''), entry.name), 'łŁ', 'lL'), NFD),
          '[\u0300-\u036f]', '', 'g')),
        '^[^A-Z0-9]+', ''), 1) as letter
      from public.glossary_entries as entry
      where entry.owner_id = owner
  )
  select exhibit.code, exhibit.value::integer
    from (values
      ('collection', (select count(*) from live)),
      ('eras', (select count(distinct live.era_code) from live)),
      ('prehistory', (select count(*) from live where live.era_code = 'prehistory')),
      ('antiquity', (select count(*) from live where live.era_code = 'antiquity')),
      ('middle_ages', (select count(*) from live where live.era_code = 'middle_ages')),
      ('early_modern', (select count(*) from live where live.era_code = 'early_modern')),
      ('modern', (select count(*) from live where live.era_code = 'modern')),
      ('contemporary', (select count(*) from live where live.era_code = 'contemporary')),
      ('boncompagni_academy',
        (select count(distinct live.type_code) from live where live.type_code <> 'other')),
      ('vault_cobweb',
        (select count(*)
          from public.artwork_relations as relation
          join live as source on source.id = relation.from_id
          join live as target on target.id = relation.to_id
          where relation.owner_id = owner)
        + (select count(*) from public.author_relations as relation where relation.owner_id = owner)),
      ('van_eyck_easel', coalesce((select found.threshold from found where found.exhibit = 'van_eyck_easel'),
        (select count(*)
          from (
            select 1
              from public.author_relations as taught
              join public.author_relations as passed_on
                on passed_on.owner_id = taught.owner_id and passed_on.to_id = taught.from_id
              where taught.owner_id = owner and taught.kind = 'pupil' and passed_on.kind = 'pupil'
                and passed_on.from_id <> taught.to_id
              limit 1
          ) as chain))),
      ('vasari_lives',
        (select count(*)
          from (
            select author.id
              from public.category_values as author
              join public.artwork_values as credited on credited.value_id = author.id
              join live on live.id = credited.artwork_id
              where author.owner_id = owner and author.category_code = 'author'
              group by author.id
              having count(*) >= 10
          ) as prolific)),
      ('memory', (select count(*) from cards where cards.stability >= 7)),
      ('bullseye',
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner and entry.facet = 'date' and entry.year_miss = 0)),
      ('regular',
        (select coalesce(max(event.streak_days), 0) from public.point_events as event
          where event.owner_id = owner and event.kind = 'plan_day')),
      ('back_from_storage', coalesce((select found.threshold from found where found.exhibit = 'back_from_storage'),
        (select count(*) from cards where cards.lapses > 0 and cards.stability >= 7))),
      ('chronicle', (select count(distinct visited.place_id) from visited)),
      ('grand_tour',
        (select count(distinct place.country_code)
          from visited join public.location_details as place on place.value_id = visited.place_id)),
      ('seen_live',
        (select count(distinct seen.artwork_id) from public.visit_artworks as seen where seen.owner_id = owner)),
      ('timeline',
        (select count(*) from public.timeline_events as event where event.owner_id = owner)),
      ('glossary',
        (select count(*) from public.glossary_entries as entry where entry.owner_id = owner)),
      ('laurel_skull',
        (select count(distinct pin.symbol_id)
          from public.artwork_pins as pin
          join public.artwork_images as image on image.id = pin.image_id
          join live on live.id = image.artwork_id
          where pin.symbol_id is not null)),
      ('hortus_cliffortianus', (select count(*) from described)),
      ('own_eye',
        (select count(*) from public.artwork_images as image
          join live on live.id = image.artwork_id
          where image.own_image_path is not null)),
      ('crystal_palace', (select count(*) from exhibited)),
      ('lenoir_chapel', coalesce((select found.threshold from found where found.exhibit = 'lenoir_chapel'),
        (select coalesce(max(storied.eras), 0) from storied))),
      ('kircher_ark', coalesce((select found.threshold from found where found.exhibit = 'kircher_ark'),
        (select count(*)
          from (
            select block_kinds.exhibition_id
              from block_kinds
              join every_kind on every_kind.kind = block_kinds.kind
              group by block_kinds.exhibition_id
              having count(*) = (select count(*) from every_kind)
          ) as complete))),
      ('night_watch', coalesce((select found.threshold from found where found.exhibit = 'night_watch'),
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner
            and entry.facet = 'recognise'
            and extract(hour from entry.reviewed_at at time zone time_zone) < 4))),
      ('marathon', coalesce((select found.threshold from found where found.exhibit = 'marathon'),
        (select coalesce(max(day.answers), 0) from public.free_review_days as day where day.owner_id = owner))),
      ('mouth_of_truth', coalesce((select found.threshold from found where found.exhibit = 'mouth_of_truth'),
        (select count(*) from public.feedback as report where report.owner_id = owner and report.kind = 'idea'))),
      ('pinacotheca', coalesce((select found.threshold from found where found.exhibit = 'pinacotheca'),
        (select coalesce(max(pinned.pins), 0)
          from (
            select count(*) as pins
              from public.artwork_pins as pin
              join public.artwork_images as image on image.id = pin.image_id
              join live on live.id = image.artwork_id
              group by pin.image_id
          ) as pinned))),
      ('trevi_fountain', coalesce((select found.threshold from found where found.exhibit = 'trevi_fountain'),
        (select coalesce(max(case when returns.latest_start - returns.earliest_end >= 30 then 2 else 1 end), 0)
          from (
            select max(visit.visited_on) as latest_start,
                min(case
                  when visit.ends_on is not null then visit.ends_on
                  when visit.date_precision = 'month' then (visit.visited_on + interval '1 month')::date - 1
                  when visit.date_precision = 'year' then (visit.visited_on + interval '1 year')::date - 1
                  else visit.visited_on
                end) as earliest_end
              from public.visit_artworks as seen
              join public.visits as visit on visit.id = seen.visit_id
              join live on live.id = seen.artwork_id
              where seen.owner_id = owner
              group by seen.artwork_id
          ) as returns))),
      ('pilgrim_shell', coalesce((select found.threshold from found where found.exhibit = 'pilgrim_shell'),
        (select count(*) from public.point_events as event where event.owner_id = owner and event.kind = 'wish_seen'))),
      ('seven_league_boots', coalesce((select found.threshold from found where found.exhibit = 'seven_league_boots'),
        (select coalesce(max(journeys.places), 0)
          from (
            select count(distinct visit.place_id) as places
              from public.visits as visit
              where visit.owner_id = owner and visit.kind = 'visit' and visit.date_precision = 'day'
              group by visit.visited_on
          ) as journeys))),
      ('pelican_serpent', coalesce((select found.threshold from found where found.exhibit = 'pelican_serpent'),
        (select count(*)
          from (
            select 1
              from shown_meanings as first_shown
              join shown_meanings as second_shown
                on second_shown.meaning = first_shown.meaning
                and second_shown.symbol_id <> first_shown.symbol_id
                and second_shown.artwork_id <> first_shown.artwork_id
              limit 1
          ) as pair))),
      ('figure_alphabet', coalesce((select found.threshold from found where found.exhibit = 'figure_alphabet'),
        (select count(distinct initials.letter) from initials
          where initials.letter <> '' and strpos('ABCDEFGHIJKLMNOPRSTUWYZ', initials.letter) > 0))),
      ('candle_moths', coalesce((select found.threshold from found where found.exhibit = 'candle_moths'),
        (select count(*) from public.profiles as profile
          where profile.owner_id = owner
            and (extract(hour from profile.night_light_at at time zone time_zone) >= 22
              or extract(hour from profile.night_light_at at time zone time_zone) < 6)))),
      ('amateur_magnifier', coalesce((select found.threshold from found where found.exhibit = 'amateur_magnifier'),
        (select count(*) from public.profiles as profile
          where profile.owner_id = owner and profile.long_look_at is not null))),
      ('giotto_fly', coalesce((select found.threshold from found where found.exhibit = 'giotto_fly'),
        (select count(*) from public.profiles as profile
          where profile.owner_id = owner and profile.giotto_fly_at is not null)))
    ) as exhibit (code, value);
$$;
