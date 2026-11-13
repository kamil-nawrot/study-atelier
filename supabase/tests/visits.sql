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
  mona_lisa uuid;
  raft uuid;
  olympia uuid;
  visit uuid;
  starter uuid;
  first uuid;
  second uuid;
  rejected boolean;
begin
  select id into mona_lisa from public.save_artwork(
    '{"title": "Mona Lisa", "author_unknown": true}', '{"author": [], "location": ["Louvre"]}');
  select id into raft from public.save_artwork(
    '{"title": "The Raft of the Medusa", "author_unknown": true}', '{"author": [], "location": ["Louvre"]}');
  select id into olympia from public.save_artwork(
    '{"title": "Olympia", "author_unknown": true}', '{"author": [], "location": ["Orsay"]}');
  select id into louvre from public.category_values where category_code = 'location' and name = 'Louvre';
  select id into orsay from public.category_values where category_code = 'location' and name = 'Orsay';

  visit := public.save_visit(
    '{"visited_on": "2026-10-12", "date_precision": "day", "notes": "Crowds"}', ' louvre ',
    array[mona_lisa, olympia]);
  assert (select place_id from public.visits where id = visit) = louvre,
    'save_visit does not find the place by its name';
  assert (select count(*) from public.category_values where category_code = 'location') = 2,
    'save_visit adds a place that already exists';
  assert (select count(*) from public.visit_artworks where visit_id = visit) = 2,
    'save_visit drops the artworks it was given';
  assert (select notes from public.visits where id = visit) = 'Crowds', 'save_visit drops the note';

  perform public.save_visit(
    '{"visited_on": "2026-10-01", "date_precision": "month"}', 'Orsay', array[olympia, raft], visit);
  assert (select place_id from public.visits where id = visit) = orsay, 'save_visit keeps the old place';
  assert (select date_precision from public.visits where id = visit) = 'month', 'save_visit keeps the old precision';
  assert (select notes from public.visits where id = visit) is null, 'save_visit keeps a note that was cleared';
  assert (select array_agg(artwork_id order by artwork_id) from public.visit_artworks where visit_id = visit)
    = (select array_agg(id order by id) from unnest(array[olympia, raft]) as id),
    'save_visit keeps an unticked artwork or drops a ticked one';
  assert (select count(*) from public.visits) = 1, 'editing a visit adds another one';

  perform public.save_visit('{"visited_on": "2026-10-01", "date_precision": "month"}', 'Orsay', '{}', visit);
  assert not exists (select 1 from public.visit_artworks where visit_id = visit),
    'save_visit keeps artworks when the visit is saved with none';

  perform public.save_visit(
    '{"visited_on": "2026-01-01", "date_precision": "year"}', 'Museum Abteiberg', '{}');
  select id into starter from public.category_values where category_code = 'location' and name = 'Museum Abteiberg';
  assert starter is not null, 'save_visit does not add a new place';
  assert (select catalogue_wikidata_id from public.location_details where value_id = starter) = 'Q206346',
    'a new place from the museum list gets no details';

  rejected := false;
  begin
    perform public.save_visit('{"visited_on": "2026-10-12", "date_precision": "day"}', '  ', '{}');
  exception when not_null_violation then rejected := true;
  end;
  assert rejected, 'a visit is logged without a place';

  rejected := false;
  begin
    perform public.save_visit('{"date_precision": "day"}', 'Louvre', '{}');
  exception when not_null_violation then rejected := true;
  end;
  assert rejected, 'a visit is logged without a date';

  rejected := false;
  begin
    perform public.save_visit('{"visited_on": "2026-10-12", "date_precision": "month"}', 'Louvre', '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a visit known to the month is stored on a day other than the first';

  rejected := false;
  begin
    perform public.save_visit('{"visited_on": "2026-10-01", "date_precision": "year"}', 'Louvre', '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a visit known to the year is stored on a month other than January';

  rejected := false;
  begin
    perform public.save_visit('{"visited_on": "2026-10-12", "date_precision": "week"}', 'Louvre', '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a visit is stored with an unknown date precision';

  rejected := false;
  begin
    perform public.save_visit(
      '{"visited_on": "2026-10-12", "date_precision": "day", "notes": ""}', 'Louvre', '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a visit is stored with an empty note';

  rejected := false;
  begin
    perform public.save_visit(
      '{"visited_on": "2026-10-12", "date_precision": "day"}', 'Louvre', array[gen_random_uuid()]);
  exception when foreign_key_violation then rejected := true;
  end;
  assert rejected, 'a visit holds an artwork that does not exist';
  assert (select count(*) from public.visits) = 2, 'a rejected save leaves a visit behind';

  rejected := false;
  begin
    perform public.save_visit(
      '{"visited_on": "2026-10-12", "date_precision": "day"}', 'Louvre', '{}', gen_random_uuid());
  exception when no_data_found then rejected := true;
  end;
  assert rejected, 'save_visit edits a visit that does not exist';

  perform public.save_visit('{"visited_on": "2025-01-01", "date_precision": "year"}', 'Louvre', array[mona_lisa]);
  delete from public.artworks where id = mona_lisa;
  assert not exists (select 1 from public.visit_artworks where artwork_id = mona_lisa),
    'deleting an artwork for good leaves it on its visits';

  rejected := false;
  begin
    delete from public.category_values where id = louvre;
  exception when foreign_key_violation then rejected := true;
  end;
  assert rejected, 'deleting a place deletes its visits';

  delete from public.visits where id = visit;
  assert (select count(*) from public.visits) = 2, 'deleting a visit deletes another one';

  assert (select visit_count from public.value_usage() where id = louvre) = 1,
    'value_usage does not count the visits of a place';
  assert (select visit_count from public.value_usage() where id = orsay) = 0,
    'value_usage counts visits of another place';

  delete from public.artwork_values where value_id = louvre;
  rejected := false;
  begin
    perform public.delete_unused_value(louvre);
  exception when restrict_violation then rejected := true;
  end;
  assert rejected, 'delete_unused_value deletes a place that a visit still uses';

  visit := public.save_visit(
    jsonb_build_object('visited_on', '2024-01-01', 'date_precision', 'year',
      'notes', '[Louvre](/atelier/values/location/' || louvre || ')'),
    'Louvre', '{}');
  perform public.merge_category_values(louvre, orsay);
  assert not exists (select 1 from public.visits where place_id = louvre),
    'merging two places leaves visits at the merged one';
  assert (select count(*) from public.visits where place_id = orsay) = 2,
    'merging two places loses a visit';
  assert (select notes from public.visits where id = visit) = '[Louvre](/atelier/values/location/' || orsay || ')',
    'merging two places leaves a link to the merged one in the note of a visit';

  assert (select title from public.note_link_mentions(value_id => orsay) where kind = 'visit')
      = 'Orsay · 2024',
    'note_link_mentions does not name a visit whose note links a place';
  update public.visits set visited_on = '2026-10-12', date_precision = 'day' where id = visit;
  assert (select title from public.note_link_mentions(value_id => orsay) where kind = 'visit' and id = visit::text)
      = 'Orsay · 12.10.2026',
    'note_link_mentions does not give the day of a visit';

  first := public.save_visit(jsonb_build_object('visited_on', '2020-01-01', 'date_precision', 'year',
    'notes', '[Orsay](/atelier/values/location/' || orsay || ')'), 'Orsay', '{}');
  second := public.save_visit(jsonb_build_object('visited_on', '2020-01-01', 'date_precision', 'year',
    'notes', '[Orsay](/atelier/values/location/' || orsay || ')'), 'Orsay', '{}');
  update public.visits set visited_on = '2021-01-01' where id = greatest(first, second);
  assert (
    select array_agg(mention.id order by mention.position)
      from public.note_link_mentions(value_id => orsay)
        with ordinality as mention (kind, id, record_number, title, position)
      where mention.kind = 'visit' and mention.id in (first::text, second::text)
  ) = array[greatest(first, second)::text, least(first, second)::text],
    'note_link_mentions does not list visits newest first';
end;
$$;

do $$
declare
  paris uuid;
  portal uuid;
  trip uuid;
  museum_visit uuid;
  rejected boolean;
begin
  select id into portal from public.save_artwork(
    '{"title": "Portal of the Virgin", "author_unknown": true}', '{"author": [], "location": ["Notre-Dame"]}');
  update public.artworks set want_to_see = true where id = portal;

  trip := public.save_visit(
    '{"kind": "trip", "visited_on": "2026-10-10", "date_precision": "day", "ends_on": "2026-10-14"}',
    'Paris', array[portal]);
  select id into paris from public.category_values where category_code = 'location' and name = 'Paris';
  assert (select kind from public.visits where id = trip) = 'trip', 'save_visit does not save a trip';
  assert (select ends_on from public.visits where id = trip) = '2026-10-14', 'save_visit drops the end of a trip';
  assert (select place_type from public.location_details where value_id = paris) = 'city',
    'a new place of a trip is not a city';
  assert exists (select 1 from public.visit_artworks where visit_id = trip and artwork_id = portal),
    'a trip drops its artworks';
  assert not (select want_to_see from public.artworks where id = portal),
    'a trip does not clear the want-to-see mark';

  perform public.save_visit(
    '{"kind": "visit", "visited_on": "2026-10-11", "date_precision": "day", "ends_on": "2026-10-11"}',
    'Paris', array[portal], trip);
  assert (select kind from public.visits where id = trip) = 'trip', 'editing a trip turns it into a visit';
  assert (select ends_on from public.visits where id = trip) is null, 'a one-day trip keeps an end on its start';

  museum_visit := public.save_visit(
    '{"visited_on": "2026-10-12", "date_precision": "day", "ends_on": "2026-10-13"}', 'Louvre', '{}');
  assert (select ends_on from public.visits where id = museum_visit) is null, 'a visit keeps an end date';

  rejected := false;
  begin
    perform public.save_visit('{"kind": "trip", "visited_on": "2026-10-10", "date_precision": "day"}', 'Louvre', '{}');
  exception when invalid_parameter_value then rejected := true;
  end;
  assert rejected, 'a trip is saved at a place that is not a city';

  rejected := false;
  begin
    perform public.save_visit(
      '{"kind": "trip", "visited_on": "2026-10-10", "date_precision": "day", "ends_on": "2026-10-09"}', 'Paris', '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a trip ends before it starts';

  rejected := false;
  begin
    perform public.save_visit(
      '{"kind": "trip", "visited_on": "2026-10-01", "date_precision": "month", "ends_on": "2026-10-20"}', 'Paris', '{}');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a trip known to the month has an end';

  update public.visits set trip_id = trip where id = museum_visit;
  rejected := false;
  begin
    update public.visits set trip_id = museum_visit where id = trip;
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a trip is part of a trip';

  rejected := false;
  begin
    perform public.save_visit('{"visited_on": "2026-10-12", "date_precision": "day"}', 'Orsay', '{}');
    update public.visits set trip_id = museum_visit where place_id = (
      select id from public.category_values where category_code = 'location' and name = 'Orsay');
  exception when foreign_key_violation then rejected := true;
  end;
  assert rejected, 'a visit is part of another visit';

  delete from public.visits where id = trip;
  assert (select trip_id from public.visits where id = museum_visit) is null,
    'deleting a trip does not free its visits';
  assert exists (select 1 from public.visits where id = museum_visit), 'deleting a trip deletes its visits';
end;
$$;

rollback;
