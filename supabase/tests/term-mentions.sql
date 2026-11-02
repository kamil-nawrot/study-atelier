\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  perform public.save_artwork(
    '{"title": "Arch", "author_unknown": true, "era_code": "antiquity", "notes": "A triumphal ŁUK over the road."}',
    '{"period": ["Baroque"]}');
  perform public.save_artwork(
    '{"title": "Broken line", "author_unknown": true, "era_code": "antiquity", "notes": "The light and\n  shade of the nave."}',
    '{}');
  perform public.save_artwork(
    '{"title": "Shadow", "author_unknown": true, "era_code": "antiquity", "notes": "Strong ŚWIATŁOCIEŃ here."}',
    '{}');
  perform public.save_artwork(
    '{"title": "Symbols", "author_unknown": true, "era_code": "antiquity", "notes": "Price (a.b) and c+d."}',
    '{}');
  perform public.save_artwork(
    '{"title": "Trashed", "author_unknown": true, "era_code": "antiquity", "notes": "Another łuk."}',
    '{}');
  perform public.save_artwork(
    '{"title": "Unrelated", "author_unknown": true, "era_code": "antiquity", "notes": "Only a fresco."}',
    '{}');
  insert into public.period_details (value_id, notes)
    select id, 'Every łuk is round.' from public.category_values where name = 'Baroque';
  insert into public.era_details (era_code, notes) values ('antiquity', 'Arches: łuki.');
end;
$$;

reset role;

update public.artworks set deleted_at = now() where title = 'Trashed';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  assert (select array_agg(kind || ':' || coalesce(title, '') order by kind, title)
      from public.term_mentions(array['łuk'])) = array['artwork:Arch', 'era:', 'period:Baroque'],
    'term_mentions does not fold Polish capitals, gives a value without its name, or finds a trashed artwork';
  assert (select record_number from public.term_mentions(array['łuk']) where kind = 'artwork')
      = (select record_number from public.artworks where title = 'Arch'),
    'term_mentions does not give the record number of an artwork';
  assert (select title from public.term_mentions(array['światłocień'])) = 'Shadow',
    'term_mentions does not fold Ś and Ł';
  assert (select title from public.term_mentions(array['light and shade'])) = 'Broken line',
    'a phrase does not match across a line break and several spaces';
  assert (select title from public.term_mentions(array['  light   and shade '])) = 'Broken line',
    'a phrase with extra spaces does not match';
  assert (select title from public.term_mentions(array['(a.b)'])) = 'Symbols',
    'brackets and a dot are not matched literally';
  assert (select count(*) from public.term_mentions(array['(a b)'])) = 0, 'a dot matches any character';
  assert (select title from public.term_mentions(array['c+d'])) = 'Symbols', 'a plus sign is not matched literally';
  assert (select count(*) from public.term_mentions(array['cd'])) = 0, 'a plus sign works as a repeat';
  assert (select count(*) from public.term_mentions(array['fresco', 'nave', 'nave'])) = 2,
    'term_mentions does not match any of the phrases or repeats a note';
  assert (select count(*) from public.term_mentions(array[]::text[])) = 0, 'an empty array finds notes';
  assert (select count(*) from public.term_mentions(array['', '   '])) = 0, 'blank phrases find every note';
  assert (select count(*) from public.term_mentions(null)) = 0, 'null finds notes';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert (select count(*) from public.term_mentions(array['łuk'])) = 0, 'B sees the notes of A';
end;
$$;

reset role;

rollback;
