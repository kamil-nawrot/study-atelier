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

    if jsonb_array_length(picked) = 0 and jsonb_array_length(style_picks) = 0 then
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
  if target_facet in ('date', 'style') and not exists (
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

  if target_facet in ('date', 'style') then
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
