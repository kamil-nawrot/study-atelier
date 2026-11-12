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
  sketch uuid;
  painting uuid;
  replica uuid;
  copy uuid;
  trashed uuid;
  failed boolean;
begin
  select id into painting from public.save_artwork('{"title": "Painting", "author_unknown": true}', '{}');
  perform set_config('test.painting', painting::text, true);
  select id into replica from public.save_artwork('{"title": "Replica", "author_unknown": true}', '{}');
  select id into copy from public.save_artwork('{"title": "Copy", "author_unknown": true}', '{}');
  select id into trashed from public.save_artwork('{"title": "Trashed", "author_unknown": true}', '{}');

  select id into sketch from public.save_artwork(
    '{"title": "Sketch", "author_unknown": true}', '{}', null, null, null,
    jsonb_build_array(
      jsonb_build_object('kind', 'study', 'side', 'from', 'artwork_id', painting),
      jsonb_build_object('kind', 'copy', 'side', 'to', 'artwork_id', copy),
      jsonb_build_object('kind', 'related', 'side', 'from', 'artwork_id', trashed)));

  assert exists (select 1 from public.artwork_relations
      where from_id = sketch and to_id = painting and kind = 'study'),
    'a study is not stored from the sketch to the painting';
  assert exists (select 1 from public.artwork_relations
      where from_id = copy and to_id = sketch and kind = 'copy'),
    'the other side of a relation is not stored as its start';
  assert exists (select 1 from public.artwork_relations
      where from_id = least(sketch, trashed) and to_id = greatest(sketch, trashed) and kind = 'related'),
    'a symmetric relation is not stored in the order of its ids';

  perform public.save_artwork('{"title": "Painting", "author_unknown": true}', '{}', painting, null, null,
    jsonb_build_array(jsonb_build_object('kind', 'version', 'side', 'to', 'artwork_id', replica)));
  assert not exists (select 1 from public.artwork_relations where kind = 'study'),
    'saving the painting does not replace its relations';
  assert exists (select 1 from public.artwork_relations
      where from_id = least(painting, replica) and to_id = greatest(painting, replica) and kind = 'version'),
    'a relation saved from the other end is not stored';

  perform public.save_artwork('{"title": "Painting", "author_unknown": true}', '{}', painting);
  assert exists (select 1 from public.artwork_relations where kind = 'version'),
    'a save without relations removes them';

  update public.artworks set deleted_at = now() where id = trashed;
  perform public.save_artwork('{"title": "Sketch", "author_unknown": true}', '{}', sketch, null, null, '[]');
  assert not exists (select 1 from public.artwork_relations where kind = 'copy'),
    'an empty list does not remove the relations';
  assert exists (select 1 from public.artwork_relations where kind = 'related'),
    'a relation to an artwork in the trash is removed by a save that cannot show it';

  perform public.save_artwork('{"title": "Sketch", "author_unknown": true}', '{}', sketch, null, null,
    jsonb_build_array(
      jsonb_build_object('kind', 'copy', 'side', 'from', 'artwork_id', copy),
      jsonb_build_object('kind', 'part', 'side', 'from', 'artwork_id', trashed)));
  assert (select count(*) from public.artwork_relations where sketch in (from_id, to_id)) = 2,
    'a second relation to the same artwork is not dropped';

  begin
    perform public.save_artwork('{"title": "Copy", "author_unknown": true}', '{}', copy, null, null,
      jsonb_build_array(jsonb_build_object('kind', 'copy', 'side', 'from', 'artwork_id', copy)));
    failed := false;
  exception when check_violation then
    failed := true;
  end;
  assert failed, 'an artwork relates to itself';

  begin
    insert into public.artwork_relations (from_id, to_id, kind) values (painting, copy, 'pendant');
    failed := false;
  exception when check_violation then
    failed := true;
  end;
  assert failed, 'a relation takes a kind outside the list';

  begin
    insert into public.artwork_relations (from_id, to_id, kind)
      values (greatest(painting, copy), least(painting, copy), 'related');
    failed := false;
  exception when check_violation then
    failed := true;
  end;
  assert failed, 'a symmetric relation is stored against the order of its ids';

  begin
    perform public.save_artwork('{"title": "Copy", "author_unknown": true}', '{}', copy, null, null, '{}');
    failed := false;
  exception when invalid_parameter_value then
    failed := true;
  end;
  assert failed, 'relations that are not a list are saved';

  delete from public.artworks where id = copy;
  assert (select count(*) from public.artwork_relations where sketch in (from_id, to_id)) = 1,
    'deleting an artwork keeps its relations';
end;
$$;

do $$
declare
  first_author uuid;
  second_author uuid;
  period uuid;
  failed boolean;
begin
  insert into public.category_values (category_code, name) values ('author', 'Verrocchio') returning id into first_author;
  insert into public.category_values (category_code, name) values ('author', 'Leonardo') returning id into second_author;
  insert into public.category_values (category_code, name) values ('period', 'Renaissance') returning id into period;

  insert into public.author_relations (from_id, to_id, kind) values (second_author, first_author, 'pupil');
  assert (select category_code from public.author_relations) = 'author', 'an author relation has no category';

  begin
    insert into public.author_relations (from_id, to_id, kind) values (first_author, period, 'influence');
    failed := false;
  exception when foreign_key_violation then
    failed := true;
  end;
  assert failed, 'an author relates to a value of another category';

  delete from public.category_values where id = first_author;
  assert not exists (select 1 from public.author_relations), 'deleting an author keeps its relations';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  own uuid;
  failed boolean;
begin
  assert not exists (select 1 from public.artwork_relations), 'B sees the relations of A';
  select id into own from public.save_artwork('{"title": "Own", "author_unknown": true}', '{}');
  begin
    perform public.save_artwork('{"title": "Own", "author_unknown": true}', '{}', own, null, null,
      jsonb_build_array(jsonb_build_object('kind', 'related', 'side', 'from', 'artwork_id',
        current_setting('test.painting')::uuid)));
    failed := false;
  exception when foreign_key_violation then
    failed := true;
  end;
  assert failed, 'B relates an artwork to an artwork that is not theirs';
end;
$$;

rollback;
