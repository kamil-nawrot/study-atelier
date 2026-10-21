create table public.artwork_fields (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (
    name <> '' and name = btrim(name) and char_length(name) <= 60 and name !~ '[[:cntrl:]]'
  ),
  description text check (
    description <> '' and description = btrim(description) and char_length(description) <= 150
      and description !~ '[[:cntrl:]]'
  ),
  kind text not null check (kind in ('text', 'list', 'flag')),
  multiple boolean not null default false,
  position smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  unique (id, owner_id, kind),
  unique (owner_id, position) deferrable initially deferred,
  check (kind = 'list' or not multiple)
);

create unique index artwork_fields_name_key on public.artwork_fields (owner_id, lower(name));

alter table public.categories
  add column owner_id uuid references auth.users (id) on delete cascade,
  add column field_id uuid unique,
  alter column position drop not null,
  drop constraint categories_position_key,
  add constraint categories_field_fkey
    foreign key (field_id, owner_id) references public.artwork_fields (id, owner_id) on delete cascade,
  add constraint categories_field_check check (
    (field_id is null and owner_id is null and position is not null)
      or (field_id is not null and owner_id is not null and position is null and code = field_id::text)
  );

create unique index categories_position_key on public.categories (position) where field_id is null;

alter table public.category_values
  drop constraint category_values_category_code_fkey,
  add constraint category_values_category_code_fkey
    foreign key (category_code) references public.categories (code) on delete cascade;

create table public.artwork_field_entries (
  artwork_id uuid not null,
  field_id uuid not null,
  owner_id uuid not null default auth.uid(),
  field_kind text not null check (field_kind in ('text', 'flag')),
  text_value text check (
    text_value <> '' and text_value = btrim(text_value) and char_length(text_value) <= 200
      and text_value !~ '[[:cntrl:]]'
  ),
  primary key (artwork_id, field_id),
  foreign key (artwork_id, owner_id) references public.artworks (id, owner_id) on delete cascade,
  foreign key (field_id, owner_id, field_kind)
    references public.artwork_fields (id, owner_id, kind) on delete cascade,
  check ((field_kind = 'text') = (text_value is not null))
);

create index artwork_field_entries_field_id_idx on public.artwork_field_entries (field_id);

create function private.place_artwork_field_last()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select coalesce(max(field.position), 0) + 1
    into new.position
    from public.artwork_fields as field
    where field.owner_id = new.owner_id;
  return new;
end;
$$;

create function private.create_field_category()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (code, multiple, owner_id, field_id)
    values (new.id::text, new.multiple, new.owner_id, new.id);
  return new;
end;
$$;

create function private.check_value_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.categories as category
      where category.code = new.category_code
        and (category.owner_id is null or category.owner_id = new.owner_id)
  ) then
    raise exception 'category % does not belong to the owner of the value', new.category_code
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger artwork_fields_place_last
  before insert on public.artwork_fields
  for each row execute function private.place_artwork_field_last();

create trigger artwork_fields_create_category
  after insert on public.artwork_fields
  for each row when (new.kind = 'list') execute function private.create_field_category();

create trigger artwork_fields_set_updated_at
  before update on public.artwork_fields
  for each row execute function private.set_updated_at();

create trigger category_values_check_category
  before insert or update of category_code, owner_id on public.category_values
  for each row execute function private.check_value_category();

revoke all on function private.place_artwork_field_last() from public;
revoke all on function private.create_field_category() from public;
revoke all on function private.check_value_category() from public;

alter table public.artwork_fields enable row level security;
alter table public.artwork_field_entries enable row level security;

drop policy "Signed-in users read categories" on public.categories;

create policy "Signed-in users read the shared categories and their own"
  on public.categories for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));

create policy "Owners manage their artwork fields"
  on public.artwork_fields for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage the field entries of their artworks"
  on public.artwork_field_entries for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.artwork_fields, public.artwork_field_entries from anon, authenticated;
grant select, delete on public.artwork_fields to authenticated;
grant insert (name, description, kind, multiple) on public.artwork_fields to authenticated;
grant update (name, description, position) on public.artwork_fields to authenticated;
grant select, delete on public.artwork_field_entries to authenticated;
grant insert (artwork_id, field_id, field_kind, text_value) on public.artwork_field_entries to authenticated;

create function public.move_artwork_field(target_field uuid, direction integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  moved public.artwork_fields;
  neighbour public.artwork_fields;
begin
  if direction is null or direction not in (-1, 1) then
    raise exception 'a field moves one place up (-1) or down (1)'
      using errcode = 'invalid_parameter_value';
  end if;

  select * into moved from public.artwork_fields as field where field.id = target_field;
  if moved.id is null then
    raise exception 'artwork field not found'
      using errcode = 'no_data_found';
  end if;

  select * into neighbour
    from public.artwork_fields as field
    where field.owner_id = moved.owner_id
      and sign(field.position - moved.position) = direction
    order by field.position * direction
    limit 1;

  if neighbour.id is null then
    return;
  end if;

  update public.artwork_fields as field
    set position = case when field.id = moved.id then neighbour.position else moved.position end
    where field.id in (moved.id, neighbour.id);
end;
$$;

create function public.artwork_field_usage()
returns table (field_id uuid, artwork_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select field.id,
    case
      when field.kind = 'list' then (
        select count(distinct link.artwork_id)
          from public.artwork_values as link
          join public.category_values as value on value.id = link.value_id
          where value.category_code = field.id::text
      )
      else (
        select count(*) from public.artwork_field_entries as entry where entry.field_id = field.id
      )
    end::integer
    from public.artwork_fields as field
    order by field.position;
$$;

revoke all on function public.move_artwork_field(uuid, integer) from public, anon;
revoke all on function public.artwork_field_usage() from public, anon;
grant execute on function public.move_artwork_field(uuid, integer) to authenticated;
grant execute on function public.artwork_field_usage() to authenticated;

drop function public.save_artwork(jsonb, jsonb, uuid, jsonb);

create function public.save_artwork(
  artwork jsonb,
  values_by_category jsonb,
  existing_id uuid default null,
  extra_images jsonb default null,
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
begin
  if extra_images is not null and jsonb_typeof(extra_images) is distinct from 'array' then
    raise exception 'extra_images must be an array of images'
      using errcode = 'invalid_parameter_value';
  end if;

  if jsonb_array_length(coalesce(extra_images, '[]'::jsonb)) > 4 then
    raise exception 'an artwork has at most four images besides the main one'
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
      title, author_unknown, year_from, year_to, year_approximate, type_code, era_code, notes,
      source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
      source_image_attribution, own_image_path, own_image_url,
      image_width, image_height
    )
    values (
      btrim(input.title), coalesce(input.author_unknown, false), input.year_from, input.year_to,
      coalesce(input.year_approximate, false), input.type_code, input.era_code, input.notes,
      input.source_wikidata_id, input.source_image_file, input.source_image_licence,
      input.source_image_licence_url, input.source_image_attribution, input.own_image_path,
      input.own_image_url, input.image_width, input.image_height
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
        source_wikidata_id = input.source_wikidata_id,
        source_image_file = input.source_image_file,
        source_image_licence = input.source_image_licence,
        source_image_licence_url = input.source_image_licence_url,
        source_image_attribution = input.source_image_attribution,
        own_image_path = input.own_image_path,
        own_image_url = input.own_image_url,
        image_width = input.image_width,
        image_height = input.image_height
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

  if extra_images is not null then
    delete from public.artwork_images where public.artwork_images.artwork_id = saved.id;

    insert into public.artwork_images (
      artwork_id, position, source_wikidata_id, source_image_file, source_image_licence,
      source_image_licence_url, source_image_attribution, own_image_path, own_image_url,
      image_width, image_height
    )
      select saved.id, item.position::smallint, image.source_wikidata_id, image.source_image_file,
        image.source_image_licence, image.source_image_licence_url, image.source_image_attribution,
        image.own_image_path, image.own_image_url, image.image_width, image.image_height
        from jsonb_array_elements(extra_images) with ordinality as item(value, position)
        cross join lateral jsonb_populate_record(null::public.artwork_images, item.value) as image;
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
