create table public.symbols (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null
    check (name <> '' and name = btrim(name) and char_length(name) <= 120 and name !~ '[[:cntrl:]]'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create unique index symbols_name_key on public.symbols (owner_id, lower(name));

create trigger symbols_set_updated_at
  before update on public.symbols
  for each row execute function private.set_updated_at();

create trigger symbols_limit_rows
  after insert on public.symbols
  referencing new table as added
  for each statement execute function private.limit_rows('2000');

create table public.symbol_meanings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  symbol_id uuid not null,
  position smallint not null check (position between 0 and 9),
  text text not null
    check (text <> '' and text = btrim(text) and char_length(text) <= 200 and text !~ '[[:cntrl:]]'),
  foreign key (symbol_id, owner_id) references public.symbols (id, owner_id) on delete cascade,
  unique (id, owner_id),
  unique (id, symbol_id),
  unique (symbol_id, position) deferrable initially deferred
);

create table public.symbol_meaning_contexts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meaning_id uuid not null,
  position smallint not null check (position between 0 and 9),
  value_id uuid,
  era_code text references public.eras (code),
  artwork_id uuid,
  glossary_entry_id uuid,
  text text
    check (text <> '' and text = btrim(text) and char_length(text) <= 80 and text !~ '[[:cntrl:]]'),
  foreign key (meaning_id, owner_id) references public.symbol_meanings (id, owner_id) on delete cascade,
  foreign key (value_id, owner_id) references public.category_values (id, owner_id) on delete cascade,
  foreign key (artwork_id, owner_id) references public.artworks (id, owner_id) on delete cascade,
  foreign key (glossary_entry_id, owner_id) references public.glossary_entries (id, owner_id)
    on delete cascade,
  check (num_nonnulls(value_id, era_code, artwork_id, glossary_entry_id, text) = 1),
  unique (meaning_id, position) deferrable initially deferred
);

create index symbol_meaning_contexts_value_id_idx on public.symbol_meaning_contexts (value_id)
  where value_id is not null;
create index symbol_meaning_contexts_artwork_id_idx on public.symbol_meaning_contexts (artwork_id)
  where artwork_id is not null;
create index symbol_meaning_contexts_glossary_entry_id_idx
  on public.symbol_meaning_contexts (glossary_entry_id)
  where glossary_entry_id is not null;
create index symbol_meaning_contexts_era_code_idx on public.symbol_meaning_contexts (era_code)
  where era_code is not null;

alter table public.artwork_pins
  add column symbol_id uuid,
  add column symbol_meaning_id uuid,
  add foreign key (symbol_id, owner_id) references public.symbols (id, owner_id)
    on delete set null (symbol_id),
  add foreign key (symbol_meaning_id, symbol_id) references public.symbol_meanings (id, symbol_id)
    on delete set null (symbol_meaning_id),
  add check (symbol_meaning_id is null or symbol_id is not null);

create index artwork_pins_symbol_id_idx on public.artwork_pins (symbol_id)
  where symbol_id is not null;

alter table public.artwork_pins drop constraint artwork_pins_check;
alter table public.artwork_pins
  add constraint artwork_pins_check
  check (glossary_entry_id is not null or text is not null or view_width is not null or symbol_id is not null);

create or replace function private.drop_pins_left_without_text()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.artwork_pins
    where glossary_entry_id = old.id and text is null and view_width is null and symbol_id is null;
  return old;
end;
$$;

create function private.clear_symbol_from_pins()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.artwork_pins
    where symbol_id = old.id and glossary_entry_id is null and text is null and view_width is null;
  update public.artwork_pins
    set symbol_meaning_id = null, symbol_id = null
    where symbol_id = old.id;
  return old;
end;
$$;

revoke all on function private.clear_symbol_from_pins() from public, anon, authenticated;

create trigger symbols_clear_pins
  before delete on public.symbols
  for each row execute function private.clear_symbol_from_pins();

alter table public.symbols enable row level security;
alter table public.symbol_meanings enable row level security;
alter table public.symbol_meaning_contexts enable row level security;

create policy "Owners manage their symbols"
  on public.symbols for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage the meanings of their symbols"
  on public.symbol_meanings for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage the context labels of their meanings"
  on public.symbol_meaning_contexts for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.symbols, public.symbol_meanings, public.symbol_meaning_contexts
  from anon, authenticated;

grant select, delete on public.symbols, public.symbol_meanings, public.symbol_meaning_contexts
  to authenticated;
grant insert (name), update (name) on public.symbols to authenticated;
grant insert (symbol_id, position, text), update (position, text) on public.symbol_meanings
  to authenticated;
grant insert (meaning_id, position, value_id, era_code, artwork_id, glossary_entry_id, text)
  on public.symbol_meaning_contexts to authenticated;
grant update (value_id) on public.symbol_meaning_contexts to authenticated;

grant insert (symbol_id, symbol_meaning_id), update (symbol_id, symbol_meaning_id)
  on public.artwork_pins to authenticated;

create function public.save_symbol(new_name text, new_meanings jsonb, symbol_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid;
  meaning jsonb;
  meaning_index integer := 0;
  saved_meaning_id uuid;
  kept_ids uuid[];
  context jsonb;
  context_index integer;
begin
  if new_meanings is null or jsonb_typeof(new_meanings) <> 'array' then
    raise exception 'the meanings are not a list'
      using errcode = 'invalid_parameter_value';
  end if;
  if jsonb_array_length(new_meanings) > 10 then
    raise exception 'a symbol holds at most 10 meanings'
      using errcode = 'check_violation', hint = 'symbol_meanings';
  end if;

  if symbol_id is null then
    insert into public.symbols (name) values (btrim(coalesce(new_name, '')))
      returning id into saved_id;
  else
    update public.symbols as symbol
      set name = btrim(coalesce(new_name, ''))
      where symbol.id = save_symbol.symbol_id
      returning symbol.id into saved_id;
    if saved_id is null then
      raise exception 'symbol not found'
        using errcode = 'no_data_found';
    end if;
  end if;

  select coalesce(array_agg((item ->> 'id')::uuid), '{}')
    into kept_ids
    from jsonb_array_elements(new_meanings) as item
    where item ->> 'id' is not null;

  delete from public.symbol_meanings as old_meaning
    where old_meaning.symbol_id = saved_id
      and not (old_meaning.id = any (kept_ids));

  for meaning in select value from jsonb_array_elements(new_meanings) loop
    saved_meaning_id := null;
    if meaning ->> 'id' is not null then
      update public.symbol_meanings as kept
        set position = meaning_index, text = btrim(coalesce(meaning ->> 'text', ''))
        where kept.id = (meaning ->> 'id')::uuid and kept.symbol_id = saved_id
        returning kept.id into saved_meaning_id;
      if saved_meaning_id is null then
        raise exception 'meaning not found'
          using errcode = 'no_data_found';
      end if;
      delete from public.symbol_meaning_contexts as old_context
        where old_context.meaning_id = saved_meaning_id;
    else
      insert into public.symbol_meanings (symbol_id, position, text)
        values (saved_id, meaning_index, btrim(coalesce(meaning ->> 'text', '')))
        returning id into saved_meaning_id;
    end if;

    if jsonb_typeof(coalesce(meaning -> 'contexts', '[]')) <> 'array' then
      raise exception 'the context labels are not a list'
        using errcode = 'invalid_parameter_value';
    end if;
    if jsonb_array_length(coalesce(meaning -> 'contexts', '[]')) > 10 then
      raise exception 'a meaning holds at most 10 context labels'
        using errcode = 'check_violation', hint = 'symbol_meaning_contexts';
    end if;

    context_index := 0;
    for context in select value from jsonb_array_elements(coalesce(meaning -> 'contexts', '[]')) loop
      insert into public.symbol_meaning_contexts
        (meaning_id, position, value_id, era_code, artwork_id, glossary_entry_id, text)
        values (
          saved_meaning_id,
          context_index,
          (context ->> 'value_id')::uuid,
          context ->> 'era_code',
          (context ->> 'artwork_id')::uuid,
          (context ->> 'glossary_entry_id')::uuid,
          nullif(btrim(context ->> 'text'), '')
        );
      context_index := context_index + 1;
    end loop;

    meaning_index := meaning_index + 1;
  end loop;

  return saved_id;
end;
$$;

revoke all on function public.save_symbol(text, jsonb, uuid) from public, anon;
grant execute on function public.save_symbol(text, jsonb, uuid) to authenticated;

create function public.symbol_atlas()
returns table (
  id uuid,
  name text,
  created_at timestamptz,
  first_meaning text,
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
    (select meaning.text from public.symbol_meanings as meaning
      where meaning.symbol_id = symbol.id order by meaning.position limit 1),
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
        'image_width', image.image_width, 'image_height', image.image_height)
      from public.artwork_pins as pin
      join public.artwork_images as image on image.id = pin.image_id
      join public.artworks as artwork on artwork.id = image.artwork_id
      where pin.symbol_id = symbol.id and pin.view_width is not null and artwork.deleted_at is null
      order by pin.created_at desc, pin.id
      limit 1)
  from public.symbols as symbol
  order by lower(symbol.name), symbol.id;
$$;

revoke all on function public.symbol_atlas() from public, anon;
grant execute on function public.symbol_atlas() to authenticated;

create or replace function public.merge_category_values(merged_id uuid, kept_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  merged public.category_values;
  kept public.category_values;
  merged_path text;
  kept_path text;
begin
  select * into merged from public.category_values as value where value.id = merged_id;
  select * into kept from public.category_values as value where value.id = kept_id;

  if merged.id is null or kept.id is null then
    raise exception 'category value not found'
      using errcode = 'no_data_found';
  end if;

  if merged.id = kept.id or merged.category_code <> kept.category_code then
    raise exception 'only two different values of one category can be merged'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.artwork_values as link
    set value_id = kept_id
    where link.value_id = merged_id
      and not exists (
        select 1 from public.artwork_values as other
          where other.artwork_id = link.artwork_id and other.value_id = kept_id
      );

  update public.visits as visit
    set place_id = kept_id
    where visit.place_id = merged_id;

  update public.symbol_meaning_contexts as label
    set value_id = kept_id
    where label.value_id = merged_id
      and not exists (
        select 1 from public.symbol_meaning_contexts as other
          where other.meaning_id = label.meaning_id and other.value_id = kept_id
      );

  insert into public.period_eras (value_id, era_code)
    select kept_id, period_era.era_code
      from public.period_eras as period_era
      where period_era.value_id = merged_id
    on conflict do nothing;

  insert into public.style_periods (style_id, period_id)
    select kept_id, style_period.period_id
      from public.style_periods as style_period
      where style_period.style_id = merged_id
    on conflict do nothing;

  insert into public.style_periods (style_id, period_id)
    select style_period.style_id, kept_id
      from public.style_periods as style_period
      where style_period.period_id = merged_id
    on conflict do nothing;

  merged_path := '/atelier/values/' || merged.category_code || '/' || merged_id::text;
  kept_path := '/atelier/values/' || kept.category_code || '/' || kept_id::text;

  update public.artworks as artwork
    set notes = regexp_replace(artwork.notes, merged_path, kept_path, 'gi')
    where artwork.notes ~* merged_path;
  update public.period_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.style_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.material_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.author_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.location_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.era_details as details
    set notes = regexp_replace(details.notes, merged_path, kept_path, 'gi')
    where details.notes ~* merged_path;
  update public.visits as visit
    set notes = regexp_replace(visit.notes, merged_path, kept_path, 'gi')
    where visit.notes ~* merged_path;

  delete from public.category_values as value where value.id = merged_id;
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

  perform set_config('study_atelier.importing', '', true);

  perform private.rebuild_note_links(importer);

  if not had_points and not exists (select 1 from public.point_events where owner_id = importer) then
    perform private.fill_point_events(importer);
  end if;

  return counts;
end;
$$;
