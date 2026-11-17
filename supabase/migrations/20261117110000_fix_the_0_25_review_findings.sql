create or replace function public.review_round(
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
  session_size integer := 20;
  new_per_day integer := 10;
  quiz_kinds text[] := array['quiz_title', 'quiz_image', 'quiz_author', 'quiz_style', 'quiz_pin', 'quiz_typed'];
  min_artworks constant integer := 20;
  forgotten_state constant integer := 3;
  style_share constant integer := 5;
  year_share constant integer := 10;
  min_order_gap constant integer := 30;
  order_size constant integer := 4;
  year_questions boolean := false;
  order_questions boolean := false;
  year_picks jsonb := '[]';
  order_ids uuid[];
  dated record;
  kept uuid[];
  kept_first integer[];
  kept_last integer[];
  shown uuid[];
  chronological uuid[];
  preferences record;
  facts jsonb;
  scope_count integer;
  picked jsonb := '[]';
  style_places integer := 0;
  style_picks jsonb := '[]';
  recognition_size integer;
  due_count integer;
  known_count integer;
begin
  if session_form is null or session_form not in ('mixed', 'flashcards', 'quizzes') then
    raise exception using errcode = '22023', message = 'unknown review form';
  end if;
  if scope_kind is null or scope_kind not in ('all', 'seen', 'era', 'period', 'style')
    or (scope_kind not in ('all', 'seen') and scope_value is null) then
    raise exception using errcode = '22023', message = 'unknown review scope';
  end if;
  if free_round < 0 then
    raise exception using errcode = '22023', message = 'unknown free round';
  end if;

  select profile.review_session_size, profile.review_new_per_day, profile.review_quiz_kinds,
      profile.review_year_questions, profile.review_order_questions
    into preferences
    from public.profiles as profile;
  if found then
    session_size := preferences.review_session_size;
    new_per_day := preferences.review_new_per_day;
    quiz_kinds := preferences.review_quiz_kinds;
    year_questions := preferences.review_year_questions;
    order_questions := preferences.review_order_questions;
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
        coalesce(artwork.year_from, artwork.year_to) as first_year,
        coalesce(artwork.year_to, artwork.year_from) as last_year,
        coalesce(
          array_agg(value.name order by link.position) filter (where value.category_code = 'author'), '{}'
        ) as authors,
        coalesce(
          array_agg(value.name order by link.position) filter (where value.category_code = 'style'), '{}'
        ) as styles,
        (array_agg(value.name order by link.position) filter (where value.category_code = 'period'))[1]
          as period,
        (array_agg(value.name order by link.position) filter (where value.category_code = 'location'))[1]
          as place,
        exists (
          select 1 from public.learner_flags as flag
            where flag.artwork_id = artwork.id and flag.holds and flag.reason not in ('pin', 'answers')
        ) as held
      from public.artworks as artwork
      join public.artwork_images as image on image.artwork_id = artwork.id and image.position = 0
      left join public.artwork_values as link on link.artwork_id = artwork.id
      left join public.category_values as value on value.id = link.value_id
      where artwork.deleted_at is null
      group by artwork.id
    ) as fact
    where scope_kind = 'all'
      or (scope_kind = 'seen' and exists (select 1 from public.visit_artworks as seen where seen.artwork_id = fact.id))
      or (scope_kind = 'era' and fact.era = scope_value)
      or (scope_kind = 'period' and fact.period = scope_value)
      or (scope_kind = 'style' and scope_value = any (fact.styles));

  scope_count := jsonb_array_length(facts);
  select coalesce(jsonb_agg(fact.value - 'held'), '[]')
    into facts
    from jsonb_array_elements(facts) as fact
    where not (fact.value ->> 'held')::boolean;

  select count(*) filter (where card.due < day_start + interval '1 day'), count(card.artwork_id)
    into due_count, known_count
    from jsonb_to_recordset(facts) as fact (id uuid)
    join public.review_cards as card on card.artwork_id = fact.id and card.facet = 'recognise';

  if scope_count >= min_artworks then
    if session_form <> 'flashcards' and scope_kind <> 'style' and 'quiz_style' = any (quiz_kinds) then
      style_places := session_size / style_share;
    end if;

    with pool as (
      select * from jsonb_to_recordset(facts) as fact (id uuid, styles text[])
    ),
    eligible as (
      select pool.id,
          style.due,
          case when style.artwork_id is null then null else jsonb_build_object(
            'due', style.due,
            'stability', style.stability,
            'difficulty', style.difficulty,
            'state', style.state,
            'reps', style.reps,
            'lapses', style.lapses,
            'scheduled_days', style.scheduled_days,
            'learning_steps', style.learning_steps,
            'last_review', style.last_review
          ) end as card,
          random() as draw
        from pool
        join public.review_cards as known on known.artwork_id = pool.id and known.facet = 'recognise'
        left join public.review_cards as style on style.artwork_id = pool.id and style.facet = 'style'
        where cardinality(pool.styles) > 0
          and (free_round is not null or style.artwork_id is null or style.due < day_start + interval '1 day')
          and (
            select count(distinct other_style.name)
              from pool as other
              cross join lateral unnest(other.styles) as other_style (name)
              where other.id <> pool.id and not other_style.name = any (pool.styles)
          ) >= 3
    ),
    ranked as (
      select eligible.*,
          row_number() over (
            order by (free_round is null and eligible.due is not null) desc,
              case when free_round is null then eligible.due end,
              eligible.draw
          ) as rank
        from eligible
    )
    select coalesce(jsonb_agg(jsonb_build_object('id', ranked.id, 'card', ranked.card) order by ranked.rank), '[]')
      into style_picks
      from ranked
      where ranked.rank <= style_places;

    if year_questions then
      with pool as (
        select * from jsonb_to_recordset(facts) as fact (id uuid, era text, first_year integer, last_year integer)
      ),
      bounds (junction) as (
        select coalesce(
          (select profile.era_bounds from public.profiles as profile),
          array[-3000, 476, 1492, 1789, 1945]
        )
      ),
      eras (code, first_year, last_year) as (
        select era.code, era.first_year, era.last_year
          from bounds,
          lateral (
            values
              ('prehistory', -40000, bounds.junction[1]),
              ('antiquity', bounds.junction[1], bounds.junction[2]),
              ('middle_ages', bounds.junction[2], bounds.junction[3]),
              ('early_modern', bounds.junction[3], bounds.junction[4]),
              ('modern', bounds.junction[4], bounds.junction[5]),
              ('contemporary', bounds.junction[5], extract(year from day_start + interval '12 hours')::integer)
          ) as era (code, first_year, last_year)
      ),
      candidates as (
        select pool.id, card.due,
            case when card.artwork_id is null then null else jsonb_build_object(
              'due', card.due,
              'stability', card.stability,
              'difficulty', card.difficulty,
              'state', card.state,
              'reps', card.reps,
              'lapses', card.lapses,
              'scheduled_days', card.scheduled_days,
              'learning_steps', card.learning_steps,
              'last_review', card.last_review
            ) end as card,
            random() as draw
          from pool
          join eras on eras.code = pool.era
          join public.review_cards as known on known.artwork_id = pool.id and known.facet = 'recognise'
          left join public.review_cards as card on card.artwork_id = pool.id and card.facet = 'date'
          where pool.last_year >= eras.first_year
            and pool.first_year <= eras.last_year
            and (free_round is not null or known.due >= day_start + interval '1 day')
            and (free_round is not null or card.artwork_id is null or card.due < day_start + interval '1 day')
      ),
      ranked as (
        select candidates.*,
            row_number() over (
              order by (free_round is null and candidates.due is not null) desc,
                case when free_round is null then candidates.due end,
                candidates.draw
            ) as rank
          from candidates
      )
      select coalesce(jsonb_agg(jsonb_build_object('id', ranked.id, 'card', ranked.card) order by ranked.rank), '[]')
        into year_picks
        from ranked
        where ranked.rank <= session_size / year_share;

    end if;

    if order_questions then
      kept := '{}';
      kept_first := '{}';
      kept_last := '{}';
      for dated in
        select pool.id, pool.first_year, pool.last_year
          from jsonb_to_recordset(facts) as pool (id uuid, first_year integer, last_year integer)
          where pool.first_year is not null
          order by random()
      loop
        if not exists (
          select 1
            from unnest(kept_first, kept_last) as other (first_year, last_year)
            where dated.first_year - other.last_year < min_order_gap
              and other.first_year - dated.last_year < min_order_gap
        ) then
          kept := kept || dated.id;
          kept_first := kept_first || dated.first_year;
          kept_last := kept_last || dated.last_year;
          exit when cardinality(kept) = order_size;
        end if;
      end loop;

      if cardinality(kept) < order_size then
        kept := '{}';
        kept_first := '{}';
        kept_last := '{}';
        for dated in
          select pool.id, pool.first_year, pool.last_year
            from jsonb_to_recordset(facts) as pool (id uuid, first_year integer, last_year integer)
            where pool.first_year is not null
            order by pool.last_year, pool.first_year, pool.id
        loop
          if cardinality(kept_last) = 0 or dated.first_year - kept_last[cardinality(kept_last)] >= min_order_gap then
            kept := kept || dated.id;
            kept_first := kept_first || dated.first_year;
            kept_last := kept_last || dated.last_year;
            exit when cardinality(kept) = order_size;
          end if;
        end loop;
      end if;

      if cardinality(kept) = order_size then
        select array_agg(listed.id order by random()), array_agg(listed.id order by listed.first_year)
          into shown, chronological
          from unnest(kept, kept_first) as listed (id, first_year);
        if shown = chronological then
          shown := array[shown[2], shown[1]] || shown[3:];
        end if;
        order_ids := shown;
      end if;
    end if;

    recognition_size := session_size - jsonb_array_length(style_picks) - jsonb_array_length(year_picks)
      - case when order_ids is null then 0 else 1 end;

    if free_round is not null then
      with pool as (
        select * from jsonb_to_recordset(facts) as fact (id uuid, number integer, era text)
      ),
      known as (
        select pool.id, pool.era,
            case when card.last_rating = 1 then forgotten_state else card.state end as state,
            card.stability,
            random() as draw
          from pool
          join public.review_cards as card on card.artwork_id = pool.id and card.facet = 'recognise'
          where not exists (
            select 1 from jsonb_array_elements(year_picks) as year where (year.value ->> 'id')::uuid = pool.id
          )
      ),
      drawn as (
        select known.* from known order by known.draw limit recognition_size
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
            case when card.last_rating = 1 then forgotten_state else card.state end as state,
            card.stability, card.due as due_at
          from pool
          join public.review_cards as card on card.artwork_id = pool.id and card.facet = 'recognise'
          where card.due < day_start + interval '1 day'
          order by card.due, pool.number
          limit recognition_size
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
              select count(*) from public.review_cards as card
                where card.facet = 'recognise' and card.created_at >= day_start
            ),
            recognition_size - (select count(*) from due_cards)
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

    if jsonb_array_length(picked) = 0 then
      select coalesce(jsonb_agg(pick.value order by pick.place), '[]')
        into style_picks
        from jsonb_array_elements(style_picks) with ordinality as pick (value, place)
        where jsonb_typeof(pick.value -> 'card') = 'object';
      year_picks := '[]';
      order_ids := null;
    end if;
  end if;

  return jsonb_build_object(
    'facts', facts,
    'quiz_kinds', to_jsonb(quiz_kinds),
    'style_picks', style_picks,
    'year_picks', year_picks,
    'order_ids', to_jsonb(order_ids),
    'picked', picked,
    'artworks', jsonb_array_length(facts),
    'due', due_count,
    'known', known_count
  );
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
      where entry.category = 'person'
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
        where person.category = 'person') as persons
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
      where card.id is null or card.due < day_end
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
