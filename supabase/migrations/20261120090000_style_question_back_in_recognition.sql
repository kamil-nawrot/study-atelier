delete from public.review_cards where facet = 'style';

alter table public.review_cards
  drop constraint review_cards_facet_check,
  add constraint review_cards_facet_check check (facet in ('recognise', 'date'));

drop function private.fill_style_cards(uuid);
drop function private.next_style_card(public.review_cards, timestamptz, integer);

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
        ) or bool_or(image.broken_at is not null) as held
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

    recognition_size := session_size - jsonb_array_length(year_picks)
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
      year_picks := '[]';
      order_ids := null;
    end if;
  end if;

  return jsonb_build_object(
    'facts', facts,
    'quiz_kinds', to_jsonb(quiz_kinds),
    'year_picks', year_picks,
    'order_ids', to_jsonb(order_ids),
    'picked', picked,
    'artworks', jsonb_array_length(facts),
    'due', due_count,
    'known', known_count
  );
end;
$$;


create or replace function public.review_round_counts(round jsonb)
returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'known', count(*) filter (where jsonb_typeof(pick.value -> 'state') <> 'null'),
    'fresh', count(*) filter (where jsonb_typeof(pick.value -> 'state') = 'null'),
    'years', jsonb_array_length(coalesce(round -> 'year_picks', '[]')),
    'orders', case when jsonb_typeof(round -> 'order_ids') = 'array' then 1 else 0 end,
    'artworks', (round ->> 'artworks')::integer
  )
    from jsonb_array_elements(round -> 'picked') as pick (value);
$$;

create or replace function public.review_round_size(round jsonb)
returns integer
language sql
immutable
security invoker
set search_path = ''
as $$
  select jsonb_array_length(round -> 'picked')
    + jsonb_array_length(coalesce(round -> 'year_picks', '[]'))
    + case when jsonb_typeof(round -> 'order_ids') = 'array' then 1 else 0 end;
$$;

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

    modes := '{}';
    if session_form <> 'flashcards'
      and (entry ->> 'state' is null or (entry ->> 'state')::integer <> review_state) then
      modes := array(
        select listed.kind
          from unnest(rotation) with ordinality as listed (kind, place)
          where listed.kind = any (quiz_kinds)
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
          where due.asked
          order by coalesce(array_position(history, due.kind) - 1, never_asked) desc, due.place
      );
      if session_form = 'quizzes' then
        modes := modes || array(
          select listed.kind
            from unnest(rotation) with ordinality as listed (kind, place)
            where listed.kind = any (quiz_kinds)
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
  first_year integer;
  last_year integer;
  miss integer;
  only_practice boolean := false;
begin
  if target_facet not in ('recognise', 'date') then
    raise exception using errcode = '22023', message = 'unknown review facet';
  end if;

  if target_facet = 'date' and not exists (
    select 1 from public.review_cards as known
      where known.artwork_id = target_artwork and known.facet = 'recognise'
  ) then
    raise exception using errcode = '22023', message = 'the artwork was not reviewed yet';
  end if;

  select existing.due into previous_due
    from public.review_cards as existing
    where existing.artwork_id = target_artwork and existing.facet = target_facet;

  only_practice := day_start is not null and exists (
    select 1 from public.review_log as earlier
      where earlier.artwork_id = target_artwork
        and earlier.facet = target_facet
        and not earlier.practice
        and earlier.reviewed_at >= day_start
        and earlier.reviewed_at < day_start + interval '1 day'
  );

  if not only_practice then
    insert into public.review_cards (
      artwork_id, facet, due, stability, difficulty, state, reps, lapses, scheduled_days,
      learning_steps, last_review, last_rating
    )
    values (
      target_artwork, target_facet, next_card.due, next_card.stability, next_card.difficulty,
      next_card.state, next_card.reps, next_card.lapses, next_card.scheduled_days,
      next_card.learning_steps, next_card.last_review, given.rating
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
        last_review = excluded.last_review,
        last_rating = excluded.last_rating;
  end if;

  if target_facet = 'date' and given.guessed_year is not null then
    select coalesce(artwork.year_from, artwork.year_to), coalesce(artwork.year_to, artwork.year_from)
      into first_year, last_year
      from public.artworks as artwork
      where artwork.id = target_artwork;
    miss := case
      when given.guessed_year < first_year then
        first_year - given.guessed_year - case when given.guessed_year < 0 and first_year > 0 then 1 else 0 end
      when given.guessed_year > last_year then
        given.guessed_year - last_year - case when last_year < 0 and given.guessed_year > 0 then 1 else 0 end
      when first_year is not null then 0
    end;
  end if;

  insert into public.review_log (
    artwork_id, facet, mode, rating, correct, answer_ms, due_before, guessed_year, year_miss,
    wrong_answer, practice
  )
  values (
    target_artwork, target_facet, given.mode, given.rating, given.correct, given.answer_ms,
    previous_due, case when target_facet = 'date' then given.guessed_year end, miss,
    case when given.correct is false then nullif(left(btrim(given.wrong_answer), 500), '') end,
    only_practice
  );

  if day_start is null or time_zone is null then
    return;
  end if;

  if target_facet = 'date' then
    if given.rating >= 2 and not only_practice then
      perform public.record_right_answer(day_start);
    end if;
    return;
  end if;

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
      where card.facet = 'recognise' and card.due < day_start + interval '1 day') as due,
    (select count(*)::integer
      from live
      where not exists (select 1 from public.review_cards as card where card.artwork_id = live.id))
      as new_available,
    (select count(*)::integer
      from public.review_cards as card
      where card.facet = 'recognise' and card.created_at >= day_start) as new_today,
    (select count(*)::integer from live) as with_image
    into counts;
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
