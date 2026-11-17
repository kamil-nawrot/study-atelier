alter table public.artwork_relations drop constraint artwork_relations_kind_check;
alter table public.artwork_relations add constraint artwork_relations_kind_check
  check (kind in ('study', 'copy', 'version', 'part', 'inside', 'reference', 'related'));
