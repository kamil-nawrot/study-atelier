create table public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  document jsonb not null default '{"type": "doc", "content": []}',
  format smallint not null default 1 check (format = 1),
  revision integer not null default 1 check (revision >= 1),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  check (octet_length(document::text) <= 524288)
);

create index exhibitions_owner_updated_at_idx on public.exhibitions (owner_id, updated_at desc);

create trigger exhibitions_set_updated_at
  before update on public.exhibitions
  for each row execute function private.set_updated_at();

create table public.exhibition_artworks (
  exhibition_id uuid not null,
  artwork_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position smallint not null check (position >= 0),
  primary key (exhibition_id, artwork_id),
  foreign key (exhibition_id, owner_id) references public.exhibitions (id, owner_id) on delete cascade,
  foreign key (artwork_id, owner_id) references public.artworks (id, owner_id) on delete cascade
);

create index exhibition_artworks_artwork_id_idx on public.exhibition_artworks (artwork_id);
create index exhibition_artworks_owner_id_idx on public.exhibition_artworks (owner_id);

alter table public.exhibitions enable row level security;
alter table public.exhibition_artworks enable row level security;

create policy "Owners manage their exhibitions"
  on public.exhibitions for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners read the artworks of their exhibitions"
  on public.exhibition_artworks for select to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.exhibitions, public.exhibition_artworks from anon, authenticated;

grant select, delete on public.exhibitions to authenticated;
grant insert (id, title, document, revision) on public.exhibitions to authenticated;
grant update (title, document, revision, deleted_at) on public.exhibitions to authenticated;

grant select on public.exhibition_artworks to authenticated;

create function private.exhibition_children()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "doc": ["textBlock", "heading", "quote", "artwork"],
    "textBlock": ["paragraph", "bulletList", "orderedList"],
    "bulletList": ["listItem"],
    "orderedList": ["listItem"],
    "listItem": ["paragraph", "bulletList", "orderedList"],
    "paragraph": ["text"],
    "heading": ["text"],
    "quote": ["paragraph"],
    "artwork": ["text"],
    "text": [],
    "bold": [],
    "italic": []
  }'::jsonb;
$$;

create function private.exhibition_attributes()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "doc": [],
    "textBlock": [],
    "bulletList": [],
    "orderedList": ["start", "type"],
    "listItem": [],
    "paragraph": [],
    "heading": ["level"],
    "quote": [],
    "artwork": ["artworkId", "imageId", "palette", "paletteOnly", "note"],
    "text": [],
    "bold": [],
    "italic": []
  }'::jsonb;
$$;

revoke all on function private.exhibition_children() from public;
revoke all on function private.exhibition_attributes() from public;

create function private.validate_exhibition_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  children constant jsonb := private.exhibition_children();
  attributes constant jsonb := private.exhibition_attributes();
  node jsonb;
  node_type text;
  child jsonb;
  artwork_ids text[];
begin
  if jsonb_typeof(new.document) is distinct from 'object' or new.document ->> 'type' is distinct from 'doc' then
    raise exception 'the document of an exhibition is a doc node'
      using errcode = 'check_violation', hint = 'exhibition_document';
  end if;

  for node in
    select value from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && exists(@.type))') as value
  loop
    node_type := node ->> 'type';
    if jsonb_typeof(node -> 'type') <> 'string' or not children ? node_type then
      raise exception 'an exhibition has no node of this kind'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if exists (
      select 1 from jsonb_object_keys(node) as key where key not in ('type', 'attrs', 'content', 'text', 'marks')
    ) then
      raise exception 'an exhibition node has a key it does not know'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node ? 'attrs' and (
      jsonb_typeof(node -> 'attrs') <> 'object'
      or exists (
        select 1 from jsonb_object_keys(node -> 'attrs') as key
          where not (attributes -> node_type) ? key
      )
    ) then
      raise exception 'an exhibition node has an attribute it does not know'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node ? 'content' then
      if jsonb_typeof(node -> 'content') <> 'array' then
        raise exception 'the content of an exhibition node is a list'
          using errcode = 'check_violation', hint = 'exhibition_document';
      end if;
      for child in select value from jsonb_array_elements(node -> 'content') loop
        if jsonb_typeof(child) <> 'object' or not (children -> node_type) ? (child ->> 'type') then
          raise exception 'an exhibition node holds a node it may not hold'
            using errcode = 'check_violation', hint = 'exhibition_document';
        end if;
      end loop;
    end if;
    if node_type = 'text' and jsonb_typeof(node -> 'text') is distinct from 'string' then
      raise exception 'a text node of an exhibition has no text'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'heading' and node -> 'attrs' ->> 'level' is distinct from '2' then
      raise exception 'a heading of an exhibition is of level 2'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'artwork' then
      if node -> 'attrs' ->> 'artworkId' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or coalesce(node -> 'attrs' ->> 'imageId', '00000000-0000-0000-0000-000000000000')
          !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then
        raise exception 'an artwork block of an exhibition needs the id of an artwork'
          using errcode = 'check_violation', hint = 'exhibition_document';
      end if;
    end if;
  end loop;

  if (
    select count(*)
      from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && exists(@.type))') as value
      where value ->> 'type' in ('textBlock', 'heading', 'quote', 'artwork', 'closeUp')
  ) > 300 then
    raise exception 'an exhibition holds at most 300 blocks'
      using errcode = 'configuration_limit_exceeded', hint = 'exhibition_blocks';
  end if;

  select array_agg(distinct (value #>> '{}')) into artwork_ids
    from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && exists(@.artworkId)).artworkId') as value;
  if coalesce(array_length(artwork_ids, 1), 0) > 100 then
    raise exception 'an exhibition holds at most 100 artworks'
      using errcode = 'configuration_limit_exceeded', hint = 'exhibition_artworks';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_exhibition_document() from public;

create trigger exhibitions_validate_document
  before insert or update of document on public.exhibitions
  for each row execute function private.validate_exhibition_document();

create function private.sync_exhibition_artworks(target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.exhibitions;
begin
  select * into saved from public.exhibitions where id = target_id;

  delete from public.exhibition_artworks where exhibition_id = target_id;
  if saved.id is null then
    return;
  end if;

  insert into public.exhibition_artworks (exhibition_id, artwork_id, owner_id, position)
    select saved.id, found.artwork_id, saved.owner_id, (row_number() over (order by found.first_seen) - 1)::smallint
      from (
        select (mention.value #>> '{}')::uuid as artwork_id, min(mention.ordinality) as first_seen
          from jsonb_path_query(saved.document, 'strict $.** ? (@.type() == "object" && exists(@.artworkId)).artworkId')
            with ordinality as mention(value, ordinality)
          group by 1
      ) as found
      join public.artworks as artwork
        on artwork.id = found.artwork_id and artwork.owner_id = saved.owner_id;
end;
$$;

revoke all on function private.sync_exhibition_artworks(uuid) from public;

create function private.sync_exhibition_artworks_after_save()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.sync_exhibition_artworks(new.id);
  return null;
end;
$$;

revoke all on function private.sync_exhibition_artworks_after_save() from public;

create trigger exhibitions_sync_artworks
  after insert or update of document on public.exhibitions
  for each row execute function private.sync_exhibition_artworks_after_save();

create function public.save_exhibition(
  exhibition_id uuid,
  new_title text,
  new_document jsonb,
  expected_revision integer default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_revision integer;
begin
  if expected_revision is null then
    insert into public.exhibitions (id, title, document)
      values (exhibition_id, btrim(coalesce(new_title, '')), new_document)
      returning revision into saved_revision;
    return saved_revision;
  end if;

  update public.exhibitions as saved
    set title = btrim(coalesce(new_title, '')),
      document = new_document,
      revision = saved.revision + 1
    where saved.id = exhibition_id
      and saved.revision = expected_revision
      and saved.deleted_at is null
    returning saved.revision into saved_revision;

  if saved_revision is null then
    if exists (select 1 from public.exhibitions as other where other.id = exhibition_id and other.deleted_at is null) then
      raise exception 'the exhibition was saved by another window'
        using errcode = 'serialization_failure', hint = 'exhibition_revision';
    end if;
    raise exception 'exhibition not found'
      using errcode = 'no_data_found';
  end if;

  return saved_revision;
end;
$$;

revoke all on function public.save_exhibition(uuid, text, jsonb, integer) from public, anon;
grant execute on function public.save_exhibition(uuid, text, jsonb, integer) to authenticated;

create trigger exhibitions_limit_rows
  after insert on public.exhibitions
  referencing new table as added
  for each statement execute function private.limit_rows('200');

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
    'artworks', 'artwork_images', 'glossary_entries', 'artwork_pins', 'artwork_fields',
    'category_values', 'artwork_values', 'period_eras', 'style_periods', 'author_details',
    'period_details', 'style_details', 'material_details', 'location_details', 'era_details',
    'artwork_field_entries', 'timeline_events', 'visits', 'visit_artworks', 'exhibitions', 'review_cards',
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
