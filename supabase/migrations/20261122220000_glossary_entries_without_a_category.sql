alter table public.glossary_entries
  add column kind text not null default 'term' check (kind in ('term', 'figure'));

update public.glossary_entries
  set kind = 'figure'
  where category in ('ruler', 'patron', 'artist', 'scholar', 'sacred', 'myth');

alter table public.glossary_entries
  alter column category drop not null,
  drop constraint glossary_entries_category_check;

alter table public.glossary_entries add constraint glossary_entries_category_check
  check (
    category is null
    or (kind = 'term' and category in ('architecture', 'painting', 'sculpture', 'technique', 'iconography', 'general'))
    or (kind = 'figure' and category in ('ruler', 'patron', 'artist', 'scholar', 'sacred', 'myth'))
  );

grant insert (kind) on public.glossary_entries to authenticated;

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
  quiz_kinds text[];
  min_artworks constant integer := 20;
  settled_stability constant double precision := 7;
  due_after constant integer := 2;
  never_asked constant integer := 1000000;
  review_state constant integer := 2;
  planned jsonb;
  facts jsonb;
  picked jsonb;
  remaining jsonb;
  entry jsonb;
  previous_era text;
  chosen integer;
  slot integer := 0;
  modes text[];
  history text[];
  detail_due boolean;
  typed_due boolean;
  style_due boolean;
  held_kinds text[];
  rotation text[];
  candidate text;
  quiz jsonb;
  pin_place jsonb;
  pin_image uuid;
  pin_term uuid;
  items jsonb := '[]';
begin
  planned := public.review_round(day_start, session_form, scope_kind, scope_value, free_round);
  facts := planned -> 'facts';
  if jsonb_array_length(facts) < min_artworks then
    return items;
  end if;
  quiz_kinds := array(select jsonb_array_elements_text(planned -> 'quiz_kinds'));
  rotation := array['quiz_title', 'quiz_image', 'quiz_author']
    || case when session_form = 'quizzes' and scope_kind <> 'style' then array['quiz_style'] else '{}' end;
  picked := planned -> 'picked';

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

    select coalesce(array_agg(answered.mode order by answered.reviewed_at desc, answered.id desc), '{}')
      into history
      from (
        select log.mode, log.reviewed_at, log.id
          from public.review_log as log
          where log.artwork_id = (entry ->> 'id')::uuid
            and log.facet = 'recognise'
            and not log.practice
          order by log.reviewed_at desc, log.id desc
          limit 100
      ) as answered;

    select coalesce(array_agg(distinct
          case when flag.reason = 'pin' then 'quiz_pin' else flag.question ->> 'mode' end), '{}')
      into held_kinds
      from public.learner_flags as flag
      where flag.artwork_id = (entry ->> 'id')::uuid
        and flag.holds
        and (flag.reason = 'pin' or (flag.reason = 'answers' and flag.question ->> 'mode' is not null));

    modes := '{}';
    if session_form <> 'flashcards'
      and (entry ->> 'state' is null or (entry ->> 'state')::integer <> review_state) then
      modes := array(
        select listed.kind
          from unnest(rotation) with ordinality as listed (kind, place)
          where listed.kind = any (quiz_kinds) and not listed.kind = any (held_kinds)
          order by coalesce(array_position(history, listed.kind) - 1, never_asked) desc, listed.place
      );
    elsif session_form <> 'flashcards' then
      detail_due := 'quiz_pin' = any (quiz_kinds)
        and cardinality(history) >= due_after
        and coalesce(array_position(history, 'quiz_pin') - 1, never_asked) >= due_after
        and exists (
          select 1
            from public.artwork_pins as pin
            join public.artwork_images as image on image.id = pin.image_id
            where image.artwork_id = (entry ->> 'id')::uuid and pin.glossary_entry_id is not null
        );
      typed_due := 'quiz_typed' = any (quiz_kinds)
        and (entry ->> 'stability')::double precision >= settled_stability
        and cardinality(history) >= due_after
        and coalesce(array_position(history, 'quiz_typed') - 1, never_asked) >= due_after;
      style_due := session_form = 'mixed'
        and scope_kind <> 'style'
        and 'quiz_style' = any (quiz_kinds)
        and cardinality(history) >= due_after
        and coalesce(array_position(history, 'quiz_style') - 1, never_asked) >= due_after;
      modes := array(
        select due.kind
          from unnest(
            array['quiz_pin', 'quiz_typed', 'quiz_style'],
            array[detail_due, typed_due, style_due]
          ) with ordinality as due (kind, asked, place)
          where due.asked and not due.kind = any (held_kinds)
          order by coalesce(array_position(history, due.kind) - 1, never_asked) desc, due.place
      );
      if session_form = 'quizzes' then
        modes := modes || array(
          select listed.kind
            from unnest(rotation) with ordinality as listed (kind, place)
            where listed.kind = any (quiz_kinds) and not listed.kind = any (held_kinds)
            order by coalesce(array_position(history, listed.kind) - 1, never_asked) desc, listed.place
        );
      end if;
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
                'image_height', image.image_height,
                'broken_at', image.broken_at
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
          select term.id, term.name, term.category, term.kind
            from public.glossary_entries as term
            where term.id = pin_term
        ),
        others as (
          select distinct on (lower(term.name)) term.name,
              coalesce(term.category = answer.category, false) as same_category,
              term.kind = answer.kind as same_kind,
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
          select others.name from others
            order by others.same_category desc, others.same_kind desc, others.draw
            limit 3
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
      elsif candidate = 'quiz_typed' then
        quiz := '[]';
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
              public.review_likeness(
                row(answer.authors, answer.styles, answer.period, answer.type, answer.era, answer.year, answer.place)::public.review_likeness_facts,
                row(other.authors, other.styles, other.period, other.type, other.era, other.year, other.place)::public.review_likeness_facts
              )
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
      elsif candidate = 'quiz_author' then
        with pool as (
          select * from jsonb_to_recordset(facts) as fact (
            id uuid, era text, type text, year integer,
            authors text[], styles text[], period text, place text
          )
        ),
        answer as (
          select * from pool where pool.id = (entry ->> 'id')::uuid
        ),
        scored as (
          select array_to_string(other.authors, ', ') as label,
            (
              select string_agg(lower(btrim(author.name)), '|' order by lower(btrim(author.name)))
                from unnest(other.authors) as author (name)
            ) as author_key,
            public.review_likeness(
            row(answer.authors, answer.styles, answer.period, answer.type, answer.era, answer.year, answer.place)::public.review_likeness_facts,
            row(other.authors, other.styles, other.period, other.type, other.era, other.year, other.place)::public.review_likeness_facts
          ) as score
            from answer
            join pool as other on other.id <> answer.id
            where cardinality(answer.authors) > 0
              and cardinality(other.authors) > 0
              and not exists (
                select 1
                  from unnest(other.authors) as other_author (name)
                  join unnest(answer.authors) as answer_author (name)
                    on lower(btrim(other_author.name)) = lower(btrim(answer_author.name))
              )
        ),
        unique_labels as (
          select distinct on (scored.author_key) scored.*
            from scored
            order by scored.author_key, scored.score desc
        ),
        best as (
          select * from unique_labels order by unique_labels.score desc, random() limit 8
        ),
        drawn as (
          select best.label from best order by random() limit 3
        ),
        options as (
          select jsonb_build_object('label', array_to_string(answer.authors, ', '), 'right', true)
              as option
            from answer
          union all
          select jsonb_build_object('label', drawn.label) from drawn
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
            public.review_likeness(
            row(answer.authors, answer.styles, answer.period, answer.type, answer.era, answer.year, answer.place)::public.review_likeness_facts,
            row(other.authors, other.styles, other.period, other.type, other.era, other.year, other.place)::public.review_likeness_facts
          ) as score,
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

  if jsonb_array_length(items) = 0 then
    return items;
  end if;

  return items
    || (
      select coalesce(jsonb_agg(
          jsonb_build_object('artwork_id', year.value -> 'id', 'mode', 'year', 'card', year.value -> 'card')
          order by year.place
        ), '[]')
        from jsonb_array_elements(planned -> 'year_picks') with ordinality as year (value, place)
    )
    || case when jsonb_typeof(planned -> 'order_ids') = 'array'
      then jsonb_build_array(jsonb_build_object('mode', 'order', 'artwork_ids', planned -> 'order_ids'))
      else '[]'::jsonb end;
end;
$$;

create or replace function public.extra_round(day_start timestamptz, reserve integer default 2)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  min_terms constant integer := 4;
  other_answers constant integer := 3;
  day_end timestamptz := day_start + interval '1 day';
  term_count integer := 1;
  symbol_count integer := 1;
  event_count integer := 1;
  preferences record;
  picked_terms jsonb;
  picked_symbols jsonb;
  picked_events jsonb;
begin
  if day_start is null or reserve is null or reserve < 0 then
    raise exception using errcode = '22023', message = 'unknown extra round';
  end if;

  select profile.review_glossary_on, profile.review_glossary_questions,
      profile.review_symbols_on, profile.review_symbol_questions,
      profile.review_events_on, profile.review_event_questions
    into preferences
    from public.profiles as profile;
  if found then
    term_count := case when preferences.review_glossary_on then preferences.review_glossary_questions else 0 end;
    symbol_count := case when preferences.review_symbols_on then preferences.review_symbol_questions else 0 end;
    event_count := case when preferences.review_events_on then preferences.review_event_questions else 0 end;
  end if;
  term_count := case when term_count > 0 then term_count + reserve else 0 end;
  symbol_count := case when symbol_count > 0 then symbol_count + reserve else 0 end;
  event_count := greatest(event_count, 0);

  if (select count(distinct lower(entry.name)) from public.glossary_entries as entry where entry.has_definition)
      < min_terms then
    term_count := 0;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', picked.id, 'card', picked.card) order by picked.place), '[]')
    into picked_terms
    from (
      select entry.id,
          case when card.id is null then null else to_jsonb(card) - 'owner_id' - 'created_at' end as card,
          row_number() over (order by card.id is null, card.due, random()) as place
        from public.glossary_entries as entry
        left join public.extra_cards as card on card.glossary_entry_id = entry.id
        where entry.has_definition
          and (card.id is null or card.due < day_end)
          and not exists (
            select 1 from public.learner_flags as flag where flag.term_id = entry.id and flag.holds
          )
        order by place
        limit term_count
    ) as picked;

  with question_pins as (
    select pin.id as pin_id, pin.symbol_id, pin.symbol_meaning_id, symbol.name
      from public.artwork_pins as pin
      join public.symbols as symbol on symbol.id = pin.symbol_id
      join public.artwork_images as image on image.id = pin.image_id
      join public.artworks as artwork on artwork.id = image.artwork_id and artwork.deleted_at is null
      where pin.crop_path is not null
        and pin.view_width is not null
        and not exists (
          select 1 from public.learner_flags as flag
            where flag.holds
              and (
                flag.symbol_id = pin.symbol_id
                or flag.pin_id = pin.id
                or (flag.artwork_id = artwork.id and flag.reason not in ('pin', 'answers'))
              )
        )
  ),
  own_persons as (
    select context.meaning_id, lower(entry.name) as name_key
      from public.symbol_meaning_contexts as context
      join public.glossary_entries as entry on entry.id = context.glossary_entry_id
      where entry.kind = 'figure'
  ),
  own_counts as (
    select own.meaning_id, count(distinct own.name_key) as names
      from own_persons as own
      group by own.meaning_id
  ),
  answer_counts as (
    select
      (select count(distinct lower(symbol.name)) from public.symbols as symbol) as symbols,
      (select count(distinct lower(meaning.text)) from public.symbol_meanings as meaning) as meanings,
      (select count(distinct lower(person.name)) from public.glossary_entries as person
        where person.kind = 'figure') as persons
  ),
  questions as (
    select question.pin_id, question.symbol_id, 'symbol' as kind
      from question_pins as question, answer_counts as counts
      where counts.symbols - 1 >= other_answers
    union all
    select question.pin_id, question.symbol_id, 'meaning'
      from question_pins as question
      join public.symbol_meanings as meaning on meaning.id = question.symbol_meaning_id,
      answer_counts as counts
      where counts.meanings - 1 >= other_answers
    union all
    select question.pin_id, question.symbol_id, 'attribute'
      from question_pins as question
      join own_counts as own on own.meaning_id = question.symbol_meaning_id,
      answer_counts as counts
      where counts.persons - own.names >= other_answers
  ),
  picked as (
    select candidate.symbol_id, card.id as card_id,
        case when card.id is null then null else to_jsonb(card) - 'owner_id' - 'created_at' end as card,
        row_number() over (order by card.id is null, card.due, random()) as place
      from (select distinct question.symbol_id from questions as question) as candidate
      left join public.extra_cards as card on card.symbol_id = candidate.symbol_id
      where card.id is null or card.due < day_end
      order by place
      limit symbol_count
  ),
  asked as (
    select log.card_id, replace(log.mode, 'symbol_', '') as kind, max(log.reviewed_at) as at
      from public.extra_review_log as log
      where not log.practice and log.mode like 'symbol\_%'
        and log.card_id in (select picked.card_id from picked)
      group by log.card_id, log.mode
  ),
  kinds as (
    select distinct on (picked.symbol_id) picked.symbol_id, offered.kind
      from picked
      join (select distinct question.symbol_id, question.kind from questions as question) as offered
        on offered.symbol_id = picked.symbol_id
      left join asked on asked.card_id = picked.card_id and asked.kind = offered.kind
      order by picked.symbol_id, asked.at nulls first,
        array_position(array['symbol', 'meaning', 'attribute'], offered.kind)
  ),
  pins as (
    select distinct on (kinds.symbol_id) kinds.symbol_id, kinds.kind, question.pin_id
      from kinds
      join questions as question on question.symbol_id = kinds.symbol_id and question.kind = kinds.kind
      order by kinds.symbol_id, random()
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'symbol_id', picked.symbol_id, 'pin_id', pins.pin_id, 'kind', pins.kind, 'card', picked.card
    ) order by picked.place), '[]')
    into picked_symbols
    from picked
    join pins on pins.symbol_id = picked.symbol_id;

  with picked as (
    select event.id, event.year_from, card.id as card_id,
        case when card.id is null then null else to_jsonb(card) - 'owner_id' - 'created_at' end as card,
        row_number() over (order by card.id is null, card.due, random()) as place
      from public.timeline_events as event
      left join public.extra_cards as card on card.timeline_event_id = event.id
      where (card.id is null or card.due < day_end)
        and not exists (
          select 1 from public.learner_flags as flag where flag.event_id = event.id and flag.holds
        )
      order by place
      limit event_count
  ),
  asked as (
    select log.card_id,
        max(log.reviewed_at) filter (where log.mode = 'event_start') as started_at,
        max(log.reviewed_at) filter (where log.mode = 'event_end') as ended_at
      from public.extra_review_log as log
      where not log.practice and log.card_id in (select picked.card_id from picked)
      group by log.card_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', picked.id,
      'kind', case
        when picked.year_from is null then 'year'
        when asked.started_at is null then 'start'
        when asked.ended_at is null then 'end'
        when asked.ended_at < asked.started_at then 'end'
        else 'start'
      end,
      'card', picked.card
    ) order by picked.place), '[]')
    into picked_events
    from picked
    left join asked on asked.card_id = picked.card_id;

  return jsonb_build_object('terms', picked_terms, 'symbols', picked_symbols, 'events', picked_events);
end;
$$;

create or replace function public.import_atelier(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  importer uuid := auth.uid();
  tables constant text[] := array[
    'artworks', 'artwork_images', 'glossary_entries', 'symbols', 'symbol_meanings', 'artwork_pins',
    'artwork_fields',
    'category_values', 'artwork_values', 'period_eras', 'style_periods', 'author_details',
    'period_details', 'style_details', 'material_details', 'location_details', 'era_details',
    'artwork_relations', 'author_relations',
    'artwork_field_entries', 'symbol_meaning_contexts', 'timeline_events', 'visits', 'visit_artworks', 'exhibitions', 'learner_flags', 'review_cards',
    'review_log', 'extra_cards', 'extra_review_log', 'point_events', 'exhibit_tiers', 'free_review_days'
  ];
  kept_tables constant text[] := array['point_events', 'exhibit_tiers', 'free_review_days'];
  had_points constant boolean := exists (select 1 from public.point_events where owner_id = auth.uid());
  table_name text;
  rows jsonb;
  columns text;
  inserted bigint;
  kept boolean;
  counts jsonb := '{}';
begin
  if importer is null then
    raise exception using errcode = '28000', message = 'not signed in';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception using errcode = '22023', message = 'the import is not an object';
  end if;
  if exists (select 1 from public.artworks where owner_id = importer)
    or exists (select 1 from public.category_values where owner_id = importer)
    or exists (select 1 from public.glossary_entries where owner_id = importer)
    or exists (select 1 from public.timeline_events where owner_id = importer)
    or exists (select 1 from public.artwork_fields where owner_id = importer)
    or exists (select 1 from public.visits where owner_id = importer)
    or exists (select 1 from public.exhibitions where owner_id = importer)
    or exists (select 1 from public.symbols where owner_id = importer)
  then
    raise exception using errcode = '55000', message = 'the atelier is not empty';
  end if;

  perform set_config('study_atelier.importing', 'on', true);

  foreach table_name in array tables loop
    rows := coalesce(payload -> table_name, '[]');
    if jsonb_typeof(rows) <> 'array' then
      raise exception using errcode = '22023', message = format('%s is not a list', table_name);
    end if;
    if jsonb_array_length(rows) = 0 then
      continue;
    end if;
    if table_name = 'exhibit_tiers' then
      rows := coalesce((select jsonb_agg(tier.value)
        from jsonb_array_elements(rows) as tier
        where exists (select 1 from public.exhibits as exhibit where exhibit.code = tier.value ->> 'exhibit')), '[]');
      if jsonb_array_length(rows) = 0 then
        continue;
      end if;
    end if;
    if table_name = 'review_cards' then
      rows := coalesce((select jsonb_agg(card.value)
        from jsonb_array_elements(rows) as card
        where coalesce(card.value ->> 'facet', 'recognise') <> 'style'), '[]');
      if jsonb_array_length(rows) = 0 then
        continue;
      end if;
    end if;
    if table_name = 'glossary_entries' then
      rows := (select jsonb_agg(
          case when entry.value ->> 'category' = 'person'
            then entry.value || jsonb_build_object('category', 'scholar')
            else entry.value
          end
          || case when jsonb_exists(entry.value, 'kind') then '{}'::jsonb
            else jsonb_build_object('kind', case
              when entry.value ->> 'category' in ('ruler', 'patron', 'artist', 'scholar', 'sacred', 'myth', 'person')
              then 'figure' else 'term' end)
          end)
        from jsonb_array_elements(rows) as entry);
    end if;
    if table_name = 'location_details' then
      rows := (select jsonb_agg(place.value - 'city_id') from jsonb_array_elements(rows) as place);
    end if;
    if table_name in ('artwork_relations', 'author_relations') then
      rows := (select jsonb_agg(
          case
            when relation.value ->> 'kind' in ('version', 'related', 'collaboration', 'family')
              and (relation.value ->> 'from_id')::uuid > (relation.value ->> 'to_id')::uuid
            then relation.value
              || jsonb_build_object('from_id', relation.value -> 'to_id', 'to_id', relation.value -> 'from_id')
            else relation.value
          end)
        from jsonb_array_elements(rows) as relation);
    end if;
    if table_name = any (kept_tables) then
      execute format('select exists (select 1 from public.%I where owner_id = $1)', table_name)
        into kept using importer;
      if kept or (table_name = 'point_events' and had_points) then
        continue;
      end if;
    end if;

    select string_agg(quote_ident(attribute.attname), ', ' order by attribute.attnum)
      into columns
      from pg_attribute as attribute
      where attribute.attrelid = format('public.%I', table_name)::regclass
        and attribute.attnum > 0
        and not attribute.attisdropped
        and attribute.attidentity = ''
        and attribute.attgenerated = ''
        and attribute.attname <> 'owner_id'
        and jsonb_exists(rows -> 0, attribute.attname);

    execute format(
      'insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1)',
      table_name, columns, columns, table_name
    ) using rows;
    get diagnostics inserted = row_count;
    counts := counts || jsonb_build_object(table_name, inserted);
  end loop;

  update public.location_details as details
    set city_id = (place.value ->> 'city_id')::uuid
    from jsonb_array_elements(coalesce(payload -> 'location_details', '[]')) as place
    where details.value_id = (place.value ->> 'value_id')::uuid
      and details.owner_id = importer
      and place.value ->> 'city_id' is not null;

  if jsonb_array_length(coalesce(payload -> 'review_log', '[]')) > 0
    and not jsonb_exists(payload -> 'review_log' -> 0, 'practice') then
    perform private.fill_review_practice(importer);
  end if;

  perform set_config('study_atelier.importing', '', true);

  perform private.rebuild_note_links(importer);

  if not had_points and not exists (select 1 from public.point_events where owner_id = importer) then
    perform private.fill_point_events(importer);
  end if;

  return counts;
end;
$$;
