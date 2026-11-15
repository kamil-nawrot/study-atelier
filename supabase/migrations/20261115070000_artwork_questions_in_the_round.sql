alter table public.profiles
  add column review_year_questions boolean not null default false,
  add column review_order_questions boolean not null default false,
  add column review_symbols_on boolean not null default true,
  add column review_pairs_on boolean not null default true,
  add column review_pair_questions smallint not null default 1 check (review_pair_questions between 1 and 3),
  add column review_relations_on boolean not null default true,
  add column review_relation_questions smallint not null default 1
    check (review_relation_questions between 1 and 3);

update public.profiles
  set review_year_questions = review_time_questions,
    review_order_questions = review_time_questions,
    review_symbols_on = review_symbol_questions > 0,
    review_symbol_questions = greatest(review_symbol_questions, 1);

alter table public.profiles drop column review_time_questions;
alter table public.profiles drop constraint profiles_review_symbol_questions_check;
alter table public.profiles add constraint profiles_review_symbol_questions_check
  check (review_symbol_questions between 1 and 3);

alter table public.profiles rename column review_note_questions to review_notes_on;
alter table public.profiles
  add column review_note_questions smallint not null default 1 check (review_note_questions between 1 and 3);

grant insert (
  review_year_questions, review_order_questions, review_symbols_on, review_pairs_on, review_pair_questions,
  review_relations_on, review_relation_questions, review_note_questions
) on public.profiles to authenticated;
grant update (
  review_year_questions, review_order_questions, review_symbols_on, review_pairs_on, review_pair_questions,
  review_relations_on, review_relation_questions, review_note_questions
) on public.profiles to authenticated;

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
          as place
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

  select count(*) filter (where card.due < day_start + interval '1 day'), count(card.artwork_id)
    into due_count, known_count
    from jsonb_to_recordset(facts) as fact (id uuid)
    join public.review_cards as card on card.artwork_id = fact.id and card.facet = 'recognise';

  if jsonb_array_length(facts) >= min_artworks then
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

revoke all on function public.review_round(timestamptz, text, text, text, integer) from public, anon;
grant execute on function public.review_round(timestamptz, text, text, text, integer) to authenticated;

drop function public.review_session(timestamptz, text, text, text, integer, boolean);

create function public.review_session(
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
  candidate text;
  quiz jsonb;
  pin_place jsonb;
  pin_image uuid;
  pin_term uuid;
  items jsonb := '[]';
  style_picks jsonb := '[]';
  style_items jsonb := '[]';
  merged jsonb;
  pending jsonb;
  style_gap integer;
begin
  planned := public.review_round(day_start, session_form, scope_kind, scope_value, free_round);
  facts := planned -> 'facts';
  if jsonb_array_length(facts) < min_artworks then
    return items;
  end if;
  quiz_kinds := array(select jsonb_array_elements_text(planned -> 'quiz_kinds'));
  style_picks := planned -> 'style_picks';
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
          from unnest(array['quiz_title', 'quiz_image', 'quiz_author']) with ordinality as listed (kind, place)
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
      if detail_due and typed_due then
        modes := case
          when coalesce(array_position(history, 'quiz_typed') - 1, never_asked)
            > coalesce(array_position(history, 'quiz_pin') - 1, never_asked) then array['quiz_typed', 'quiz_pin']
          else array['quiz_pin', 'quiz_typed']
        end;
      elsif detail_due then
        modes := array['quiz_pin'];
      elsif typed_due then
        modes := array['quiz_typed'];
      end if;
      if session_form = 'quizzes' then
        modes := modes || array(
          select listed.kind
            from unnest(array['quiz_title', 'quiz_image', 'quiz_author']) with ordinality as listed (kind, place)
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

  for entry in select picked_style.value from jsonb_array_elements(style_picks) as picked_style (value) loop
    quiz := null;
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
    if quiz is not null then
      style_items := style_items || jsonb_build_array(jsonb_build_object(
        'artwork_id', entry -> 'id',
        'mode', 'quiz_style',
        'facet', 'style',
        'options', quiz,
        'card', entry -> 'card'
      ));
    end if;
  end loop;

  if jsonb_array_length(style_items) > 0 then
    merged := '[]';
    pending := style_items;
    style_gap := greatest(1, jsonb_array_length(items) / jsonb_array_length(style_items));
    for spot in 0 .. jsonb_array_length(items) - 1 loop
      merged := merged || jsonb_build_array(items -> spot);
      if (spot + 1) % style_gap = 0 and jsonb_array_length(pending) > 0 then
        select min(waiting.position - 1)::integer
          into chosen
          from jsonb_array_elements(pending) with ordinality as waiting (value, position)
          where waiting.value ->> 'artwork_id' <> items -> spot ->> 'artwork_id'
            and waiting.value ->> 'artwork_id' is distinct from items -> (spot + 1) ->> 'artwork_id';
        if chosen is not null then
          merged := merged || jsonb_build_array(pending -> chosen);
          pending := pending - chosen;
        end if;
      end if;
    end loop;
    for entry in select left_over.value from jsonb_array_elements(pending) as left_over (value) loop
      if merged -> -1 ->> 'artwork_id' is distinct from entry ->> 'artwork_id' then
        merged := merged || jsonb_build_array(entry);
      elsif merged -> 0 ->> 'artwork_id' is distinct from entry ->> 'artwork_id' then
        merged := jsonb_build_array(entry) || merged;
      end if;
    end loop;
    items := merged;
  end if;

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

revoke all on function public.review_session(timestamptz, text, text, text, integer) from public, anon;
grant execute on function public.review_session(timestamptz, text, text, text, integer) to authenticated;
