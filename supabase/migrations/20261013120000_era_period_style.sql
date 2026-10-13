create table public.eras (
  code text primary key,
  position smallint not null unique
);

insert into public.eras (code, position) values
  ('prehistory', 1),
  ('antiquity', 2),
  ('middle_ages', 3),
  ('early_modern', 4),
  ('modern', 5),
  ('contemporary', 6);

alter table public.artworks add column era_code text references public.eras (code);

create index artworks_era_code_idx on public.artworks (era_code);

create table public.period_eras (
  value_id uuid not null,
  era_code text not null references public.eras (code),
  owner_id uuid not null default auth.uid(),
  primary key (value_id, era_code),
  foreign key (value_id, owner_id) references public.category_values (id, owner_id) on delete cascade
);

create index period_eras_era_code_idx on public.period_eras (era_code);

create table public.style_periods (
  style_id uuid not null,
  period_id uuid not null,
  owner_id uuid not null default auth.uid(),
  primary key (style_id, period_id),
  foreign key (style_id, owner_id) references public.category_values (id, owner_id) on delete cascade,
  foreign key (period_id, owner_id) references public.category_values (id, owner_id) on delete cascade
);

create index style_periods_period_id_idx on public.style_periods (period_id);

create function private.check_period_era()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.category_values as value
      where value.id = new.value_id and value.category_code = 'period'
  ) then
    raise exception 'only a period can belong to an era'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create function private.check_style_period()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.category_values as value
      where value.id = new.style_id and value.category_code = 'style'
  ) or not exists (
    select 1 from public.category_values as value
      where value.id = new.period_id and value.category_code = 'period'
  ) then
    raise exception 'only a style can belong to a period'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger period_eras_check
  before insert on public.period_eras
  for each row execute function private.check_period_era();

create trigger style_periods_check
  before insert on public.style_periods
  for each row execute function private.check_style_period();

revoke all on function private.check_period_era() from public;
revoke all on function private.check_style_period() from public;

alter table public.eras enable row level security;
alter table public.period_eras enable row level security;
alter table public.style_periods enable row level security;

create policy "Signed-in users read eras"
  on public.eras for select to authenticated
  using (true);

create policy "Owners manage their period eras"
  on public.period_eras for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their style periods"
  on public.style_periods for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.eras, public.period_eras, public.style_periods from anon, authenticated;

grant select on public.eras to authenticated;
grant select, delete on public.period_eras to authenticated;
grant insert (value_id, era_code) on public.period_eras to authenticated;
grant select, delete on public.style_periods to authenticated;
grant insert (style_id, period_id) on public.style_periods to authenticated;

grant insert (era_code) on public.artworks to authenticated;
grant update (era_code) on public.artworks to authenticated;

create temporary table period_plan as
with aliases (key, era_code, is_period) as (
  values
    ('prehistoria', 'prehistory', false),
    ('starożytność', 'antiquity', false),
    ('średniowiecze', 'middle_ages', false),
    ('nowożytność', 'early_modern', false),
    ('nowoczesność', 'modern', false),
    ('współczesność', 'contemporary', false),
    ('xix wiek', 'modern', false),
    ('sztuka współczesna', 'contemporary', false),
    ('renesans', 'early_modern', true),
    ('barok', 'early_modern', true),
    ('oświecenie', 'early_modern', true),
    ('modernizm', 'modern', true)
),
period_values as (
  select
    artwork.id as artwork_id,
    artwork.owner_id,
    artwork.year,
    value.id as value_id,
    alias.era_code as alias_era_code,
    coalesce(alias.is_period, true) as is_period,
    row_number() over (partition by artwork.id order by link.position, value.name) as rank
  from public.artworks as artwork
  join public.artwork_values as link on link.artwork_id = artwork.id
  join public.category_values as value on value.id = link.value_id
  left join aliases as alias on alias.key = lower(value.name)
  where value.category_code = 'period'
)
select
  head.artwork_id,
  head.owner_id,
  coalesce(
    head.alias_era_code,
    case
      when head.year is null then null
      when head.year <= -3000 then 'prehistory'
      when head.year <= 476 then 'antiquity'
      when head.year <= 1492 then 'middle_ages'
      when head.year <= 1789 then 'early_modern'
      when head.year <= 1945 then 'modern'
      else 'contemporary'
    end
  ) as era_code,
  (
    select chosen.value_id
      from period_values as chosen
      where chosen.artwork_id = head.artwork_id and chosen.is_period
      order by chosen.rank
      limit 1
  ) as period_id
from period_values as head
where head.rank = 1;

update public.artworks as artwork
  set era_code = plan.era_code
  from period_plan as plan
  where plan.artwork_id = artwork.id;

delete from public.artwork_values as link
  using public.category_values as value
  where value.id = link.value_id
    and value.category_code = 'period'
    and not exists (
      select 1 from period_plan as plan
        where plan.artwork_id = link.artwork_id and plan.period_id = link.value_id
    );

insert into public.period_eras (value_id, era_code, owner_id)
  select distinct plan.period_id, plan.era_code, plan.owner_id
    from period_plan as plan
    where plan.period_id is not null and plan.era_code is not null;

insert into public.style_periods (style_id, period_id, owner_id)
  select distinct link.value_id, plan.period_id, plan.owner_id
    from period_plan as plan
    join public.artwork_values as link on link.artwork_id = plan.artwork_id
    join public.category_values as value on value.id = link.value_id
    where plan.period_id is not null and value.category_code = 'style';

delete from public.category_values as value
  where value.category_code = 'period'
    and not exists (
      select 1 from public.artwork_values as link where link.value_id = value.id
    );

drop table period_plan;

create or replace function public.save_artwork(
  artwork jsonb,
  values_by_category jsonb,
  existing_id uuid default null
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
  if jsonb_typeof(values_by_category) is distinct from 'object' then
    raise exception 'values_by_category must be an object of name arrays'
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
      title, author_unknown, year, year_approximate, type_code, era_code, notes,
      source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
      source_image_attribution, own_image_path, own_image_url,
      image_width, image_height
    )
    values (
      btrim(input.title), coalesce(input.author_unknown, false), input.year,
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
        year = input.year,
        year_approximate = coalesce(input.year_approximate, false),
        type_code = input.type_code,
        era_code = case when artwork ? 'era_code' then input.era_code else public.artworks.era_code end,
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

    delete from public.artwork_values where public.artwork_values.artwork_id = saved.id;
  end if;

  insert into public.category_values (category_code, name)
    select entry.key, btrim(item.name)
      from jsonb_each(values_by_category) as entry
      cross join jsonb_array_elements_text(entry.value) as item(name)
      where btrim(item.name) <> ''
    on conflict (owner_id, category_code, lower(name)) do nothing;

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

  return query select saved.id, saved.record_number;
end;
$$;

revoke all on function public.save_artwork(jsonb, jsonb, uuid) from public, anon;
grant execute on function public.save_artwork(jsonb, jsonb, uuid) to authenticated;
