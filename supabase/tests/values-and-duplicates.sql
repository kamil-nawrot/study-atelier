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
  mona_lisa uuid;
  copy uuid;
  trashed uuid;
begin
  assert public.search_key('  Łódź   ŻÓŁW  Église ') = 'lodz zolw eglise',
    'search_key keeps case, marks, ł or extra spaces';

  select id into mona_lisa from public.save_artwork(
    '{"title": "Mona Lisa"}', '{"author": ["Leonardo da Vinci"], "material": ["Oil"]}');
  select id into copy from public.save_artwork(
    '{"title": " mona  LISA "}', '{"author": ["Salaì", "Leonardo da Vinci"]}');
  select id into trashed from public.save_artwork(
    '{"title": "Móna Lisa"}', '{"author": ["Leonardo da Vinci"], "material": ["Poplar"]}');
  perform public.save_artwork('{"title": "Lady with an Ermine"}', '{"author": ["Leonardo da Vinci"]}');
  update public.artworks set deleted_at = now() where id = trashed;
  perform public.save_visit('{"visited_on": "2026-10-12", "date_precision": "day"}', 'Louvre', '{}');

  assert (select array_agg(id order by record_number) from public.duplicate_candidates('MONA lisa'))
    = array[mona_lisa, copy], 'duplicate_candidates misses a title that differs in case or spaces, or lists the trash';
  assert (select authors from public.duplicate_candidates('Mona Lisa') where id = copy)
    = array['Leonardo da Vinci', 'Salaì'], 'duplicate_candidates does not list the authors in order';
  assert (select authors from public.duplicate_candidates('Lady with an Ermine'))
    = array['Leonardo da Vinci'], 'duplicate_candidates drops the author';
  assert not exists (select 1 from public.duplicate_candidates('Mona')), 'duplicate_candidates matches a part of a title';

  assert (select array_agg(name order by name) from public.used_category_values() where category_code = 'material')
    = array['Oil'], 'used_category_values lists a value used only in the trash';
  assert exists (select 1 from public.used_category_values() where category_code = 'location' and name = 'Louvre'),
    'used_category_values misses a place used only by a visit';
  assert (select count(*) from public.used_category_values() where category_code = 'author') = 2,
    'used_category_values repeats or misses an author';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert not exists (select 1 from public.duplicate_candidates('Mona Lisa')), 'B finds the artworks of A';
  assert not exists (select 1 from public.used_category_values()), 'B lists the values of A';
end;
$$;

rollback;
