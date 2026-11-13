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
  paris uuid;
  remote uuid;
  imported uuid;
begin
  assert (select count(*) from public.catalogue_museums where city_name is not null) > 600,
    'the starter museums have no cities';

  insert into public.category_values (category_code, name) values ('location', 'Luwr test') returning id into louvre;
  insert into public.location_details (value_id, place_type, catalogue_wikidata_id)
    values (louvre, 'museum', 'Q19675');
  select city_id into paris from public.location_details where value_id = louvre;
  assert paris is not null, 'a starter museum does not get its city';
  assert (select name from public.category_values where id = paris) = 'Paryż',
    'a starter museum gets the wrong city';
  assert (select (place_type, country_code, wikidata_id) from public.location_details where value_id = paris)
    = ('city'::text, 'FR'::text, 'Q90'::text),
    'the city of a starter museum is not a city with its country and Wikidata id';
  assert (select (latitude, country_code, wikidata_id) from public.location_details where value_id = louvre)
    = (null::double precision, 'FR'::text, 'Q19675'::text),
    'a starter museum in a city keeps a point or loses its country or Wikidata id';

  insert into public.category_values (category_code, name) values ('location', 'Orsay test') returning id into orsay;
  insert into public.location_details (value_id, place_type, catalogue_wikidata_id)
    values (orsay, 'museum', 'Q23402');
  assert (select city_id from public.location_details where value_id = orsay) = paris,
    'a second museum of the same city gets a second city';

  insert into public.category_values (category_code, name) values ('location', 'Daleko test') returning id into remote;
  insert into public.location_details (value_id, place_type, catalogue_wikidata_id)
    values (remote, 'museum', 'Q667615');
  assert (select (city_id is null and latitude is not null) from public.location_details where value_id = remote),
    'a starter museum with no town near does not get its own point';

  perform set_config('study_atelier.importing', 'on', true);
  insert into public.category_values (category_code, name) values ('location', 'Import test') returning id into imported;
  insert into public.location_details (value_id, place_type, catalogue_wikidata_id)
    values (imported, 'museum', 'Q19675');
  assert (select (city_id is null and latitude is not null) from public.location_details where value_id = imported),
    'an imported starter museum gets a city instead of the point of the export';
  perform set_config('study_atelier.importing', '', true);
end;
$$;

do $$
declare
  taken uuid;
  louvre uuid;
begin
  insert into public.category_values (category_code, name) values ('location', 'Wiedeń') returning id into taken;
  insert into public.location_details (value_id, place_type) values (taken, 'museum');
  insert into public.category_values (category_code, name) values ('location', 'Belweder test') returning id into louvre;
  insert into public.location_details (value_id, place_type, catalogue_wikidata_id)
    values (louvre, 'museum', 'Q414219');
  assert (select (city_id is null and latitude is not null) from public.location_details where value_id = louvre),
    'a starter museum whose city name is taken by a place of another type does not keep its point';
end;
$$;

rollback;
