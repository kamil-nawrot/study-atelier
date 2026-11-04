\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;

create function pg_temp.add_work(number integer, era text, notes text)
returns uuid
language sql
as $$
  select saved.id from public.save_artwork(
    jsonb_strip_nulls(jsonb_build_object(
      'title', 'Work ' || number,
      'author_unknown', true,
      'era_code', era,
      'notes', notes
    )),
    '{}',
    null,
    jsonb_build_array(jsonb_build_object(
      'source_wikidata_id', 'Q' || number,
      'source_image_file', 'Work_' || number || '.jpg'
    ))
  ) as saved;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
insert into public.glossary_entries (name, category) values ('Lunette', 'architecture');
select pg_temp.add_work(9, 'modern', 'A lunette over the door.');

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  tympanum uuid;
  modern uuid;
  plain uuid;
  drawn jsonb;
begin
  insert into public.glossary_entries (name, category, forms)
    values ('Tympanum', 'architecture', array['tympana']);
  tympanum := pg_temp.add_work(1, 'middle_ages', E'## Portal\nThe TYMPANA of the west front.');
  modern := pg_temp.add_work(2, 'modern', 'A tympanum (c. 1130).');
  plain := pg_temp.add_work(3, 'middle_ages', 'Tympanumlike, without the term.');
  perform pg_temp.add_work(4, 'middle_ages', 'A lunette, a term of another learner.');

  drawn := public.note_gap_artwork('all', null, '{}');
  assert drawn ->> 'id' in (tympanum::text, modern::text),
    'the note gap draws an artwork whose note holds no term: ' || coalesce(drawn::text, 'null');
  assert (public.note_gap_artwork('all', null, array[tympanum, modern])) is null,
    'the note gap draws an artwork the session shows';
  assert public.note_gap_artwork('era', 'modern', '{}') ->> 'id' = modern::text,
    'the note gap leaves the scope of the session';
  assert public.note_gap_artwork('era', 'modern', '{}') ->> 'notes' = 'A tympanum (c. 1130).',
    'the note gap does not return the note';
  assert public.note_gap_artwork('style', 'Baroque', '{}') is null,
    'the note gap finds an artwork outside the style';

  update public.artworks set deleted_at = now() where id in (tympanum, modern);
  assert public.note_gap_artwork('all', null, '{}') is null,
    'the note gap draws a deleted artwork';
end;
$$;

rollback;
