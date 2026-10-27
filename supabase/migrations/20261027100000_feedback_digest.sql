alter table public.feedback
  add column browser text check (browser <> '' and char_length(browser) <= 500),
  add column notified_at timestamptz;

grant insert (browser) on public.feedback to authenticated;
