create table public.note_links (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_artwork_id uuid,
  source_value_id uuid,
  source_era_code text,
  source_visit_id uuid,
  target_artwork_id uuid,
  target_value_id uuid,
  target_era_code text references public.eras (code),
  check (num_nonnulls(source_artwork_id, source_value_id, source_era_code, source_visit_id) = 1),
  check (num_nonnulls(target_artwork_id, target_value_id, target_era_code) = 1),
  constraint note_links_key unique nulls not distinct (
    owner_id, source_artwork_id, source_value_id, source_era_code, source_visit_id,
    target_artwork_id, target_value_id, target_era_code
  ),
  constraint note_links_source_artwork_fkey foreign key (source_artwork_id, owner_id)
    references public.artworks (id, owner_id) on delete cascade,
  constraint note_links_source_value_fkey foreign key (source_value_id, owner_id)
    references public.category_values (id, owner_id) on delete cascade,
  constraint note_links_source_era_fkey foreign key (owner_id, source_era_code)
    references public.era_details (owner_id, era_code) on delete cascade,
  constraint note_links_source_visit_fkey foreign key (source_visit_id, owner_id)
    references public.visits (id, owner_id) on delete cascade,
  constraint note_links_target_artwork_fkey foreign key (target_artwork_id, owner_id)
    references public.artworks (id, owner_id) on delete cascade,
  constraint note_links_target_value_fkey foreign key (target_value_id, owner_id)
    references public.category_values (id, owner_id) on delete cascade
);

create index note_links_source_artwork_idx on public.note_links (source_artwork_id)
  where source_artwork_id is not null;
create index note_links_source_value_idx on public.note_links (source_value_id)
  where source_value_id is not null;
create index note_links_source_era_idx on public.note_links (owner_id, source_era_code)
  where source_era_code is not null;
create index note_links_source_visit_idx on public.note_links (source_visit_id)
  where source_visit_id is not null;
create index note_links_target_artwork_idx on public.note_links (target_artwork_id)
  where target_artwork_id is not null;
create index note_links_target_value_idx on public.note_links (target_value_id)
  where target_value_id is not null;
create index note_links_target_era_idx on public.note_links (owner_id, target_era_code)
  where target_era_code is not null;

alter table public.note_links enable row level security;

create policy "Owners read their note links"
  on public.note_links for select to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.note_links from anon, authenticated;
grant select on public.note_links to authenticated;

create table private.note_link_failures (
  id bigint generated always as identity primary key,
  owner_id uuid references auth.users (id) on delete cascade,
  error_code text not null,
  message text not null,
  occurred_at timestamptz not null default now()
);

alter table private.note_link_failures enable row level security;

revoke all on private.note_link_failures from public, anon, authenticated;

create function private.note_link_targets(owner uuid, notes text)
returns table (target_artwork_id uuid, target_value_id uuid, target_era_code text)
language sql
volatile
set search_path = ''
as $$
  with artwork_numbers as (
    select distinct found[1]::integer as record_number
      from regexp_matches(notes, '\]\(/atelier/([0-9]{1,9})\)', 'g') as found
  ),
  value_links as (
    select distinct found[1] as kind,
      case
        when found[1] <> 'era'
          and found[2] ~ '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
        then found[2]::uuid
      end as value_id,
      case when found[1] = 'era' then found[2] end as era_code
      from regexp_matches(
        notes, '\]\(/atelier/values/(era|period|style|material|author|location)/([A-Za-z0-9_-]{1,64})\)', 'g'
      ) as found
  ),
  artwork_targets as (
    select artwork.id
      from public.artworks as artwork
      where artwork.owner_id = owner
        and artwork.record_number in (select artwork_numbers.record_number from artwork_numbers)
      for key share of artwork
  ),
  value_targets as (
    select value.id
      from public.category_values as value
      join value_links as link on link.value_id = value.id and link.kind = value.category_code
      where value.owner_id = owner
      for key share of value
  ),
  era_targets as (
    select era.code
      from public.eras as era
      where era.code in (select value_links.era_code from value_links where value_links.kind = 'era')
  ),
  targets as (
    select artwork_targets.id as artwork_id, null::uuid as value_id, null::text as era_code
      from artwork_targets
    union
    select null, value_targets.id, null from value_targets
    union
    select null, null, era_targets.code from era_targets
  )
  select targets.artwork_id, targets.value_id, targets.era_code
    from targets
    order by targets.artwork_id, targets.value_id, targets.era_code
    limit 200;
$$;

revoke all on function private.note_link_targets(uuid, text) from public, anon, authenticated;

create function private.replace_note_links(
  owner uuid, artwork uuid, value uuid, era text, visit uuid, notes text
)
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  delete from public.note_links as link
    where link.owner_id = owner
      and (
        link.source_artwork_id = artwork
        or link.source_value_id = value
        or link.source_era_code = era
        or link.source_visit_id = visit
      );
  if notes is not null and strpos(notes, '](/atelier/') > 0 then
    insert into public.note_links (
      owner_id, source_artwork_id, source_value_id, source_era_code, source_visit_id,
      target_artwork_id, target_value_id, target_era_code
    )
      select owner, artwork, value, era, visit, target.target_artwork_id, target.target_value_id, target.target_era_code
        from private.note_link_targets(owner, notes) as target;
  end if;
exception
  when others then
    insert into private.note_link_failures (owner_id, error_code, message) values (owner, sqlstate, sqlerrm);
end;
$$;

revoke all on function private.replace_note_links(uuid, uuid, uuid, text, uuid, text)
  from public, anon, authenticated;

create function private.note_links_from_notes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved record;
  notes text;
begin
  if coalesce(current_setting('study_atelier.importing', true), '') = 'on' then
    return null;
  end if;
  if tg_op = 'DELETE' then
    saved := old;
    notes := null;
  else
    saved := new;
    notes := new.notes;
  end if;
  case tg_argv[0]
    when 'artwork' then
      perform private.replace_note_links(saved.owner_id, saved.id, null, null, null, notes);
    when 'value' then
      perform private.replace_note_links(saved.owner_id, null, saved.value_id, null, null, notes);
    when 'era' then
      perform private.replace_note_links(saved.owner_id, null, null, saved.era_code, null, notes);
    when 'visit' then
      perform private.replace_note_links(saved.owner_id, null, null, null, saved.id, notes);
  end case;
  return null;
end;
$$;

revoke all on function private.note_links_from_notes() from public, anon, authenticated;

create trigger artworks_note_links_insert
  after insert on public.artworks
  for each row when (new.notes is not null)
  execute function private.note_links_from_notes('artwork');
create trigger artworks_note_links_update
  after update of notes on public.artworks
  for each row when (old.notes is distinct from new.notes)
  execute function private.note_links_from_notes('artwork');

create trigger visits_note_links_insert
  after insert on public.visits
  for each row when (new.notes is not null)
  execute function private.note_links_from_notes('visit');
create trigger visits_note_links_update
  after update of notes on public.visits
  for each row when (old.notes is distinct from new.notes)
  execute function private.note_links_from_notes('visit');

create trigger era_details_note_links_insert
  after insert on public.era_details
  for each row when (new.notes is not null)
  execute function private.note_links_from_notes('era');
create trigger era_details_note_links_update
  after update of notes on public.era_details
  for each row when (old.notes is distinct from new.notes)
  execute function private.note_links_from_notes('era');

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'period_details', 'style_details', 'material_details', 'author_details', 'location_details'
  ] loop
    execute format(
      'create trigger %I after insert on public.%I for each row when (new.notes is not null)'
        ' execute function private.note_links_from_notes(''value'')',
      table_name || '_note_links_insert', table_name
    );
    execute format(
      'create trigger %I after update of notes on public.%I for each row when (old.notes is distinct from new.notes)'
        ' execute function private.note_links_from_notes(''value'')',
      table_name || '_note_links_update', table_name
    );
    execute format(
      'create trigger %I after delete on public.%I for each row when (old.notes is not null)'
        ' execute function private.note_links_from_notes(''value'')',
      table_name || '_note_links_delete', table_name
    );
  end loop;
end;
$$;

create function private.rebuild_note_links(owner uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  source record;
begin
  delete from public.note_links as link where link.owner_id = owner;
  for source in
    select artwork.id as artwork, null::uuid as value, null::text as era, null::uuid as visit, artwork.notes
      from public.artworks as artwork where artwork.owner_id = owner and artwork.notes is not null
    union all
    select null, details.value_id, null, null, details.notes
      from public.period_details as details where details.owner_id = owner and details.notes is not null
    union all
    select null, details.value_id, null, null, details.notes
      from public.style_details as details where details.owner_id = owner and details.notes is not null
    union all
    select null, details.value_id, null, null, details.notes
      from public.material_details as details where details.owner_id = owner and details.notes is not null
    union all
    select null, details.value_id, null, null, details.notes
      from public.author_details as details where details.owner_id = owner and details.notes is not null
    union all
    select null, details.value_id, null, null, details.notes
      from public.location_details as details where details.owner_id = owner and details.notes is not null
    union all
    select null, null, details.era_code, null, details.notes
      from public.era_details as details where details.owner_id = owner and details.notes is not null
    union all
    select null, null, null, visit.id, visit.notes
      from public.visits as visit where visit.owner_id = owner and visit.notes is not null
  loop
    perform private.replace_note_links(owner, source.artwork, source.value, source.era, source.visit, source.notes);
  end loop;
end;
$$;

revoke all on function private.rebuild_note_links(uuid) from public, anon, authenticated;

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
    'artwork_field_entries', 'timeline_events', 'visits', 'visit_artworks', 'review_cards', 'review_log',
    'point_events', 'exhibit_tiers', 'free_review_days'
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

do $$
declare
  account record;
begin
  for account in select id from auth.users loop
    perform private.rebuild_note_links(account.id);
  end loop;
  if exists (select 1 from private.note_link_failures) then
    raise exception 'the note links of % notes could not be stored', (select count(*) from private.note_link_failures);
  end if;
end;
$$;
