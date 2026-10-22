alter table public.artwork_images add column id uuid not null default gen_random_uuid();

alter table public.artwork_images drop constraint artwork_images_pkey;
alter table public.artwork_images add primary key (id);
alter table public.artwork_images
  add constraint artwork_images_artwork_id_position_key unique (artwork_id, position)
  deferrable initially deferred;

alter table public.artwork_images drop constraint artwork_images_position_check;
alter table public.artwork_images add check (position between 0 and 4);

insert into public.artwork_images (
  artwork_id, owner_id, position, source_wikidata_id, source_image_file, source_image_licence,
  source_image_licence_url, source_image_attribution, own_image_path, own_image_url,
  image_width, image_height
)
  select id, owner_id, 0, source_wikidata_id, source_image_file, source_image_licence,
    source_image_licence_url, source_image_attribution, own_image_path, own_image_url,
    image_width, image_height
    from public.artworks
    where source_image_file is not null or own_image_path is not null or own_image_url is not null;

alter table public.artworks
  drop column source_wikidata_id,
  drop column source_image_file,
  drop column source_image_licence,
  drop column source_image_licence_url,
  drop column source_image_attribution,
  drop column own_image_path,
  drop column own_image_url,
  drop column image_width,
  drop column image_height;

grant update (
  position, source_wikidata_id, source_image_file, source_image_licence,
  source_image_licence_url, source_image_attribution, own_image_path, own_image_url,
  image_width, image_height
) on public.artwork_images to authenticated;

drop function public.save_artwork(jsonb, jsonb, uuid, jsonb, jsonb);

create function public.save_artwork(
  artwork jsonb,
  values_by_category jsonb,
  existing_id uuid default null,
  images jsonb default null,
  field_entries jsonb default null
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

  if field_entries is not null and jsonb_typeof(field_entries) is distinct from 'object' then
    raise exception 'field_entries must be an object of field values'
      using errcode = 'invalid_parameter_value';
  end if;

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
      title, author_unknown, year_from, year_to, year_approximate, type_code, era_code, notes
    )
    values (
      btrim(input.title), coalesce(input.author_unknown, false), input.year_from, input.year_to,
      coalesce(input.year_approximate, false), input.type_code, input.era_code, input.notes
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
        notes = input.notes
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
          image_width, image_height
        )
        values (
          saved.id, item.position, image.source_wikidata_id, image.source_image_file,
          image.source_image_licence, image.source_image_licence_url, image.source_image_attribution,
          image.own_image_path, image.own_image_url, image.image_width, image.image_height
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
    delete from public.artwork_field_entries where public.artwork_field_entries.artwork_id = saved.id;

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

  return query select saved.id, saved.record_number;
end;
$$;

revoke all on function public.save_artwork(jsonb, jsonb, uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_artwork(jsonb, jsonb, uuid, jsonb, jsonb) to authenticated;

create or replace function public.unused_images()
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  with used as (
    select own_image_path as path from public.artwork_images where own_image_path is not null
    union all
    select own_image_path from public.author_details where own_image_path is not null
  ),
  kept as (
    select path from used
    union
    select regexp_replace(path, '\.[^./]*$', '') || '-thumb.jpg' from used
  )
  select o.name
  from storage.objects o
  where o.bucket_id = 'artwork-images'
    and o.created_at < now() - interval '24 hours'
    and not exists (select 1 from kept k where k.path = o.name)
  order by o.created_at
  limit 1000;
$$;

create or replace function public.review_counts(day_start timestamptz)
returns table (due integer, new_available integer, new_today integer, with_image integer)
language sql
stable
security invoker
set search_path = ''
as $$
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
      where card.due < day_start + interval '1 day'),
    (select count(*)::integer
      from live
      where not exists (select 1 from public.review_cards as card where card.artwork_id = live.id)),
    (select count(*)::integer
      from public.review_cards as card
      where card.created_at >= day_start),
    (select count(*)::integer from live);
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

    quiz := null;
    foreach candidate in array modes loop
      if candidate = 'quiz_style' then
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
        items := items || jsonb_build_array(jsonb_build_object(
          'artwork_id', entry -> 'id', 'mode', candidate, 'options', quiz
        ));
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
