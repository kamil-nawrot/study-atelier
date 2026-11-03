\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  statement text;
begin
  assert public.atelier_empty(), 'a new atelier is not empty';
  foreach statement in array array[
    'select public.save_artwork(''{"title": "Mona Lisa"}'', ''{"author": ["Leonardo da Vinci"]}'')',
    'insert into public.category_values (category_code, name) values (''period'', ''Renaissance'')',
    'insert into public.glossary_entries (name, category) values (''Sfumato'', ''general'')',
    'insert into public.timeline_events (name, year_to) values (''Fall of Constantinople'', 1453)',
    'insert into public.artwork_fields (name, kind) values (''Motifs'', ''text'')',
    'select public.save_visit(''{"visited_on": "2026-10-12", "date_precision": "day"}'', ''Louvre'', ''{}'')'
  ] loop
    execute statement;
    assert not public.atelier_empty(), format('the atelier is empty after: %s', statement);
    delete from public.visits;
    delete from public.artwork_fields;
    delete from public.timeline_events;
    delete from public.glossary_entries;
    delete from public.artworks;
    delete from public.category_values;
    assert public.atelier_empty(), format('the atelier is not empty after removing: %s', statement);
  end loop;
  perform public.save_artwork('{"title": "Mona Lisa"}', '{"author": ["Leonardo da Vinci"]}');
end
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert public.atelier_empty(), 'B sees the artworks of A';
end
$$;

rollback;

\echo 'atelier_empty: done'
