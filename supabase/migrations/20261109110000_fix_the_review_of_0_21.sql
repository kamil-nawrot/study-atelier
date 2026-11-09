create or replace function private.validate_exhibition_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  children constant jsonb := private.exhibition_children();
  attributes constant jsonb := private.exhibition_attributes();
  node jsonb;
  node_type text;
  child jsonb;
  artwork_ids text[];
begin
  if jsonb_typeof(new.document) is distinct from 'object' or new.document ->> 'type' is distinct from 'doc' then
    raise exception 'the document of an exhibition is a doc node'
      using errcode = 'check_violation', hint = 'exhibition_document';
  end if;

  for node in
    select value from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && exists(@.type))') as value
  loop
    node_type := node ->> 'type';
    if jsonb_typeof(node -> 'type') <> 'string' or not children ? node_type then
      raise exception 'an exhibition has no node of this kind'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if exists (
      select 1 from jsonb_object_keys(node) as key where key not in ('type', 'attrs', 'content', 'text', 'marks')
    ) then
      raise exception 'an exhibition node has a key it does not know'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node ? 'attrs' and (
      jsonb_typeof(node -> 'attrs') <> 'object'
      or exists (
        select 1 from jsonb_object_keys(node -> 'attrs') as key
          where not (attributes -> node_type) ? key
      )
    ) then
      raise exception 'an exhibition node has an attribute it does not know'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node ? 'content' then
      if jsonb_typeof(node -> 'content') <> 'array' then
        raise exception 'the content of an exhibition node is a list'
          using errcode = 'check_violation', hint = 'exhibition_document';
      end if;
      for child in select value from jsonb_array_elements(node -> 'content') loop
        if jsonb_typeof(child) <> 'object' or not coalesce((children -> node_type) ? (child ->> 'type'), false) then
          raise exception 'an exhibition node holds a node it may not hold'
            using errcode = 'check_violation', hint = 'exhibition_document';
        end if;
      end loop;
    end if;
    if node ? 'attrs' and (
      (node -> 'attrs' ? 'align' and node -> 'attrs' ->> 'align' not in ('left', 'center', 'right'))
      or (node -> 'attrs' ? 'valign' and node -> 'attrs' ->> 'valign' not in ('top', 'middle', 'bottom'))
    ) then
      raise exception 'a block of an exhibition stands left, centre or right and top, middle or bottom'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'text' and jsonb_typeof(node -> 'text') is distinct from 'string' then
      raise exception 'a text node of an exhibition has no text'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'heading' and coalesce(node -> 'attrs' ->> 'level', '') not in ('2', '3') then
      raise exception 'a heading of an exhibition is of level 2, or 3 inside a text'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'artwork' then
      if coalesce(node -> 'attrs' ->> 'artworkId', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or coalesce(node -> 'attrs' ->> 'imageId', '00000000-0000-0000-0000-000000000000')
          !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then
        raise exception 'an artwork block of an exhibition needs the id of an artwork'
          using errcode = 'check_violation', hint = 'exhibition_document';
      end if;
    end if;
    if node_type = 'closeUp' then
      if coalesce(node -> 'attrs' ->> 'artworkId', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or coalesce(node -> 'attrs' ->> 'imageId', '00000000-0000-0000-0000-000000000000')
          !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or jsonb_typeof(node -> 'attrs' -> 'x') is distinct from 'number'
        or jsonb_typeof(node -> 'attrs' -> 'y') is distinct from 'number'
        or jsonb_typeof(node -> 'attrs' -> 'viewWidth') is distinct from 'number'
        or (node -> 'attrs' ->> 'x')::numeric not between 0 and 1
        or (node -> 'attrs' ->> 'y')::numeric not between 0 and 1
        or (node -> 'attrs' ->> 'viewWidth')::numeric not between 0.001 and 1
      then
        raise exception 'a close-up of an exhibition needs an artwork and a fragment of its image'
          using errcode = 'check_violation', hint = 'exhibition_document';
      end if;
    end if;
    if node_type = 'set' and (
      jsonb_typeof(node -> 'content') is distinct from 'array'
      or jsonb_array_length(node -> 'content') not between 2 and 5
      or (select count(distinct value ->> 'type') from jsonb_array_elements(node -> 'content') as value) <> 1
      or exists (
        select 1 from jsonb_array_elements(node -> 'content') as value
          where value ->> 'type' = 'artwork' and value -> 'attrs' -> 'paletteOnly' is distinct from 'true'::jsonb
      )
    ) then
      raise exception 'a set of an exhibition holds two to five details or two to five palettes'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'term' and (
      node ? 'content'
      or coalesce(node -> 'attrs' ->> 'termId', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ) then
      raise exception 'a term block of an exhibition needs the id of a glossary entry'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'divider' and (
      node ? 'content'
      or (node -> 'attrs' ? 'line' and jsonb_typeof(node -> 'attrs' -> 'line') <> 'boolean')
    ) then
      raise exception 'a divider of an exhibition holds nothing and has a line or none'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'columns' and (
      jsonb_typeof(node -> 'content') is distinct from 'array'
      or jsonb_array_length(node -> 'content') not between 2 and 3
    ) then
      raise exception 'a row of an exhibition holds two or three columns'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'column' and (
      jsonb_typeof(node -> 'content') is distinct from 'array'
      or jsonb_array_length(node -> 'content') <> 1
    ) then
      raise exception 'a column of an exhibition holds one block'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
  end loop;

  if (
    select count(*)
      from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && @.type == "heading")') as value
      where value -> 'attrs' ->> 'level' = '3'
  ) <> (
    select count(*)
      from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && @.type == "textBlock").content[*] ? (@.type == "heading")') as value
  ) or exists (
    select 1
      from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && @.type == "textBlock").content[*] ? (@.type == "heading")') as value
      where value -> 'attrs' ->> 'level' is distinct from '3'
  ) then
    raise exception 'a heading inside a text of an exhibition is of level 3 and only there'
      using errcode = 'check_violation', hint = 'exhibition_document';
  end if;

  if (
    select count(*)
      from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && exists(@.type))') as value
      where value ->> 'type' in ('textBlock', 'heading', 'quote', 'artwork', 'closeUp', 'divider', 'term')
  ) - (
    select count(*)
      from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && @.type == "textBlock").content[*] ? (@.type == "heading")') as value
  ) > 300 then
    raise exception 'an exhibition holds at most 300 blocks'
      using errcode = 'configuration_limit_exceeded', hint = 'exhibition_blocks';
  end if;

  select array_agg(distinct (value #>> '{}')) into artwork_ids
    from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && exists(@.artworkId)).artworkId') as value;
  if coalesce(array_length(artwork_ids, 1), 0) > 100 then
    raise exception 'an exhibition holds at most 100 artworks'
      using errcode = 'configuration_limit_exceeded', hint = 'exhibition_artworks';
  end if;

  return new;
end;
$$;


create or replace function private.sync_exhibition_artworks(target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.exhibitions;
  wanted uuid[];
begin
  select * into saved from public.exhibitions where id = target_id;

  if saved.id is null then
    delete from public.exhibition_artworks where exhibition_id = target_id;
    return;
  end if;

  wanted := array(
    select found.artwork_id
      from (
        select (mention.value #>> '{}')::uuid as artwork_id, min(mention.ordinality) as first_seen
          from jsonb_path_query(saved.document, 'strict $.** ? (@.type() == "object" && exists(@.artworkId)).artworkId')
            with ordinality as mention(value, ordinality)
          group by 1
      ) as found
      join public.artworks as artwork
        on artwork.id = found.artwork_id and artwork.owner_id = saved.owner_id
      order by found.first_seen
  );

  if wanted = array(
    select placed.artwork_id from public.exhibition_artworks as placed
      where placed.exhibition_id = target_id
      order by placed.position
  ) then
    return;
  end if;

  delete from public.exhibition_artworks where exhibition_id = target_id;
  insert into public.exhibition_artworks (exhibition_id, artwork_id, owner_id, position)
    select saved.id, listed.artwork_id, saved.owner_id, (listed.ordinality - 1)::smallint
      from unnest(wanted) with ordinality as listed(artwork_id, ordinality);
end;
$$;

drop function public.record_night_light();

create function public.record_night_light(time_zone text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  local_hour integer := extract(hour from now() at time zone time_zone);
begin
  if local_hour between 6 and 21 then
    return false;
  end if;
  insert into public.profiles as profile (night_light_at)
  values (now())
  on conflict (owner_id) do update
    set night_light_at = coalesce(profile.night_light_at, excluded.night_light_at);
  return true;
end;
$$;

revoke all on function public.record_night_light(text) from public, anon;
grant execute on function public.record_night_light(text) to authenticated;

create or replace function private.exhibit_values(owner uuid, time_zone text)
returns table (exhibit text, value integer)
language sql
stable
security definer
set search_path = ''
as $$
  with live as (
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
      ('back_from_storage', (select count(*) from cards where cards.lapses > 0 and cards.stability >= 7)),
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
      ('hortus_cliffortianus', (select count(*) from described)),
      ('own_eye',
        (select count(*) from public.artwork_images as image
          join live on live.id = image.artwork_id
          where image.own_image_path is not null)),
      ('crystal_palace', (select count(*) from exhibited)),
      ('lenoir_chapel', (select coalesce(max(storied.eras), 0) from storied)),
      ('night_watch',
        (select count(*) from public.review_log as entry
          where entry.owner_id = owner
            and entry.facet = 'recognise'
            and extract(hour from entry.reviewed_at at time zone time_zone) < 4)),
      ('marathon',
        (select coalesce(max(day.answers), 0) from public.free_review_days as day where day.owner_id = owner)),
      ('mouth_of_truth',
        (select count(*) from public.feedback as report where report.owner_id = owner and report.kind = 'idea')),
      ('pinacotheca',
        (select coalesce(max(pinned.pins), 0)
          from (
            select count(*) as pins
              from public.artwork_pins as pin
              join public.artwork_images as image on image.id = pin.image_id
              join live on live.id = image.artwork_id
              group by pin.image_id
          ) as pinned)),
      ('trevi_fountain',
        (select coalesce(max(returns.days), 0)
          from (
            select count(distinct (visit.visited_on, visit.date_precision)) as days
              from public.visit_artworks as seen
              join public.visits as visit on visit.id = seen.visit_id
              join live on live.id = seen.artwork_id
              where seen.owner_id = owner
              group by seen.artwork_id
          ) as returns)),
      ('seven_league_boots',
        (select coalesce(max(journeys.places), 0)
          from (
            select count(distinct visit.place_id) as places
              from public.visits as visit
              where visit.owner_id = owner and visit.date_precision = 'day'
              group by visit.visited_on
          ) as journeys)),
      ('figure_alphabet',
        (select count(distinct initials.letter) from initials
          where initials.letter <> '' and strpos('ABCDEFGHIJKLMNOPRSTUWYZ', initials.letter) > 0)),
      ('candle_moths',
        (select count(*) from public.profiles as profile
          where profile.owner_id = owner
            and (extract(hour from profile.night_light_at at time zone time_zone) >= 22
              or extract(hour from profile.night_light_at at time zone time_zone) < 6))),
      ('amateur_magnifier',
        (select count(*) from public.profiles as profile
          where profile.owner_id = owner and profile.long_look_at is not null))
    ) as exhibit (code, value);
$$;
