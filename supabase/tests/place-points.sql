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
  painting uuid;
  sculpture uuid;
  louvre uuid;
  rome uuid;
  roma uuid;
  florence uuid;
  firenze uuid;
  visit uuid;
  rejected boolean;
  aliased record;
begin
  assert (select count(*) from public.catalogue_museums where latitude is null or longitude is null) = 0,
    'a starter museum has no point';
  assert not exists (select 1 from public.catalogue_museums where name = 'Newgrounds'),
    'Newgrounds is still a starter museum';

  select id into painting from public.save_artwork(
    '{"title": "Mona Lisa", "author_unknown": true}', '{"location": ["Luwr"]}', null, '[]');
  select id into louvre from public.category_values where name = 'Luwr';
  assert (
    select (details.latitude, details.wikidata_id, city.name)
      from public.location_details as details
      join public.category_values as city on city.id = details.city_id
      where details.value_id = louvre
  ) = (null::double precision, 'Q19675'::text, 'Paryż'::text),
    'a starter museum does not give a new place its Wikidata id and its city';

  select museum.alias, museum.wikidata_id, museum.latitude into aliased
    from public.catalogue_museums as museum
    where museum.alias is not null
      and not exists (
        select 1 from public.catalogue_museums as other
          where other.wikidata_id <> museum.wikidata_id
            and (lower(other.alias) = lower(museum.alias) or lower(other.name) = lower(museum.alias))
      )
    limit 1;
  perform public.save_artwork(
    jsonb_build_object('title', 'Alias', 'author_unknown', true),
    jsonb_build_object('location', jsonb_build_array(aliased.alias)), null, '[]');
  assert (
    select (details.catalogue_wikidata_id, details.latitude is not null or details.city_id is not null, details.place_type)
      from public.location_details as details
      join public.category_values as place on place.id = details.value_id
      where place.name = aliased.alias
  ) = (aliased.wikidata_id, true, 'museum'::text),
    'a place named by the alias of a starter museum does not get its city or point';

  select id into sculpture from public.save_artwork(
    '{"title": "Pieta", "author_unknown": true}', '{"location": ["Rzym"]}', null, '[]');
  select id into rome from public.category_values where name = 'Rzym';
  assert not exists (select 1 from public.location_details where value_id = rome),
    'a place outside the catalogue gets details';

  perform public.set_place_point(rome, 41.89306, 12.48278, 'Q220');
  assert (select wikidata_id from public.location_details where value_id = rome) = 'Q220',
    'a place without details does not get a point';
  perform public.set_place_point(rome, 41.9, 12.5);
  assert (select wikidata_id from public.location_details where value_id = rome) is null,
    'a point set by a click keeps the Wikidata id of the previous one';
  perform public.set_place_point(painting, 1, 1);
  assert not exists (select 1 from public.location_details where value_id = painting),
    'an artwork gets a point';
  perform public.set_place_point(rome, null, null);
  assert (select latitude from public.location_details where value_id = rome) is null,
    'the point of a place cannot be removed';
  update public.location_details set latitude = 41.9, longitude = 12.5 where value_id = rome;
  assert (select latitude from public.location_details where value_id = rome) = 41.9,
    'the learner cannot change the point of a place';

  begin
    update public.location_details set longitude = null where value_id = rome;
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a point without a longitude is accepted';

  begin
    update public.location_details set latitude = 91 where value_id = rome;
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a latitude out of range is accepted';

  begin
    update public.location_details set wikidata_id = 'Rome' where value_id = rome;
    rejected := false;
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a Wikidata id that is not a Q-id is accepted';

  update public.artworks set want_to_see = true where id in (painting, sculpture);
  visit := public.save_visit('{"visited_on": "2026-10-12", "date_precision": "day"}', 'Luwr', array[painting]);
  assert not (select want_to_see from public.artworks where id = painting),
    'a visit does not clear the want-to-see mark';
  assert (select want_to_see from public.artworks where id = sculpture),
    'a visit clears the mark of an artwork it does not hold';
  assert (select count(*) from public.point_events where kind = 'wish_seen' and item_id = painting) = 1,
    'a cleared mark leaves no wish_seen event';
  assert not exists (select 1 from public.point_events where kind = 'wish_seen' and item_id = sculpture),
    'an artwork still wanted has a wish_seen event';
  assert public.learner_points() = (select count(*) * 2 from public.point_events where kind <> 'wish_seen'),
    'a wish_seen event gives points';

  update public.artworks set want_to_see = true where id = painting;
  perform public.save_visit('{"visited_on": "2026-10-13", "date_precision": "day"}', 'Luwr', array[painting], visit);
  assert (select want_to_see from public.artworks where id = painting),
    'editing a visit clears the mark of an artwork it already held';

  insert into public.category_values (category_code, name) values ('location', 'Roma') returning id into roma;
  perform public.merge_category_values(roma, rome);
  assert (select latitude from public.location_details where value_id = rome) = 41.9,
    'a merge without a point changes the point of the kept place';

  insert into public.category_values (category_code, name) values ('location', 'Firenze') returning id into firenze;
  insert into public.location_details (value_id, latitude, longitude) values (firenze, 43.7714, 11.2542);
  insert into public.category_values (category_code, name) values ('location', 'Florencja') returning id into florence;
  perform public.merge_category_values(firenze, florence);
  assert (select (latitude, longitude, wikidata_id) from public.location_details where value_id = florence)
    = (43.7714::double precision, 11.2542::double precision, null::text),
    'a merge does not give the point to a kept place without one';

  insert into public.category_values (category_code, name) values ('location', 'Roma') returning id into roma;
  insert into public.location_details (value_id, latitude, longitude) values (roma, 1, 1);
  perform public.merge_category_values(roma, rome);
  assert (select latitude from public.location_details where value_id = rome) = 41.9,
    'a merge overwrites the point of the kept place';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert not exists (select 1 from public.location_details where latitude is not null),
    'another owner sees the points of places';
  assert (select count(*) from public.catalogue_museums) > 100, 'the starter list is not readable';
end;
$$;

rollback;
