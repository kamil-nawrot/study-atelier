alter table public.point_events
  drop constraint point_events_kind_check,
  add constraint point_events_kind_check check (kind in (
    'plan_day', 'settled', 'artwork_added', 'definition_added', 'event_added', 'visit_added', 'easter_egg',
    'right_answers', 'symbol_added'
  ));

create trigger symbols_point_event
  after insert on public.symbols
  for each row execute function private.point_event_on_insert('symbol_added');

create or replace function private.fill_point_events(owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.point_events (owner_id, kind, item_id, occurred_at)
    select owner, 'artwork_added', artwork.id, artwork.created_at
      from public.artworks as artwork where artwork.owner_id = owner
    union all
    select owner, 'definition_added', entry.id, entry.created_at
      from public.glossary_entries as entry where entry.owner_id = owner
    union all
    select owner, 'symbol_added', symbol.id, symbol.created_at
      from public.symbols as symbol where symbol.owner_id = owner
    union all
    select owner, 'event_added', event.id, event.created_at
      from public.timeline_events as event where event.owner_id = owner
    union all
    select owner, 'visit_added', visit.id, visit.created_at
      from public.visits as visit where visit.owner_id = owner
    union all
    select owner, 'settled', card.artwork_id, coalesce(card.last_review, card.created_at)
      from public.review_cards as card where card.owner_id = owner and card.facet = 'recognise' and card.stability >= 7
    on conflict do nothing;

  insert into public.point_events (owner_id, kind, day_start, plan_share, streak_days, occurred_at)
    with days as (
      select distinct (entry.reviewed_at at time zone 'Europe/Warsaw')::date as day
        from public.review_log as entry where entry.owner_id = owner and entry.facet = 'recognise'
    ),
    runs as (
      select day, day - (row_number() over (order by day))::integer as run from days
    )
    select owner, 'plan_day', day::timestamp at time zone 'Europe/Warsaw', 1,
        row_number() over (partition by run order by day),
        (day + 1)::timestamp at time zone 'Europe/Warsaw'
      from runs
    on conflict do nothing;
end;
$$;

insert into public.point_events (owner_id, kind, item_id, occurred_at)
  select symbol.owner_id, 'symbol_added', symbol.id, symbol.created_at
    from public.symbols as symbol
  on conflict do nothing;
