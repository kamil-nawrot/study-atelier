alter table public.glossary_entries
  add column has_definition boolean generated always as (coalesce(btrim(definition), '') <> '') stored;
