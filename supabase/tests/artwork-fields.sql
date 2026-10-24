\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  lecture uuid;
  motifs uuid;
  source uuid;
  seen uuid;
  saved uuid;
  rejected boolean;
begin
  insert into public.artwork_fields (name, kind) values ('Wykład', 'list') returning id into lecture;
  insert into public.artwork_fields (name, description, kind, multiple)
    values ('Motywy', 'Co przedstawia dzieło', 'list', true) returning id into motifs;
  insert into public.artwork_fields (name, kind) values ('Źródło', 'text') returning id into source;
  insert into public.artwork_fields (name, kind) values ('Widziane na żywo', 'flag') returning id into seen;

  assert (select array_agg(name order by position) from public.artwork_fields)
      = '{Wykład,Motywy,Źródło,"Widziane na żywo"}',
    'a new field does not go after the others';
  assert (select count(*) from public.categories where owner_id is not null) = 2,
    'a list field does not get a category of its own, or another kind does';
  assert (select multiple from public.categories where code = motifs::text),
    'the category of a list field does not take its number of values';

  rejected := false;
  begin
    insert into public.artwork_fields (name, kind) values ('wykład', 'text');
  exception
    when unique_violation then rejected := true;
  end;
  assert rejected, 'two fields have names that differ only in letter case';

  rejected := false;
  begin
    insert into public.artwork_fields (name, kind, multiple) values ('Tags', 'text', true);
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'a field that is not a list takes several values';

  rejected := false;
  begin
    update public.artwork_fields set kind = 'text' where id = lecture;
  exception
    when insufficient_privilege then rejected := true;
  end;
  assert rejected, 'the kind of a field changes after it is created';

  select id into saved from public.save_artwork(
    '{"title": "Zwiastowanie", "author_unknown": true}',
    jsonb_build_object('author', '[]'::jsonb, lecture::text, '["Barok – ćwiczenia"]'::jsonb,
      motifs::text, '["Anioł", "Lilia"]'::jsonb),
    null, null,
    jsonb_build_object(source::text, '  Gombrich, s. 300 ', seen::text, true));

  assert (select array_agg(value.name order by link.position)
      from public.artwork_values as link
      join public.category_values as value on value.id = link.value_id
      where link.artwork_id = saved and value.category_code = motifs::text) = '{Anioł,Lilia}',
    'save_artwork does not store the values of a list field';
  assert (select text_value from public.artwork_field_entries where field_id = source) = 'Gombrich, s. 300',
    'save_artwork does not store a trimmed text';
  assert exists (select 1 from public.artwork_field_entries where field_id = seen and text_value is null),
    'save_artwork does not store a ticked field';

  rejected := false;
  begin
    perform public.save_artwork('{"title": "Two lectures", "author_unknown": true}',
      jsonb_build_object('author', '[]'::jsonb, lecture::text, '["Renesans", "Barok"]'::jsonb));
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'a list field with one value takes two';

  rejected := false;
  begin
    perform public.save_artwork('{"title": "Two lines", "author_unknown": true}', '{"author": []}',
      null, null, jsonb_build_object(source::text, E'one\ntwo'));
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'a text field takes two lines';

  rejected := false;
  begin
    perform public.save_artwork('{"title": "Long", "author_unknown": true}', '{"author": []}',
      null, null, jsonb_build_object(source::text, repeat('x', 201)));
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'a text field takes more than 200 characters';

  perform public.save_artwork('{"title": "Zwiastowanie", "author_unknown": true}',
    '{"author": [], "period": [], "style": [], "material": [], "location": []}', saved);
  assert (select count(*) from public.artwork_values where artwork_id = saved) = 3,
    'save_artwork drops the values of a list field it was not given';
  assert (select count(*) from public.artwork_field_entries where artwork_id = saved) = 2,
    'save_artwork without field entries drops the ones the artwork has';

  perform public.save_artwork('{"title": "Zwiastowanie", "author_unknown": true}',
    jsonb_build_object('author', '[]'::jsonb, lecture::text, '[]'::jsonb), saved, null,
    jsonb_build_object(source::text, '', seen::text, false));
  assert (select count(*) from public.artwork_values where artwork_id = saved) = 2,
    'save_artwork does not clear a list field given without values, or clears another one';
  assert (select count(*) from public.artwork_field_entries where artwork_id = saved) = 0,
    'save_artwork keeps an emptied text or an unticked field';

  perform public.save_artwork('{"title": "Zwiastowanie", "author_unknown": true}', '{"author": []}',
    saved, null, jsonb_build_object(source::text, 'Gombrich', seen::text, true, lecture::text, 'ignored'));
  assert (select count(*) from public.artwork_field_entries where artwork_id = saved) = 2,
    'save_artwork stores an entry for a list field';

  perform public.save_artwork('{"title": "Zwiastowanie", "author_unknown": true}', '{"author": []}',
    saved, null, jsonb_build_object(seen::text, false));
  assert exists (select 1 from public.artwork_field_entries where artwork_id = saved and field_id = source),
    'save_artwork wipes the entry of a field it was not given';
  assert not exists (select 1 from public.artwork_field_entries where artwork_id = saved and field_id = seen),
    'save_artwork keeps an unticked field it was given';
  perform public.save_artwork('{"title": "Zwiastowanie", "author_unknown": true}', '{"author": []}',
    saved, null, jsonb_build_object(seen::text, true));

  perform public.save_artwork('{"title": "Zwiastowanie", "author_unknown": true}',
    jsonb_build_object('author', '[]'::jsonb, motifs::text, '["Anioł", "Lilia"]'::jsonb,
      gen_random_uuid()::text, '["Gone"]'::jsonb),
    saved);
  assert (select count(*) from public.artwork_values as link
      join public.category_values as value on value.id = link.value_id
      where link.artwork_id = saved and value.category_code = motifs::text) = 2,
    'save_artwork fails or drops the values around a list field that no longer exists';

  rejected := false;
  begin
    insert into public.category_values (category_code, name) values ('material', repeat('x', 201));
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'a value takes more than 200 characters';

  rejected := false;
  begin
    insert into public.category_values (category_code, name) values ('material', E'two\tlines');
  exception
    when check_violation then rejected := true;
  end;
  assert rejected, 'a value takes a control character';

  assert (select artwork_count from public.artwork_field_usage() where field_id = motifs) = 1,
    'artwork_field_usage does not count the artworks with values of a list field';
  assert (select artwork_count from public.artwork_field_usage() where field_id = lecture) = 0,
    'artwork_field_usage counts a list field without values';
  assert (select artwork_count from public.artwork_field_usage() where field_id = seen) = 1,
    'artwork_field_usage does not count the artworks with a ticked field';

  perform public.move_artwork_field(motifs, -1);
  set constraints all immediate;
  assert (select array_agg(name order by position) from public.artwork_fields)
      = '{Motywy,Wykład,Źródło,"Widziane na żywo"}',
    'move_artwork_field does not swap a field with the one above';
  perform public.move_artwork_field(motifs, -1);
  perform public.move_artwork_field(seen, 1);
  assert (select array_agg(name order by position) from public.artwork_fields)
      = '{Motywy,Wykład,Źródło,"Widziane na żywo"}',
    'move_artwork_field moves a field past the end';

  rejected := false;
  begin
    perform public.move_artwork_field(motifs, 2);
  exception
    when invalid_parameter_value then rejected := true;
  end;
  assert rejected, 'move_artwork_field moves a field by more than one place';

  delete from public.artwork_fields where id = motifs;
  assert not exists (select 1 from public.categories where code = motifs::text),
    'deleting a list field keeps its category';
  assert not exists (select 1 from public.category_values where category_code = motifs::text),
    'deleting a list field keeps its values';
  assert (select count(*) from public.artwork_values where artwork_id = saved) = 0,
    'deleting a list field keeps its values on artworks';

  delete from public.artwork_fields where id = source;
  assert (select count(*) from public.artwork_field_entries where artwork_id = saved) = 1,
    'deleting a text field keeps its entries';

  delete from public.artworks where id = saved;
  assert not exists (select 1 from public.artwork_field_entries where field_id = seen),
    'deleting an artwork keeps its field entries';
end;
$$;

rollback;
