create table public.visits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id uuid not null,
  category_code text not null default 'location' check (category_code = 'location'),
  visited_on date not null,
  date_precision text not null check (date_precision in ('day', 'month', 'year')),
  notes text check (notes <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  foreign key (place_id, owner_id, category_code)
    references public.category_values (id, owner_id, category_code),
  check (date_precision = 'day' or extract(day from visited_on) = 1),
  check (date_precision <> 'year' or extract(month from visited_on) = 1)
);

create index visits_owner_visited_on_idx on public.visits (owner_id, visited_on desc);
create index visits_place_id_idx on public.visits (place_id);

create trigger visits_set_updated_at
  before update on public.visits
  for each row execute function private.set_updated_at();

create table public.visit_artworks (
  visit_id uuid not null,
  artwork_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (visit_id, artwork_id),
  foreign key (visit_id, owner_id) references public.visits (id, owner_id) on delete cascade,
  foreign key (artwork_id, owner_id) references public.artworks (id, owner_id) on delete cascade
);

create index visit_artworks_artwork_id_idx on public.visit_artworks (artwork_id);

alter table public.visits enable row level security;
alter table public.visit_artworks enable row level security;

create policy "Owners manage their visits"
  on public.visits for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage the artworks of their visits"
  on public.visit_artworks for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.visits, public.visit_artworks from anon, authenticated;

grant select, delete on public.visits to authenticated;
grant insert (place_id, visited_on, date_precision, notes) on public.visits to authenticated;
grant update (place_id, visited_on, date_precision, notes) on public.visits to authenticated;

grant select, delete on public.visit_artworks to authenticated;
grant insert (visit_id, artwork_id) on public.visit_artworks to authenticated;

create function public.save_visit(
  visit jsonb,
  place text,
  artwork_ids uuid[],
  existing_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  input public.visits := jsonb_populate_record(null::public.visits, visit);
  place_name text := btrim(coalesce(place, ''));
  wanted uuid[] := coalesce(artwork_ids, '{}');
  saved_place uuid;
  saved_id uuid;
begin
  if place_name = '' then
    raise exception 'a visit needs a place'
      using errcode = 'not_null_violation';
  end if;

  with created as (
    insert into public.category_values (category_code, name)
      values ('location', place_name)
      on conflict (owner_id, category_code, lower(name)) do nothing
      returning id, name
  )
  insert into public.location_details (value_id, country_code, place_type, catalogue_wikidata_id)
    select created.id, museum.country_code, 'museum', museum.wikidata_id
      from created
      join public.catalogue_museums as museum on lower(museum.name) = lower(created.name);

  select value.id into saved_place
    from public.category_values as value
    where value.owner_id = (select auth.uid())
      and value.category_code = 'location'
      and lower(value.name) = lower(place_name);

  if existing_id is null then
    insert into public.visits (place_id, visited_on, date_precision, notes)
      values (saved_place, input.visited_on, input.date_precision, input.notes)
      returning id into saved_id;
  else
    update public.visits as saved
      set place_id = saved_place,
        visited_on = input.visited_on,
        date_precision = input.date_precision,
        notes = input.notes
      where saved.id = existing_id
      returning saved.id into saved_id;

    if saved_id is null then
      raise exception 'visit not found'
        using errcode = 'no_data_found';
    end if;

    delete from public.visit_artworks as seen
      where seen.visit_id = saved_id and not (seen.artwork_id = any (wanted));
  end if;

  insert into public.visit_artworks (visit_id, artwork_id)
    select saved_id, wanted_artwork from unnest(wanted) as wanted_artwork
    on conflict do nothing;

  return saved_id;
end;
$$;

revoke all on function public.save_visit(jsonb, text, uuid[], uuid) from public, anon;
grant execute on function public.save_visit(jsonb, text, uuid[], uuid) to authenticated;
