\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  louvre uuid;
  orsay uuid;
  realism uuid;
  mona_lisa uuid;
  raft uuid;
  olympia uuid;
  visit uuid;
  rejected boolean;
begin
  select id into mona_lisa from public.save_artwork(
    '{"title": "Mona Lisa", "author_unknown": true}', '{"author": [], "location": ["Louvre"]}');
  select id into raft from public.save_artwork(
    '{"title": "The Raft of the Medusa", "author_unknown": true}', '{"author": [], "location": ["Louvre"]}');
  select id into olympia from public.save_artwork(
    '{"title": "Olympia", "author_unknown": true}', '{"author": [], "location": ["Orsay"], "period": ["Realism"]}');
  select id into louvre from public.category_values where category_code = 'location' and name = 'Louvre';
  select id into orsay from public.category_values where category_code = 'location' and name = 'Orsay';
  select id into realism from public.category_values where category_code = 'period';

  visit := public.save_visit(
    jsonb_build_object('place_id', louvre, 'visited_on', '2026-10-12', 'date_precision', 'day', 'notes', 'Crowds'),
    array[mona_lisa, olympia]);
  assert (select count(*) from public.visit_artworks where visit_id = visit) = 2,
    'save_visit drops the artworks it was given';
  assert (select notes from public.visits where id = visit) = 'Crowds', 'save_visit drops the note';

  perform public.save_visit(
    jsonb_build_object('place_id', orsay, 'visited_on', '2026-10-01', 'date_precision', 'month'),
    array[olympia, raft], visit);
  assert (select place_id from public.visits where id = visit) = orsay, 'save_visit keeps the old place';
  assert (select date_precision from public.visits where id = visit) = 'month', 'save_visit keeps the old precision';
  assert (select notes from public.visits where id = visit) is null, 'save_visit keeps a note that was cleared';
  assert (select array_agg(artwork_id order by artwork_id) from public.visit_artworks where visit_id = visit)
    = (select array_agg(id order by id) from unnest(array[olympia, raft]) as id),
    'save_visit keeps an unticked artwork or drops a ticked one';
  assert (select count(*) from public.visits) = 1, 'editing a visit adds another one';

  perform public.save_visit(
    jsonb_build_object('place_id', louvre, 'visited_on', '2026-10-01', 'date_precision', 'month'), '{}', visit);
  assert not exists (select 1 from public.visit_artworks where visit_id = visit),
    'save_visit keeps artworks when the visit is saved with none';

  rejected := false;
  begin
    perform public.save_visit(
      jsonb_build_object('place_id', realism, 'visited_on', '2026-10-12', 'date_precision', 'day'), '{}');
  exception when foreign_key_violation then rejected := true;
  end;
  assert rejected, 'a visit is logged at a value that is not a place';

  rejected := false;
  begin
    perform public.save_visit(
      jsonb_build_object('place_id', louvre, 'visited_on', '2026-10-12', 'date_precision', 'month'), '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a visit known to the month is stored on a day other than the first';

  rejected := false;
  begin
    perform public.save_visit(
      jsonb_build_object('place_id', louvre, 'visited_on', '2026-10-01', 'date_precision', 'year'), '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a visit known to the year is stored on a month other than January';

  rejected := false;
  begin
    perform public.save_visit(
      jsonb_build_object('place_id', louvre, 'visited_on', '2026-10-12', 'date_precision', 'week'), '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a visit is stored with an unknown date precision';

  rejected := false;
  begin
    perform public.save_visit(
      jsonb_build_object('place_id', louvre, 'visited_on', '2026-10-12', 'date_precision', 'day', 'notes', ''), '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a visit is stored with an empty note';

  rejected := false;
  begin
    perform public.save_visit(
      jsonb_build_object('place_id', louvre, 'visited_on', '2026-10-12', 'date_precision', 'day'),
      array[gen_random_uuid()]);
  exception when foreign_key_violation then rejected := true;
  end;
  assert rejected, 'a visit holds an artwork that does not exist';
  assert (select count(*) from public.visits) = 1, 'a rejected save leaves a visit behind';

  rejected := false;
  begin
    perform public.save_visit(
      jsonb_build_object('place_id', louvre, 'visited_on', '2026-10-12', 'date_precision', 'day'),
      '{}', gen_random_uuid());
  exception when no_data_found then rejected := true;
  end;
  assert rejected, 'save_visit edits a visit that does not exist';

  perform public.save_visit(
    jsonb_build_object('place_id', louvre, 'visited_on', '2025-01-01', 'date_precision', 'year'), array[mona_lisa]);
  delete from public.artworks where id = mona_lisa;
  assert not exists (select 1 from public.visit_artworks where artwork_id = mona_lisa),
    'deleting an artwork for good leaves it on its visits';

  delete from public.visits where id = visit;
  assert (select count(*) from public.visits) = 1, 'deleting a visit deletes another one';
end;
$$;

rollback;
