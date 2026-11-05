\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  orders uuid;
  source uuid;
  temple uuid;
  statue uuid;
  untyped uuid;
  rejected boolean;
begin
  insert into public.artwork_fields (name, kind, type_codes)
    values ('Porządek', 'list', '{architecture}') returning id into orders;
  insert into public.artwork_fields (name, kind) values ('Źródło', 'text') returning id into source;

  select id into temple from public.save_artwork(
    '{"title": "Partenon", "author_unknown": true, "type_code": "architecture"}',
    jsonb_build_object(orders::text, '["Dorycki"]'::jsonb), null, null,
    jsonb_build_object(source::text, 'Podręcznik'));
  select id into statue from public.save_artwork(
    '{"title": "Dyskobol", "author_unknown": true, "type_code": "sculpture"}',
    jsonb_build_object(orders::text, '["Joński"]'::jsonb), null, null,
    jsonb_build_object(source::text, 'Wykład'));
  select id into untyped from public.save_artwork(
    '{"title": "Szkic", "author_unknown": true}',
    jsonb_build_object(orders::text, '["Koryncki"]'::jsonb), null, null, '{}');

  assert (select count(*) from public.artwork_values as link
      join public.category_values as value on value.id = link.value_id
      where value.category_code = orders::text) = 1,
    'a value of a field is saved on an artwork of another type or without a type';
  assert (select count(*) from public.artwork_field_entries where field_id = source) = 2,
    'a field for all types loses a value';

  update public.artworks set type_code = 'painting' where id = temple;
  assert not exists (select 1 from public.artwork_values as link
      join public.category_values as value on value.id = link.value_id
      where value.category_code = orders::text),
    'changing the type keeps the value of a field that no longer applies';
  assert (select count(*) from public.artwork_field_entries where field_id = source) = 2,
    'changing the type drops the value of a field for all types';

  update public.artworks set type_code = 'architecture' where id = temple;
  perform public.save_artwork(
    '{"title": "Partenon", "author_unknown": true, "type_code": "architecture"}',
    jsonb_build_object(orders::text, '["Dorycki"]'::jsonb), temple);

  update public.artwork_fields set type_codes = '{sculpture}' where id = source;
  assert public.artwork_field_type_impact(source, '{architecture}') = 1,
    'the impact does not count the artworks of the removed types';
  assert public.artwork_field_type_impact(orders, '{}') = 0,
    'widening a field to all types counts artworks';
  assert (select array_agg(artwork_id) from public.artwork_field_entries where field_id = source)
      = array[statue],
    'narrowing a field keeps the values of a removed type or drops a kept one';
  assert (select count(*) from public.artwork_values as link
      join public.category_values as value on value.id = link.value_id
      where value.category_code = orders::text and link.artwork_id = temple) = 1,
    'narrowing another field drops this field''s values';

  rejected := false;
  begin
    update public.artwork_fields set type_codes = '{castle}' where id = orders;
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'a field takes a type that does not exist';

  rejected := false;
  begin
    update public.artwork_fields set type_codes = '{sculpture,sculpture}' where id = orders;
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'a field takes the same type twice';
end;
$$;

rollback;
