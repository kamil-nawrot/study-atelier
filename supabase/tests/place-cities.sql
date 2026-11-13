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
  paris uuid;
  tum uuid;
  second_paris uuid;
  orsay uuid;
  louvre uuid;
  lascaux uuid;
  museum uuid;
  painting uuid;
  code text;
begin
  paris := public.ensure_city_place('Paryż', 'Q90', 'FR', 48.857, 2.352);
  assert (select (place_type, country_code, latitude, wikidata_id) from public.location_details where value_id = paris)
    = ('city'::text, 'FR'::text, 48.857::double precision, 'Q90'::text),
    'ensure_city_place does not give a new city its type, country, point and Wikidata id';
  assert public.ensure_city_place('Paris', 'Q90') = paris,
    'ensure_city_place creates a second city for a catalogue town the atelier has';
  assert public.ensure_city_place('PARYŻ') = paris,
    'ensure_city_place creates a second city for a name the atelier has';

  insert into public.category_values (category_code, name) values ('location', 'Tum') returning id into tum;
  assert public.ensure_city_place('tum') = tum, 'ensure_city_place does not reuse an untyped place of that name';
  assert (select place_type from public.location_details where value_id = tum) = 'city',
    'ensure_city_place does not make an untyped place a city';
  assert (select latitude from public.location_details where value_id = tum) is null,
    'a town added by hand gets a point';

  select id into painting from public.save_artwork(
    '{"title": "Olympia", "author_unknown": true}', '{"location": ["Musée d''Orsay"]}', null, '[]');
  select id into orsay from public.category_values where name = 'Musée d''Orsay';
  perform public.save_value_details(orsay, '{"place_type": "museum", "country_code": "IT"}');
  perform public.set_place_point(orsay, 48.86, 2.326);
  perform public.save_value_details(orsay, jsonb_build_object('city_id', paris));
  assert (select (city_id, latitude, longitude, country_code) from public.location_details where value_id = orsay)
    = (paris, null::double precision, null::double precision, 'FR'::text),
    'a place with a city keeps its own point or its own country';

  insert into public.category_values (category_code, name) values ('location', 'Luwr') returning id into louvre;
  begin
    perform public.save_value_details(orsay, jsonb_build_object('city_id', louvre));
    code := null;
  exception when others then
    code := sqlstate;
  end;
  assert code = '22023', 'a place that is not a city is accepted as the city of a place';

  perform public.save_value_details(orsay, '{"place_type": "city"}');
  assert (select city_id from public.location_details where value_id = orsay) is null,
    'a city place keeps a city';
  perform public.save_value_details(orsay, jsonb_build_object('place_type', 'museum', 'city_id', paris));

  update public.location_details set country_code = 'BE' where value_id = paris;
  assert (select country_code from public.location_details where value_id = orsay) = 'BE',
    'a new country of a city does not reach its places';
  update public.location_details set country_code = 'FR' where value_id = paris;

  begin
    perform public.save_value_details(paris, '{"place_type": "museum"}');
    code := null;
  exception when others then
    code := sqlstate;
  end;
  assert code = 'SC002', 'a city with places changes its type';

  begin
    perform public.ensure_city_place('Musée d''Orsay');
    code := null;
  exception when others then
    code := sqlstate;
  end;
  assert code = 'SC003', 'ensure_city_place turns a museum into a city';

  begin
    perform public.delete_unused_value(paris);
    code := null;
  exception when others then
    code := sqlstate;
  end;
  assert code = '23001', 'a city with places is deleted';

  insert into public.category_values (category_code, name) values ('location', 'Lascaux') returning id into lascaux;
  perform public.save_value_details(lascaux, '{"place_type": "on_site", "country_code": "FR"}');
  perform public.set_place_point(lascaux, 45.05, 1.17);
  perform public.save_value_details(louvre, jsonb_build_object('place_type', 'museum', 'city_id', paris));
  perform public.set_place_point(louvre, 48.861, 2.336);
  assert (select (city_id, latitude) from public.location_details where value_id = louvre)
    = (null::uuid, 48.861::double precision),
    'set_place_point keeps the city of a place';
  perform public.save_value_details(louvre, jsonb_build_object('city_id', paris));

  begin
    perform public.merge_category_values(paris, lascaux);
    code := null;
  exception when others then
    code := sqlstate;
  end;
  assert code = 'SC001', 'a city with places is merged into a place of another type';

  second_paris := public.ensure_city_place('Paris 2', null, 'FR', 48.85, 2.35);
  perform public.merge_category_values(paris, second_paris);
  assert (select count(*) from public.location_details where city_id = second_paris) = 2,
    'merging two cities does not move the places of the merged one';
  paris := second_paris;

  insert into public.category_values (category_code, name) values ('location', 'Orsay bis') returning id into museum;
  perform public.merge_category_values(orsay, museum);
  assert (select city_id from public.location_details where value_id = museum) = paris,
    'a kept place without a city or a point does not take the city of the merged one';

  perform public.merge_category_values(museum, lascaux);
  assert (select (city_id, latitude) from public.location_details where value_id = lascaux)
    = (null::uuid, 45.05::double precision),
    'a kept place with its own point takes the city of the merged one';

  assert (select (jsonb_path_query_first(public.card_index(), '$.values[*] ? (@.name == "Luwr")') ->> 'city_id'))::uuid
    = paris, 'card_index does not give a place its city';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  city uuid := gen_random_uuid();
  place uuid := gen_random_uuid();
  older uuid := gen_random_uuid();
begin
  assert not exists (select 1 from public.location_details where city_id is not null),
    'another owner sees the cities of places';

  perform public.import_atelier(jsonb_build_object(
    'category_values', jsonb_build_array(
      jsonb_build_object('id', place, 'category_code', 'location', 'name', 'Uffizi'),
      jsonb_build_object('id', city, 'category_code', 'location', 'name', 'Florencja'),
      jsonb_build_object('id', older, 'category_code', 'location', 'name', 'Brera')
    ),
    'location_details', jsonb_build_array(
      jsonb_build_object('value_id', place, 'place_type', 'museum', 'country_code', 'IT', 'city_id', city),
      jsonb_build_object('value_id', city, 'place_type', 'city', 'country_code', 'IT', 'city_id', null),
      jsonb_build_object('value_id', older, 'place_type', 'museum', 'country_code', 'IT')
    )
  ));
  assert (select city_id from public.location_details where value_id = place) = city,
    'import_atelier drops the city of a place listed before its city';
  assert (select city_id from public.location_details where value_id = older) is null,
    'import_atelier gives a city to a place exported without one';
end;
$$;

rollback;
