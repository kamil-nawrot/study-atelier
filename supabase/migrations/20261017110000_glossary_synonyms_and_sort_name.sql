alter table public.glossary_entries
  add column synonyms text[] not null default '{}'
    check (array_position(synonyms, null) is null and cardinality(synonyms) <= 50 and '' <> all (synonyms)),
  add column sort_name text
    check (sort_name <> '' and sort_name = btrim(sort_name) and char_length(sort_name) <= 120);

grant insert (synonyms, sort_name) on public.glossary_entries to authenticated;
grant update (synonyms, sort_name) on public.glossary_entries to authenticated;
