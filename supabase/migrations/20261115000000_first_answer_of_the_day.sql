alter table public.review_log
  add column practice boolean not null default false;

alter table public.review_cards
  add column last_rating smallint,
  add constraint review_cards_last_rating_check check (last_rating between 1 and 3);

grant insert (practice) on public.review_log to authenticated;
grant insert (last_rating) on public.review_cards to authenticated;
grant update (last_rating) on public.review_cards to authenticated;

create function private.fill_review_practice(owner uuid default null)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.review_log as entry
    set practice = true
    from (
      select later.id,
          row_number() over (
            partition by later.owner_id, later.artwork_id, later.facet,
              (later.reviewed_at at time zone 'UTC')::date
            order by later.reviewed_at, later.id
          ) as place
        from public.review_log as later
        where owner is null or later.owner_id = owner
    ) as ranked
    where ranked.id = entry.id and ranked.place > 1 and not entry.practice;

  update public.review_cards as card
    set last_rating = latest.rating
    from (
      select distinct on (scheduling.artwork_id, scheduling.facet)
          scheduling.artwork_id, scheduling.facet, scheduling.rating
        from public.review_log as scheduling
        where not scheduling.practice and (owner is null or scheduling.owner_id = owner)
        order by scheduling.artwork_id, scheduling.facet, scheduling.reviewed_at desc, scheduling.id desc
    ) as latest
    where latest.artwork_id = card.artwork_id and latest.facet = card.facet
      and (owner is null or card.owner_id = owner);
$$;

revoke all on function private.fill_review_practice(uuid) from public, anon, authenticated;

select private.fill_review_practice();

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

  select * into counts from public.review_counts(day_start);
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

create or replace function public.review_session(
  day_start timestamptz,
  session_form text default 'mixed',
  scope_kind text default 'all',
  scope_value text default null,
  free_round integer default null,
  time_questions boolean default false
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
  settled_stability constant double precision := 7;
  style_quiz_every constant integer := 3;
  typed_quiz_every constant integer := 3;
  settled_count integer := 0;
  review_state constant integer := 2;
  forgotten_state constant integer := 3;
  preferences record;
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
  min_order_gap constant integer := 30;
  order_size constant integer := 4;
  wanted integer;
  years jsonb := '[]';
  orders jsonb := '[]';
  extras jsonb;
  dated record;
  kept uuid[];
  kept_first integer[];
  kept_last integer[];
  shown uuid[];
  chronological uuid[];
  ordered uuid[] := '{}';
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

  select profile.review_session_size, profile.review_new_per_day, profile.review_quiz_kinds
    into preferences
    from public.profiles as profile;
  if found then
    session_size := preferences.review_session_size;
    new_per_day := preferences.review_new_per_day;
    quiz_kinds := preferences.review_quiz_kinds;
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

  if jsonb_array_length(facts) < min_artworks then
    return items;
  end if;

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
          case when card.last_rating = 1 then forgotten_state else card.state end as state,
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
            select count(*) from public.review_cards as card
              where card.facet = 'recognise' and card.created_at >= day_start
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
      modes := (array[
        'quiz_title', 'quiz_image', 'quiz_author', 'quiz_style', 'quiz_title', 'quiz_image', 'quiz_author'
      ])[slot % 4 + 1 : slot % 4 + 4];
    elsif entry ->> 'state' is null or (entry ->> 'state')::integer <> review_state then
      modes := (array['quiz_title', 'quiz_image', 'quiz_author', 'quiz_title', 'quiz_image'])
        [slot % 3 + 1 : slot % 3 + 3];
    elsif (entry ->> 'stability')::double precision < settled_stability
      and slot % style_quiz_every = style_quiz_every - 1 then
      modes := array['quiz_style'];
    else
      modes := '{}';
    end if;

    if session_form <> 'flashcards'
      and 'quiz_typed' = any (quiz_kinds)
      and (entry ->> 'state')::integer = review_state
      and (entry ->> 'stability')::double precision >= settled_stability then
      settled_count := settled_count + 1;
      if settled_count % typed_quiz_every = 0 then
        modes := array['quiz_typed'];
      end if;
    end if;

    if scope_kind = 'style' then
      modes := array_remove(modes, 'quiz_style');
    end if;

    if cardinality(modes) > 0 then
      modes := array(
        select listed.kind
          from unnest(modes) with ordinality as listed (kind, place)
          where listed.kind = any (quiz_kinds)
          order by listed.place
      );
      if cardinality(modes) = 0 then
        modes := array(
          select listed.kind
            from unnest(array['quiz_title', 'quiz_image', 'quiz_author', 'quiz_style'])
              with ordinality as listed (kind, place)
            where listed.kind = any (quiz_kinds)
              and not (listed.kind = 'quiz_style' and scope_kind = 'style')
            order by listed.place
        );
      end if;
    end if;

    if session_form <> 'flashcards' and 'quiz_pin' = any (quiz_kinds) and slot % 3 = 0 and exists (
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
            (case when other.styles && answer.styles then 4 else 0 end)
              + (case when other.period = answer.period then 2 else 0 end)
              + (case when other.type = answer.type then 2 else 0 end)
              + (case when other.era = answer.era then 1 else 0 end)
              + (case when abs(other.year - answer.year) <= 50 then 1 else 0 end)
              + (case when other.place = answer.place then 1 else 0 end) as score
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

  if not time_questions or jsonb_array_length(items) = 0 then
    return items;
  end if;

  wanted := 2 + floor(random() * 3)::integer;

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
      left join public.review_cards as card on card.artwork_id = pool.id and card.facet = 'date'
      where pool.last_year >= eras.first_year
        and pool.first_year <= eras.last_year
        and exists (
          select 1 from public.review_cards as known
            where known.artwork_id = pool.id and known.facet = 'recognise'
        )
        and not exists (
          select 1 from jsonb_array_elements(items) as asked
            where asked.value ->> 'artwork_id' = pool.id::text
        )
        and (free_round is not null or card.artwork_id is null or card.due < day_start + interval '1 day')
  ),
  ranked as (
    select candidates.*,
        row_number() over (
          order by (free_round is null and candidates.due is not null) desc, candidates.due, candidates.draw
        ) as rank
      from candidates
  )
  select coalesce(jsonb_agg(
      jsonb_build_object('artwork_id', ranked.id, 'mode', 'year', 'card', ranked.card) order by ranked.rank
    ), '[]')
    into years
    from ranked
    where ranked.rank <= wanted;

  while jsonb_array_length(orders) < 2 loop
    exit when jsonb_array_length(orders) = 1
      and jsonb_array_length(years) + 1 >= wanted;
    kept := '{}';
    kept_first := '{}';
    kept_last := '{}';
    for dated in
      select pool.id, pool.first_year, pool.last_year
        from jsonb_to_recordset(facts) as pool (id uuid, first_year integer, last_year integer)
        where pool.first_year is not null and not pool.id = any (ordered)
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
    exit when cardinality(kept) < order_size;

    select array_agg(listed.id order by random()), array_agg(listed.id order by listed.first_year)
      into shown, chronological
      from unnest(kept, kept_first) as listed (id, first_year);
    if shown = chronological then
      shown := array[shown[2], shown[1]] || shown[3:];
    end if;

    ordered := ordered || shown;
    orders := orders || jsonb_build_array(jsonb_build_object('mode', 'order', 'artwork_ids', to_jsonb(shown)));
  end loop;

  extras := (
    select coalesce(jsonb_agg(extra.value), '[]')
      from (
        select years.value
          from jsonb_array_elements(years) with ordinality as years (value, place)
          where years.place <= wanted - jsonb_array_length(orders)
        union all
        select orders.value from jsonb_array_elements(orders) as orders (value)
      ) as extra
  );

  return items || extras;
end;
$$;

create or replace function public.collection_statistics()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with
    live as (
      select artwork.id, artwork.record_number,
        (artwork.created_at at time zone 'Europe/Warsaw')::date as added_on
      from public.artworks as artwork
      where artwork.deleted_at is null
    ),
    today as (
      select (now() at time zone 'Europe/Warsaw')::date as day
    ),
    span as (
      select min(live.added_on) as first_day,
        case
          when today.day - min(live.added_on) < 30 then 'day'
          when date_trunc('week', today.day) - date_trunc('week', min(live.added_on)) < interval '26 weeks' then 'week'
          else 'month'
        end as unit
      from live, today
      group by today.day
    ),
    buckets as (
      select bucket::date as start
      from span, today,
        generate_series(
          date_trunc(span.unit, span.first_day::timestamp),
          date_trunc(span.unit, today.day::timestamp),
          ('1 ' || span.unit)::interval
        ) as bucket
    ),
    added as (
      select date_trunc(span.unit, live.added_on::timestamp)::date as start, count(*) as added
      from live, span
      group by 1
    ),
    growth as (
      select buckets.start, coalesce(added.added, 0) as added
      from buckets
      left join added on added.start = buckets.start
    ),
    answers as (
      select count(*) filter (where entry.correct is not null) as quiz_answers,
        count(*) filter (where entry.correct) as correct_answers
      from public.review_log as entry
      join live on live.id = entry.artwork_id
      where not entry.practice
    ),
    reviewed as (
      select entry.artwork_id, count(*) as times, live.record_number
      from public.review_log as entry
      join live on live.id = entry.artwork_id
      where not entry.practice
      group by entry.artwork_id, live.record_number
      having count(*) >= 3
      order by count(*) desc, live.record_number
      limit 5
    ),
    authors as (
      select author.id, author.name, details.birth_year, details.death_year, details.years_approximate,
        details.death_year - details.birth_year
          - case when details.birth_year < 0 and details.death_year > 0 then 1 else 0 end as lifespan,
        count(distinct live.id) as artworks,
        coalesce(details.sort_name, author.name) as sort_key
      from public.category_values as author
      join public.author_details as details on details.value_id = author.id
      join public.artwork_values as link on link.value_id = author.id
      join live on live.id = link.artwork_id
      where author.category_code = 'author'
        and details.birth_year is not null
        and details.death_year is not null
      group by author.id, details.value_id
    ),
    longest_lived as (
      select authors.*, count(*) over (partition by authors.lifespan) - 1 as tied
      from authors
      order by authors.lifespan desc, authors.artworks desc, authors.sort_key
      limit 1
    ),
    pinned as (
      select live.id, live.record_number, count(*) as pins
      from public.artwork_pins as pin
      join public.artwork_images as image on image.id = pin.image_id
      join live on live.id = image.artwork_id
      group by live.id, live.record_number
    ),
    most_pinned as (
      select pinned.*, count(*) over (partition by pinned.pins) - 1 as tied
      from pinned
      order by pinned.pins desc, pinned.record_number
      limit 1
    ),
    visit_sizes as (
      select visit.id, place.name as place, visit.visited_on, visit.date_precision,
        count(*) as artworks
      from public.visits as visit
      join public.category_values as place on place.id = visit.place_id
      join public.visit_artworks as seen on seen.visit_id = visit.id
      join live on live.id = seen.artwork_id
      where visit.kind = 'visit'
      group by visit.id, place.name
    ),
    largest_visit as (
      select visit_sizes.*, count(*) over (partition by visit_sizes.artworks) - 1 as tied
      from visit_sizes
      order by visit_sizes.artworks desc, visit_sizes.visited_on, visit_sizes.id
      limit 1
    )
  select jsonb_build_object(
    'terms', (select count(*) from public.glossary_entries),
    'events', (select count(*) from public.timeline_events),
    'visits', (select count(*) from public.visits where kind = 'visit'),
    'trips', (select count(*) from public.visits where kind = 'trip'),
    'exhibitions', (select count(*) from public.exhibitions where deleted_at is null),
    'quiz_answers', (select quiz_answers from answers),
    'correct_answers', (select correct_answers from answers),
    'most_reviewed', coalesce(
      (select jsonb_agg(jsonb_build_object('artwork_id', artwork_id, 'times', times)
        order by times desc, record_number) from reviewed),
      '[]'::jsonb
    ),
    'growth', (
      select jsonb_build_object(
        'unit', span.unit,
        'first_day', span.first_day,
        'buckets', (select jsonb_agg(jsonb_build_object('start', start, 'added', added) order by start) from growth)
      )
      from span
    ),
    'authors_with_years', (select count(*) from authors),
    'longest_lived', (
      select jsonb_build_object('value_id', id, 'name', name, 'birth_year', birth_year,
        'death_year', death_year, 'years_approximate', years_approximate, 'tied', tied)
      from longest_lived
    ),
    'most_pinned', (
      select jsonb_build_object('artwork_id', id, 'pins', pins, 'tied', tied) from most_pinned
    ),
    'largest_visit', (
      select jsonb_build_object('visit_id', id, 'place', place, 'visited_on', visited_on,
        'date_precision', date_precision, 'artworks', artworks, 'tied', tied)
      from largest_visit
    )
  );
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
    'artwork_field_entries', 'symbol_meaning_contexts', 'timeline_events', 'visits', 'visit_artworks', 'exhibitions', 'review_cards',
    'review_log', 'point_events', 'exhibit_tiers', 'free_review_days'
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
