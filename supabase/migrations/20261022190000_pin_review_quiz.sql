alter table public.review_log drop constraint review_log_mode_check;
alter table public.review_log add constraint review_log_mode_check
  check (mode in ('flashcard', 'quiz_image', 'quiz_title', 'quiz_style', 'quiz_pin'));

create or replace function public.review_session(
  day_start timestamptz,
  session_form text default 'mixed',
  scope_kind text default 'all',
  scope_value text default null,
  free_round integer default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  session_size constant integer := 20;
  new_per_day constant integer := 10;
  min_artworks constant integer := 20;
  settled_stability constant double precision := 7;
  style_quiz_every constant integer := 3;
  review_state constant integer := 2;
  forgotten_state constant integer := 3;
  facts jsonb;
  picked jsonb;
  remaining jsonb;
  entry jsonb;
  previous_era text;
  chosen integer;
  slot integer := 0;
  modes text[];
  candidate text;
  quiz jsonb;
  pin_place jsonb;
  pin_image uuid;
  pin_term uuid;
  items jsonb := '[]';
begin
  if session_form is null or session_form not in ('mixed', 'flashcards', 'quizzes') then
    raise exception using errcode = '22023', message = 'unknown review form';
  end if;
  if scope_kind is null or scope_kind not in ('all', 'era', 'period', 'style')
    or (scope_kind <> 'all' and scope_value is null) then
    raise exception using errcode = '22023', message = 'unknown review scope';
  end if;
  if free_round < 0 then
    raise exception using errcode = '22023', message = 'unknown free round';
  end if;

  select coalesce(jsonb_agg(to_jsonb(fact)), '[]')
    into facts
    from (
      select
        artwork.id,
        artwork.record_number as number,
        artwork.title,
        lower(btrim(artwork.title)) as title_key,
        artwork.era_code as era,
        artwork.type_code as type,
        coalesce(artwork.year_to, artwork.year_from) as year,
        array(
          select value.name
            from public.artwork_values as link
            join public.category_values as value on value.id = link.value_id
            where link.artwork_id = artwork.id and value.category_code = 'author'
            order by link.position
        ) as authors,
        array(
          select value.name
            from public.artwork_values as link
            join public.category_values as value on value.id = link.value_id
            where link.artwork_id = artwork.id and value.category_code = 'style'
            order by link.position
        ) as styles,
        (
          select value.name
            from public.artwork_values as link
            join public.category_values as value on value.id = link.value_id
            where link.artwork_id = artwork.id and value.category_code = 'period'
            order by link.position
            limit 1
        ) as period,
        (
          select value.name
            from public.artwork_values as link
            join public.category_values as value on value.id = link.value_id
            where link.artwork_id = artwork.id and value.category_code = 'location'
            order by link.position
            limit 1
        ) as place
      from public.artworks as artwork
      where artwork.deleted_at is null
        and exists (
            select 1 from public.artwork_images as image
            where image.artwork_id = artwork.id and image.position = 0
          )
    ) as fact
    where scope_kind = 'all'
      or (scope_kind = 'era' and fact.era = scope_value)
      or (scope_kind = 'period' and fact.period = scope_value)
      or (scope_kind = 'style' and scope_value = any (fact.styles));

  if jsonb_array_length(facts) < min_artworks then
    return items;
  end if;

  if free_round is not null then
    with pool as (
      select * from jsonb_to_recordset(facts) as fact (id uuid, number integer, era text)
    ),
    known as (
      select pool.id, pool.era,
          case when (
            select log.rating
              from public.review_log as log
              where log.artwork_id = pool.id and log.facet = 'recognise'
              order by log.reviewed_at desc, log.id desc
              limit 1
          ) = 1 then forgotten_state else card.state end as state,
          card.stability,
          random() as draw
        from pool
        join public.review_cards as card on card.artwork_id = pool.id and card.facet = 'recognise'
    ),
    drawn as (
      select known.* from known order by known.draw limit session_size
    )
    select coalesce(jsonb_agg(
        jsonb_build_object('id', id, 'era', era, 'state', state, 'stability', stability)
        order by draw
      ), '[]')
      into picked
      from drawn;
  else
    with pool as (
      select * from jsonb_to_recordset(facts) as fact (id uuid, number integer, era text)
    ),
    due_cards as (
      select pool.id, pool.era,
          case when (
            select log.rating
              from public.review_log as log
              where log.artwork_id = pool.id and log.facet = 'recognise'
              order by log.reviewed_at desc, log.id desc
              limit 1
          ) = 1 then forgotten_state else card.state end as state,
          card.stability, card.due as due_at
        from pool
        join public.review_cards as card on card.artwork_id = pool.id and card.facet = 'recognise'
        where card.due < day_start + interval '1 day'
        order by card.due, pool.number
        limit session_size
    ),
    fresh as (
      select pool.id, pool.era, random() as draw
        from pool
        where not exists (
          select 1 from public.review_cards as card
            where card.artwork_id = pool.id and card.facet = 'recognise'
        )
        order by draw
        limit greatest(0, least(
          new_per_day - (
            select count(*) from public.review_cards as card where card.created_at >= day_start
          ),
          session_size - (select count(*) from due_cards)
        ))
    )
    select coalesce(jsonb_agg(chosen_entry order by rank), '[]')
      into picked
      from (
        select jsonb_build_object('id', id, 'era', era, 'state', state, 'stability', stability)
            as chosen_entry,
          row_number() over (order by due_at, id) as rank
          from due_cards
        union all
        select jsonb_build_object('id', id, 'era', era, 'state', null, 'stability', null),
          session_size + row_number() over (order by draw)
          from fresh
      ) as entries;
  end if;

  remaining := picked;
  while jsonb_array_length(remaining) > 0 loop
    chosen := 0;
    if slot > 0 then
      select coalesce(min(position - 1), 0)::integer
        into chosen
        from jsonb_array_elements(remaining) with ordinality as candidate_entry (value, position)
        where candidate_entry.value ->> 'era' is distinct from previous_era;
    end if;
    entry := remaining -> chosen;
    remaining := remaining - chosen;
    previous_era := entry ->> 'era';

    if session_form = 'flashcards' then
      modes := '{}';
    elsif session_form = 'quizzes' then
      modes := (array['quiz_title', 'quiz_image', 'quiz_style', 'quiz_title', 'quiz_image'])
        [slot % 3 + 1 : slot % 3 + 3];
    elsif entry ->> 'state' is null or (entry ->> 'state')::integer <> review_state then
      modes := (array['quiz_title', 'quiz_image', 'quiz_title'])[slot % 2 + 1 : slot % 2 + 2];
    elsif (entry ->> 'stability')::double precision < settled_stability
      and slot % style_quiz_every = style_quiz_every - 1 then
      modes := array['quiz_style'];
    else
      modes := '{}';
    end if;

    if scope_kind = 'style' then
      modes := array_remove(modes, 'quiz_style');
    end if;

    if session_form <> 'flashcards' and slot % 3 = 0 and exists (
      select 1
        from public.artwork_pins as pin
        join public.artwork_images as image on image.id = pin.image_id
        where image.artwork_id = (entry ->> 'id')::uuid and pin.glossary_entry_id is not null
    ) then
      modes := array_prepend('quiz_pin', modes);
    end if;

    quiz := null;
    foreach candidate in array modes loop
      if candidate = 'quiz_pin' then
        select
            jsonb_build_object(
              'x', pin.x,
              'y', pin.y,
              'image', jsonb_build_object(
                'id', image.id,
                'source_wikidata_id', image.source_wikidata_id,
                'source_image_file', image.source_image_file,
                'source_image_licence', image.source_image_licence,
                'source_image_licence_url', image.source_image_licence_url,
                'source_image_attribution', image.source_image_attribution,
                'own_image_path', image.own_image_path,
                'own_image_url', image.own_image_url,
                'image_width', image.image_width,
                'image_height', image.image_height
              )
            ),
            pin.image_id,
            pin.glossary_entry_id
          into pin_place, pin_image, pin_term
          from public.artwork_pins as pin
          join public.artwork_images as image on image.id = pin.image_id
          where image.artwork_id = (entry ->> 'id')::uuid and pin.glossary_entry_id is not null
          order by random()
          limit 1;

        with answer as (
          select term.id, term.name, term.category
            from public.glossary_entries as term
            where term.id = pin_term
        ),
        others as (
          select distinct on (lower(term.name)) term.name,
              term.category = answer.category as same_category,
              random() as draw
            from answer
            join public.glossary_entries as term
              on term.id <> answer.id and lower(term.name) <> lower(answer.name)
            where not exists (
              select 1 from public.artwork_pins as neighbour
                where neighbour.image_id = pin_image and neighbour.glossary_entry_id = term.id
            )
            order by lower(term.name), random()
        ),
        drawn as (
          select others.name from others order by others.same_category desc, others.draw limit 3
        ),
        options as (
          select jsonb_build_object('label', answer.name, 'right', true) as option from answer
          union all
          select jsonb_build_object('label', drawn.name) from drawn
        )
        select jsonb_agg(options.option order by random())
          into quiz
          from options
          having count(*) = 4;
      elsif candidate = 'quiz_style' then
        with pool as (
          select * from jsonb_to_recordset(facts) as fact (
            id uuid, title_key text, era text, type text, year integer,
            authors text[], styles text[], period text, place text
          )
        ),
        answer as (
          select * from pool where pool.id = (entry ->> 'id')::uuid
        ),
        scored as (
          select style.name,
            max(
              (case when other.styles && answer.styles then 4 else 0 end)
              + (case when other.authors && answer.authors then 3 else 0 end)
              + (case when other.period = answer.period then 2 else 0 end)
              + (case when other.type = answer.type then 2 else 0 end)
              + (case when other.era = answer.era then 1 else 0 end)
              + (case when abs(other.year - answer.year) <= 50 then 1 else 0 end)
              + (case when other.place = answer.place then 1 else 0 end)
            ) as score
            from answer
            join pool as other on other.id <> answer.id
            cross join lateral unnest(other.styles) as style (name)
            where cardinality(answer.styles) > 0 and not style.name = any (answer.styles)
            group by style.name
        ),
        best as (
          select scored.name from scored order by scored.score desc, random() limit 8
        ),
        drawn as (
          select best.name from best order by random() limit 3
        ),
        options as (
          select jsonb_build_object('label', answer.styles[1], 'right', true) as option from answer
          union all
          select jsonb_build_object('label', drawn.name) from drawn
        )
        select jsonb_agg(options.option order by random())
          into quiz
          from options
          having count(*) = 4;
      else
        with pool as (
          select * from jsonb_to_recordset(facts) as fact (
            id uuid, title text, title_key text, era text, type text, year integer,
            authors text[], styles text[], period text, place text
          )
        ),
        answer as (
          select * from pool where pool.id = (entry ->> 'id')::uuid
        ),
        scored as (
          select other.id, other.title, other.title_key,
            (case when other.styles && answer.styles then 4 else 0 end)
              + (case when other.authors && answer.authors then 3 else 0 end)
              + (case when other.period = answer.period then 2 else 0 end)
              + (case when other.type = answer.type then 2 else 0 end)
              + (case when other.era = answer.era then 1 else 0 end)
              + (case when abs(other.year - answer.year) <= 50 then 1 else 0 end)
              + (case when other.place = answer.place then 1 else 0 end) as score,
            case
              when other.authors && answer.authors then 'author'
              when other.styles && answer.styles then 'style'
              when other.period = answer.period then 'period'
            end as reason
            from answer
            join pool as other on other.id <> answer.id and other.title_key <> answer.title_key
        ),
        unique_titles as (
          select distinct on (scored.title_key) scored.*
            from scored
            order by scored.title_key, scored.score desc, random()
        ),
        best as (
          select * from unique_titles order by unique_titles.score desc, random() limit 8
        ),
        drawn as (
          select * from best order by random() limit 3
        ),
        options as (
          select jsonb_build_object('artwork_id', answer.id, 'label', answer.title, 'right', true)
              as option
            from answer
          union all
          select jsonb_strip_nulls(
              jsonb_build_object('artwork_id', drawn.id, 'label', drawn.title, 'reason', drawn.reason)
            )
            from drawn
        )
        select jsonb_agg(options.option order by random())
          into quiz
          from options
          having count(*) = 4;
      end if;

      if quiz is not null then
        items := items || jsonb_build_array(
          jsonb_build_object('artwork_id', entry -> 'id', 'mode', candidate, 'options', quiz)
            || case when candidate = 'quiz_pin' then jsonb_build_object('pin', pin_place) else '{}' end
        );
        exit;
      end if;
    end loop;

    if quiz is null then
      items := items || jsonb_build_array(jsonb_build_object(
        'artwork_id', entry -> 'id', 'mode', 'flashcard'
      ));
    end if;
    slot := slot + 1;
  end loop;

  return items;
end;
$$;

revoke all on function public.review_session(timestamptz, text, text, text, integer) from public, anon;
grant execute on function public.review_session(timestamptz, text, text, text, integer) to authenticated;
