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
    '{"title": "Linking", "author_unknown": true, "era_code": "early_modern", "notes": "See [x](/atelier/7)."}',
    '{"period": ["Baroque"]}');
  perform public.save_artwork(
    '{"title": "Longer number", "author_unknown": true, "era_code": "early_modern", "notes": "See [x](/atelier/70)."}',
    '{}');
  perform public.save_artwork(
    '{"title": "Trashed", "author_unknown": true, "era_code": "early_modern", "notes": "See [x](/atelier/7)."}',
    '{}');
  perform public.save_artwork(
    '{"title": "Wildcards", "author_unknown": true, "era_code": "early_modern", "notes": "a_b and 50%"}',
    '{}');
  perform public.save_artwork(
    '{"title": "Without notes", "author_unknown": true, "era_code": "early_modern"}',
    '{}');
  insert into public.period_details (value_id, notes)
    select id, 'Compare [y](/atelier/7).' from public.category_values where name = 'Baroque';
  insert into public.era_details (era_code, notes) values ('antiquity', 'Nothing linked here.');
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
      from public.notes_mentions('](/atelier/7)')) = array['artwork:Linking', 'period:'],
    'notes_mentions does not find the notes that link the page, or finds a trashed artwork';
  assert (select record_number from public.notes_mentions('](/atelier/7)') where kind = 'artwork')
      = (select record_number from public.artworks where title = 'Linking'),
    'notes_mentions does not give the record number of an artwork';
  assert (select id from public.notes_mentions('](/atelier/7)') where kind = 'period')
      = (select id::text from public.category_values where name = 'Baroque'),
    'notes_mentions does not give the id of a value';
  assert (select count(*) from public.notes_mentions('a_b')) = 1, 'an underscore is not matched literally';
  assert (select count(*) from public.notes_mentions('axb')) = 0, 'an unrelated text matches';
  assert (select count(*) from public.notes_mentions('0%')) = 1, 'a percent sign is not matched literally';
  assert (select count(*) from public.notes_mentions('5%0')) = 0, 'a percent sign matches as a wildcard';
  assert (select count(*) from public.notes_mentions()) = 5,
    'notes_mentions without a needle does not give every note outside the trash';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert (select count(*) from public.notes_mentions()) = 0, 'B sees the notes of A';
end;
$$;

reset role;

rollback;
