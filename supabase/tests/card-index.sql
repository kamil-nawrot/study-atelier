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
  index jsonb;
  leonardo uuid;
  louvre uuid;
  renaissance uuid;
  mannerism uuid;
  trashed uuid;
begin
  perform public.save_artwork('{"title": "Mona Lisa", "era_code": "early_modern"}',
    '{"author": ["Leonardo da Vinci"], "location": ["Louvre"], "period": ["Renaissance"], "style": ["Sfumato"]}');
  select id into trashed from public.save_artwork('{"title": "Saint Anne", "era_code": "early_modern"}',
    '{"author": ["Leonardo da Vinci"], "period": ["Renaissance"]}');
  update public.artworks set deleted_at = now() where id = trashed;
  perform public.save_visit('{"visited_on": "2026-10-12", "date_precision": "day"}', 'Louvre', '{}');
  insert into public.category_values (category_code, name) values ('period', 'Mannerism') returning id into mannerism;

  select id into leonardo from public.category_values where category_code = 'author' and name = 'Leonardo da Vinci';
  select id into louvre from public.category_values where category_code = 'location' and name = 'Louvre';
  select id into renaissance from public.category_values where category_code = 'period' and name = 'Renaissance';
  perform public.save_value_details(leonardo, '{"sort_name": "Leonardo", "birth_year": 1452}');
  insert into public.location_details (value_id, country_code, place_type) values (louvre, 'FR', 'museum');
  perform public.set_period_eras(renaissance, array['early_modern', 'middle_ages']);
  perform public.set_style_periods(
    (select id from public.category_values where category_code = 'style' and name = 'Sfumato'),
    array[renaissance, mannerism]);

  index := public.card_index();

  assert (select array_agg(item ->> 'name') from jsonb_array_elements(index -> 'values') as item)
    = (select array_agg(name) from public.value_usage()),
    'card_index lists other values or another order than value_usage';
  assert (select count(*) from jsonb_array_elements(index -> 'values') as item
      join public.value_usage() as usage on usage.id = (item ->> 'id')::uuid
      where (item ->> 'artwork_count')::integer = usage.artwork_count
        and (item ->> 'visit_count')::integer = usage.visit_count
        and item ->> 'category_code' = usage.category_code)
    = (select count(*) from public.value_usage()),
    'card_index counts artworks or visits unlike value_usage';
  assert (select item from jsonb_array_elements(index -> 'values') as item where (item ->> 'id')::uuid = leonardo)
    @> '{"artwork_count": 2, "sort_name": "Leonardo", "birth_year": 1452}',
    'card_index drops the trash from the count or the sort name and birth year of an author';
  assert (select item from jsonb_array_elements(index -> 'values') as item where (item ->> 'id')::uuid = louvre)
    @> '{"visit_count": 1, "country_code": "FR", "place_type": "museum"}',
    'card_index drops the visits, the country or the type of a place';
  assert (select not (item ? 'country_code') from jsonb_array_elements(index -> 'values') as item
      where (item ->> 'id')::uuid = renaissance),
    'card_index gives a period the details of another value';

  assert index -> 'period_eras' = (select jsonb_agg(to_jsonb(usage)) from public.period_era_usage() as usage),
    'card_index answers the eras of the periods unlike period_era_usage';
  assert index -> 'style_periods' = (select jsonb_agg(to_jsonb(usage)) from public.style_period_usage() as usage),
    'card_index answers the periods of the styles unlike style_period_usage';
  assert jsonb_array_length(index -> 'style_periods') = 2, 'card_index misses a period of a style';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
begin
  assert public.card_index() = '{"values": [], "period_eras": [], "style_periods": []}'::jsonb,
    'B sees the card index of A';
end;
$$;

rollback;
