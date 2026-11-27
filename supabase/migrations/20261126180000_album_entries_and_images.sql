alter table public.artworks
  add column album_entry text
    check (album_entry ~ '^[a-z0-9]+(-[a-z0-9]+)*/[a-z0-9]+(-[a-z0-9]+)*$'),
  add column album_revision integer check (album_revision > 0),
  add check ((album_entry is null) = (album_revision is null));

create index artworks_album_entry_idx on public.artworks (owner_id, album_entry)
  where album_entry is not null;

grant insert (album_entry, album_revision), update (album_entry, album_revision)
  on public.artworks to authenticated;

alter table public.artwork_images
  add column album_image_path text
    check (
      album_image_path ~ '^[a-z0-9]+(-[a-z0-9]+)*/[a-z0-9][a-z0-9._/-]*$'
        and album_image_path !~ '\.\.'
    ),
  drop constraint artwork_images_check4,
  add check (
    source_image_file is not null or own_image_path is not null or own_image_url is not null
      or album_image_path is not null
  ),
  add check (
    album_image_path is null
      or (
        source_image_file is null and own_image_path is null and own_image_url is null
          and source_image_licence is not null
      )
  );

grant insert (album_image_path), update (album_image_path) on public.artwork_images to authenticated;

create or replace function private.forget_broken_state_of_changed_image()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.broken_at is not distinct from old.broken_at
    and (new.source_image_file, new.own_image_path, new.own_image_url, new.album_image_path)
      is distinct from
      (old.source_image_file, old.own_image_path, old.own_image_url, old.album_image_path)
  then
    new.broken_at := null;
  end if;
  return new;
end;
$$;

create or replace function private.forget_palette_of_changed_image()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.palette is not distinct from old.palette
    and (
      new.source_wikidata_id, new.source_image_file, new.own_image_path, new.own_image_url,
      new.album_image_path
    )
      is distinct from
      (
        old.source_wikidata_id, old.source_image_file, old.own_image_path, old.own_image_url,
        old.album_image_path
      )
  then
    new.palette := null;
  end if;
  return new;
end;
$$;

create or replace function public.save_artwork(
  artwork jsonb,
  values_by_category jsonb,
  existing_id uuid default null,
  images jsonb default null,
  field_entries jsonb default null,
  relations jsonb default null
)
returns table (id uuid, record_number integer)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  input public.artworks := jsonb_populate_record(null::public.artworks, artwork);
  saved public.artworks;
  author_count integer;
  item record;
  image public.artwork_images;
begin
  if images is not null and jsonb_typeof(images) is distinct from 'array' then
    raise exception 'images must be an array of images'
      using errcode = 'invalid_parameter_value';
  end if;

  if jsonb_array_length(coalesce(images, '[]'::jsonb)) > 5 then
    raise exception 'an artwork has at most five images'
      using errcode = 'check_violation';
  end if;

  if jsonb_typeof(values_by_category) is distinct from 'object' then
    raise exception 'values_by_category must be an object of name arrays'
      using errcode = 'invalid_parameter_value';
  end if;

  if relations is not null and jsonb_typeof(relations) is distinct from 'array' then
    raise exception 'relations must be an array of relations'
      using errcode = 'invalid_parameter_value';
  end if;

  if field_entries is not null and jsonb_typeof(field_entries) is distinct from 'object' then
    raise exception 'field_entries must be an object of field values'
      using errcode = 'invalid_parameter_value';
  end if;

  values_by_category := (
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
      from jsonb_each(values_by_category) as entry
      join public.categories as category on category.code = entry.key
  );

  select count(*)
    into author_count
    from jsonb_array_elements_text(coalesce(values_by_category -> 'author', '[]'::jsonb)) as item(name)
    where btrim(item.name) <> '';

  if coalesce(input.author_unknown, false) = (author_count > 0) then
    raise exception 'an artwork has authors or an unknown author, not both or neither'
      using errcode = 'check_violation';
  end if;

  if existing_id is null then
    insert into public.artworks (
      title, author_unknown, year_from, year_to, year_approximate, type_code, era_code, notes,
      album_entry, album_revision
    )
    values (
      btrim(input.title), coalesce(input.author_unknown, false), input.year_from, input.year_to,
      coalesce(input.year_approximate, false), input.type_code, input.era_code, input.notes,
      input.album_entry, input.album_revision
    )
    returning * into saved;
  else
    update public.artworks
      set title = btrim(input.title),
        author_unknown = coalesce(input.author_unknown, false),
        year_from = input.year_from,
        year_to = input.year_to,
        year_approximate = coalesce(input.year_approximate, false),
        type_code = input.type_code,
        era_code = input.era_code,
        notes = input.notes,
        album_entry = case when artwork ? 'album_entry' then input.album_entry else album_entry end,
        album_revision = case
          when artwork ? 'album_revision' then input.album_revision
          else album_revision
        end
      where public.artworks.id = existing_id
      returning * into saved;

    if saved.id is null then
      raise exception 'artwork % not found', existing_id
        using errcode = 'no_data_found';
    end if;

    delete from public.artwork_values as link
      using public.category_values as value
      where link.artwork_id = saved.id
        and value.id = link.value_id
        and value.category_code in (select jsonb_object_keys(values_by_category));
  end if;

  with created as (
    insert into public.category_values (category_code, name)
      select entry.key, btrim(item.name)
        from jsonb_each(values_by_category) as entry
        cross join jsonb_array_elements_text(entry.value) as item(name)
        where btrim(item.name) <> ''
      on conflict (owner_id, category_code, lower(name)) do nothing
      returning id, category_code, name
  )
  insert into public.location_details (value_id, country_code, place_type, catalogue_wikidata_id)
    select created.id, museum.country_code, 'museum', museum.wikidata_id
      from created
      join public.catalogue_museums as museum on lower(museum.name) = lower(created.name)
      where created.category_code = 'location';

  insert into public.artwork_values (artwork_id, value_id, position)
    select saved.id, value.id, (min(item.position) - 1)::smallint
      from jsonb_each(values_by_category) as entry
      cross join jsonb_array_elements_text(entry.value) with ordinality as item(name, position)
      join public.category_values as value
        on value.owner_id = saved.owner_id
        and value.category_code = entry.key
        and lower(value.name) = lower(btrim(item.name))
      group by value.id;

  if saved.era_code is not null then
    insert into public.period_eras (value_id, era_code)
      select period_value.id, saved.era_code
        from public.artwork_values as period_link
        join public.category_values as period_value on period_value.id = period_link.value_id
        where period_link.artwork_id = saved.id and period_value.category_code = 'period'
      on conflict do nothing;
  end if;

  insert into public.style_periods (style_id, period_id)
    select style_value.id, period_value.id
      from public.artwork_values as style_link
      join public.category_values as style_value
        on style_value.id = style_link.value_id and style_value.category_code = 'style'
      join public.artwork_values as period_link on period_link.artwork_id = style_link.artwork_id
      join public.category_values as period_value
        on period_value.id = period_link.value_id and period_value.category_code = 'period'
      where style_link.artwork_id = saved.id
    on conflict do nothing;

  if images is not null then
    delete from public.artwork_images as stored
      where stored.artwork_id = saved.id
        and stored.id not in (
          select (entry.value ->> 'id')::uuid
            from jsonb_array_elements(images) as entry(value)
            where entry.value ->> 'id' is not null
        );

    for item in
      select entry.value, (entry.position - 1)::smallint as position
        from jsonb_array_elements(images) with ordinality as entry(value, position)
    loop
      image := jsonb_populate_record(null::public.artwork_images, item.value);

      if image.id is null then
        insert into public.artwork_images (
          artwork_id, position, source_wikidata_id, source_image_file, source_image_licence,
          source_image_licence_url, source_image_attribution, own_image_path, own_image_url,
          album_image_path, image_width, image_height
        )
        values (
          saved.id, item.position, image.source_wikidata_id, image.source_image_file,
          image.source_image_licence, image.source_image_licence_url, image.source_image_attribution,
          image.own_image_path, image.own_image_url, image.album_image_path, image.image_width,
          image.image_height
        );
      else
        update public.artwork_images as stored
          set position = item.position,
            source_wikidata_id = image.source_wikidata_id,
            source_image_file = image.source_image_file,
            source_image_licence = image.source_image_licence,
            source_image_licence_url = image.source_image_licence_url,
            source_image_attribution = image.source_image_attribution,
            own_image_path = image.own_image_path,
            own_image_url = image.own_image_url,
            album_image_path = image.album_image_path,
            image_width = image.image_width,
            image_height = image.image_height
          where stored.id = image.id and stored.artwork_id = saved.id;

        if not found then
          raise exception 'image % not found on artwork %', image.id, saved.id
            using errcode = 'no_data_found';
        end if;
      end if;
    end loop;
  end if;

  if field_entries is not null then
    delete from public.artwork_field_entries as stored
      where stored.artwork_id = saved.id
        and stored.field_id::text in (select jsonb_object_keys(field_entries));

    insert into public.artwork_field_entries (artwork_id, field_id, field_kind, text_value)
      select saved.id, field.id, field.kind,
        case when field.kind = 'text' then btrim(entry.value #>> '{}') end
        from jsonb_each(field_entries) as entry
        join public.artwork_fields as field
          on field.id::text = entry.key and field.owner_id = saved.owner_id
        where (field.kind = 'flag' and entry.value = 'true'::jsonb)
          or (
            field.kind = 'text' and jsonb_typeof(entry.value) = 'string'
              and btrim(entry.value #>> '{}') <> ''
          );
  end if;

  if relations is not null then
    delete from public.artwork_relations as stored
      using public.artworks as other
      where saved.id in (stored.from_id, stored.to_id)
        and other.id = case when stored.from_id = saved.id then stored.to_id else stored.from_id end
        and other.deleted_at is null;

    insert into public.artwork_relations (from_id, to_id, kind)
      select
        case
          when item.kind in ('version', 'related') then least(saved.id, item.artwork_id)
          when item.side = 'from' then saved.id
          else item.artwork_id
        end,
        case
          when item.kind in ('version', 'related') then greatest(saved.id, item.artwork_id)
          when item.side = 'from' then item.artwork_id
          else saved.id
        end,
        item.kind
        from jsonb_to_recordset(relations) as item(kind text, side text, artwork_id uuid)
      on conflict ((least(from_id, to_id)), (greatest(from_id, to_id))) do nothing;
  end if;

  return query select saved.id, saved.record_number;
end;
$$;

revoke all on function public.save_artwork(jsonb, jsonb, uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_artwork(jsonb, jsonb, uuid, jsonb, jsonb, jsonb) to authenticated;

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
                'album_image_path', image.album_image_path,
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

create or replace function public.symbol_atlas()
returns table (
  id uuid,
  name text,
  created_at timestamptz,
  meaning_count integer,
  pin_count integer,
  cover jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    symbol.id,
    symbol.name,
    symbol.created_at,
    (select count(*)::integer from public.symbol_meanings as meaning
      where meaning.symbol_id = symbol.id),
    (select count(*)::integer from public.artwork_pins as pin
      join public.artwork_images as image on image.id = pin.image_id
      join public.artworks as artwork on artwork.id = image.artwork_id
      where pin.symbol_id = symbol.id and artwork.deleted_at is null),
    (select jsonb_build_object(
        'pin_id', pin.id, 'artwork_id', image.artwork_id, 'x', pin.x, 'y', pin.y,
        'view_width', pin.view_width, 'crop_path', pin.crop_path, 'image_id', image.id,
        'source_wikidata_id', image.source_wikidata_id, 'source_image_file', image.source_image_file,
        'source_image_licence', image.source_image_licence,
        'source_image_licence_url', image.source_image_licence_url,
        'source_image_attribution', image.source_image_attribution,
        'own_image_path', image.own_image_path, 'own_image_url', image.own_image_url,
        'album_image_path', image.album_image_path,
        'image_width', image.image_width, 'image_height', image.image_height)
      from public.artwork_pins as pin
      join public.artwork_images as image on image.id = pin.image_id
      join public.artworks as artwork on artwork.id = image.artwork_id
      where pin.symbol_id = symbol.id and pin.view_width is not null and artwork.deleted_at is null
      order by (pin.id = symbol.cover_pin_id) desc, pin.created_at desc, pin.id
      limit 1)
  from public.symbols as symbol
  order by lower(symbol.name), symbol.id;
$$;

revoke all on function public.symbol_atlas() from public, anon;
grant execute on function public.symbol_atlas() to authenticated;
