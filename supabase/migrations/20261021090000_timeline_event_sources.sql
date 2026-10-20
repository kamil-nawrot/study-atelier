alter table public.timeline_events
  add column source_title text check (source_title <> ''),
  add column source_url text check (source_url ~ '^https://'),
  add column source_licence text check (source_licence <> ''),
  add column source_fetched_on date,
  add constraint timeline_events_source_check check (
    (source_title is null) = (source_url is null)
    and (source_title is null) = (source_licence is null)
    and (source_title is null) = (source_fetched_on is null)
  );

grant insert (source_title, source_url, source_licence, source_fetched_on)
  on public.timeline_events to authenticated;
grant update (source_title, source_url, source_licence, source_fetched_on)
  on public.timeline_events to authenticated;
