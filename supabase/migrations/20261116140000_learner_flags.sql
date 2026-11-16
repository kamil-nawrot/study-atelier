alter table public.artwork_images add unique (id, artwork_id);

create table public.learner_flags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  artwork_id uuid,
  term_id uuid,
  symbol_id uuid,
  image_id uuid,
  pin_id uuid,
  reason text not null
    check (reason in ('image', 'pin', 'data', 'note', 'hidden', 'definition', 'meaning', 'answers', 'other')),
  comment text
    check (comment <> '' and comment = btrim(comment) and char_length(comment) <= 200),
  question jsonb check (jsonb_typeof(question) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (artwork_id, owner_id) references public.artworks (id, owner_id) on delete cascade,
  foreign key (term_id, owner_id) references public.glossary_entries (id, owner_id) on delete cascade,
  foreign key (symbol_id, owner_id) references public.symbols (id, owner_id) on delete cascade,
  foreign key (image_id, artwork_id) references public.artwork_images (id, artwork_id)
    on delete set null (image_id),
  foreign key (pin_id, owner_id) references public.artwork_pins (id, owner_id) on delete set null (pin_id),
  check (num_nonnulls(artwork_id, term_id, symbol_id) = 1),
  check (artwork_id is not null or (image_id is null and pin_id is null)),
  check (reason <> 'other' or comment is not null)
);

create index learner_flags_owner_id_idx on public.learner_flags (owner_id, created_at);
create index learner_flags_artwork_id_idx on public.learner_flags (artwork_id) where artwork_id is not null;
create index learner_flags_term_id_idx on public.learner_flags (term_id) where term_id is not null;
create index learner_flags_symbol_id_idx on public.learner_flags (symbol_id) where symbol_id is not null;
create index learner_flags_image_id_idx on public.learner_flags (image_id) where image_id is not null;
create index learner_flags_pin_id_idx on public.learner_flags (pin_id) where pin_id is not null;

create trigger learner_flags_set_updated_at
  before update on public.learner_flags
  for each row execute function private.set_updated_at();

create trigger learner_flags_limit_rows
  after insert on public.learner_flags
  referencing new table as added
  for each statement execute function private.limit_rows('5000');

alter table public.learner_flags enable row level security;

create policy "Owners manage their flags"
  on public.learner_flags for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.learner_flags from anon, authenticated;

grant select, delete on public.learner_flags to authenticated;
grant insert (artwork_id, term_id, symbol_id, image_id, pin_id, reason, comment, question),
  update (comment, question)
  on public.learner_flags to authenticated;

create function public.save_flag(flag jsonb)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  input public.learner_flags := jsonb_populate_record(null::public.learner_flags, flag);
  existing uuid;
begin
  if input.pin_id is not null and not exists (
    select 1
      from public.artwork_pins as pin
      join public.artwork_images as image on image.id = pin.image_id
      where pin.id = input.pin_id
        and image.artwork_id = input.artwork_id
        and image.id is not distinct from coalesce(input.image_id, image.id)
  ) then
    raise exception 'pin % is not on artwork %', input.pin_id, input.artwork_id
      using errcode = 'foreign_key_violation';
  end if;

  select stored.id
    into existing
    from public.learner_flags as stored
    where stored.owner_id = (select auth.uid())
      and stored.artwork_id is not distinct from input.artwork_id
      and stored.term_id is not distinct from input.term_id
      and stored.symbol_id is not distinct from input.symbol_id
      and stored.image_id is not distinct from input.image_id
      and stored.pin_id is not distinct from input.pin_id
      and stored.reason = input.reason
    order by stored.created_at
    limit 1
    for update;

  if existing is not null then
    update public.learner_flags
      set comment = nullif(btrim(input.comment), ''),
        question = coalesce(input.question, question)
      where id = existing;
    return false;
  end if;

  insert into public.learner_flags (artwork_id, term_id, symbol_id, image_id, pin_id, reason, comment, question)
    values (
      input.artwork_id, input.term_id, input.symbol_id, input.image_id, input.pin_id, input.reason,
      nullif(btrim(input.comment), ''), input.question
    );
  return true;
end;
$$;

revoke all on function public.save_flag(jsonb) from public, anon;
grant execute on function public.save_flag(jsonb) to authenticated;

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

  perform set_config('study_atelier.importing', '', true);

  perform private.rebuild_note_links(importer);

  if not had_points and not exists (select 1 from public.point_events where owner_id = importer) then
    perform private.fill_point_events(importer);
  end if;

  return counts;
end;
$$;
