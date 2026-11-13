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
  image uuid;
  caravaggio uuid;
  merisi uuid;
  peter uuid;
  skull uuid;
  lily uuid;
  vanitas uuid;
  death uuid;
  purity uuid;
  viewed_pin uuid;
  symbol_pin uuid;
  second_view uuid;
  rejected boolean;
  atlas record;
begin
  select id into painting from public.save_artwork(
    '{"title": "Saint Jerome", "author_unknown": false, "era_code": "early_modern"}',
    '{"author": ["Caravaggio", "Merisi"]}', null,
    '[{"own_image_url": "https://example.com/jerome.jpg", "image_width": 1200, "image_height": 800}]');
  select id into image from public.artwork_images where artwork_id = painting;
  select id into caravaggio from public.category_values where name = 'Caravaggio';
  select id into merisi from public.category_values where name = 'Merisi';
  insert into public.glossary_entries (name, category) values ('Saint Peter', 'person') returning id into peter;

  skull := public.save_symbol(' Skull ', jsonb_build_array(
    jsonb_build_object('text', 'transience', 'contexts', '[]'::jsonb),
    jsonb_build_object('text', 'penance', 'contexts', jsonb_build_array(
      jsonb_build_object('value_id', merisi),
      jsonb_build_object('era_code', 'early_modern'),
      jsonb_build_object('artwork_id', painting),
      jsonb_build_object('glossary_entry_id', peter),
      jsonb_build_object('text', ' in a hermit''s cell ')))));
  assert (select name from public.symbols where id = skull) = 'Skull', 'the name is not trimmed';
  assert (select count(*) from public.symbol_meanings where symbol_id = skull) = 2, 'meanings are not stored';
  select id into vanitas from public.symbol_meanings where symbol_id = skull and position = 0;
  select id into death from public.symbol_meanings where symbol_id = skull and position = 1;
  assert (select array_agg(coalesce(text, era_code, value_id::text, artwork_id::text, glossary_entry_id::text) order by position)
    from public.symbol_meaning_contexts where meaning_id = death)
    = array[merisi::text, 'early_modern', painting::text, peter::text, 'in a hermit''s cell'],
    'the context labels are not stored in order';

  insert into public.artwork_pins (image_id, x, y, view_width, symbol_id, symbol_meaning_id)
    values (image, 0.5, 0.5, 0.2, skull, death) returning id into viewed_pin;
  insert into public.artwork_pins (image_id, x, y, symbol_id) values (image, 0.2, 0.2, skull)
    returning id into symbol_pin;

  perform public.save_symbol('Skull', jsonb_build_array(
    jsonb_build_object('id', death, 'text', 'penance and death', 'contexts', jsonb_build_array(
      jsonb_build_object('value_id', merisi))),
    jsonb_build_object('id', vanitas, 'text', 'transience'),
    jsonb_build_object('text', 'knowledge')), skull);
  assert (select position from public.symbol_meanings where id = death) = 0, 'meanings are not reordered';
  assert (select text from public.symbol_meanings where id = death) = 'penance and death', 'a meaning is not renamed';
  assert (select count(*) from public.symbol_meaning_contexts where meaning_id = death) = 1, 'old labels are kept';
  assert (select symbol_meaning_id from public.artwork_pins where id = viewed_pin) = death,
    'saving a symbol drops the meaning of a pin';

  perform public.save_symbol('Skull', jsonb_build_array(jsonb_build_object('id', vanitas, 'text', 'transience')), skull);
  assert (select count(*) from public.symbol_meanings where symbol_id = skull) = 1, 'a removed meaning is kept';
  assert (select symbol_meaning_id from public.artwork_pins where id = viewed_pin) is null,
    'a pin keeps a removed meaning';
  assert (select symbol_id from public.artwork_pins where id = viewed_pin) = skull, 'a pin loses its symbol';

  lily := public.save_symbol('Lily', jsonb_build_array(jsonb_build_object('text', 'purity')));
  select id into purity from public.symbol_meanings where symbol_id = lily;
  rejected := false;
  begin
    update public.artwork_pins set symbol_meaning_id = purity where id = viewed_pin;
  exception when foreign_key_violation then rejected := true;
  end;
  assert rejected, 'a pin takes a meaning of another symbol';

  rejected := false;
  begin
    perform public.save_symbol('skull', '[]');
  exception when unique_violation then rejected := true;
  end;
  assert rejected, 'two symbols share a name';

  rejected := false;
  begin
    perform public.save_symbol('Lily', jsonb_build_array(jsonb_build_object('id', vanitas, 'text', 'stolen')), lily);
  exception when no_data_found then rejected := true;
  end;
  assert rejected, 'a symbol takes a meaning of another symbol';

  rejected := false;
  begin
    perform public.save_symbol('Lily', jsonb_build_array(jsonb_build_object('text', repeat('a', 201))), lily);
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a meaning longer than 200 characters is stored';

  rejected := false;
  begin
    perform public.save_symbol('Lily', (select jsonb_agg(jsonb_build_object('text', 'm' || n)) from generate_series(1, 11) as n), lily);
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a symbol takes more than 10 meanings';

  rejected := false;
  begin
    perform public.save_symbol('Lily', jsonb_build_array(jsonb_build_object('text', 'purity', 'contexts',
      (select jsonb_agg(jsonb_build_object('text', 'c' || n)) from generate_series(1, 11) as n))), lily);
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a meaning takes more than 10 labels';

  rejected := false;
  begin
    insert into public.symbol_meaning_contexts (meaning_id, position, era_code, text)
      values (purity, 0, 'modern', 'both');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a label points at two things';

  rejected := false;
  begin
    insert into public.symbol_meaning_contexts (meaning_id, position) values (purity, 0);
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'an empty label is stored';

  perform public.save_symbol('Lily', jsonb_build_array(jsonb_build_object('id', purity, 'text', 'purity',
    'contexts', jsonb_build_array(jsonb_build_object('value_id', caravaggio), jsonb_build_object('value_id', merisi)))), lily);
  perform public.merge_category_values(merisi, caravaggio);
  assert (select count(*) from public.symbol_meaning_contexts where meaning_id = purity) = 1,
    'a merge keeps a duplicate label';
  assert (select value_id from public.symbol_meaning_contexts where meaning_id = purity) = caravaggio,
    'a merge does not move the label to the value that stays';
  perform public.save_symbol('Skull', jsonb_build_array(jsonb_build_object('id', vanitas, 'text', 'transience',
    'contexts', jsonb_build_array(jsonb_build_object('value_id', caravaggio)))), skull);
  delete from public.category_values where id = caravaggio;
  assert not exists (select 1 from public.symbol_meaning_contexts where value_id = caravaggio),
    'a deleted value keeps its labels';

  select * into atlas from public.symbol_atlas() where id = skull;
  assert atlas.first_meaning = 'transience', 'the atlas misses the first meaning';
  assert atlas.meaning_count = 1 and atlas.pin_count = 2, 'the atlas counts wrong';
  assert (atlas.cover ->> 'pin_id')::uuid = viewed_pin, 'the atlas cover is not the pin with a view';
  assert (atlas.cover ->> 'own_image_url') = 'https://example.com/jerome.jpg', 'the atlas cover has no image';

  insert into public.artwork_pins (image_id, x, y, view_width, symbol_id)
    values (image, 0.7, 0.7, 0.2, skull) returning id into second_view;
  rejected := false;
  begin
    perform public.set_symbol_cover(skull, symbol_pin);
  exception when invalid_parameter_value then rejected := true;
  end;
  assert rejected, 'a pin without a crop becomes the main detail';
  perform public.set_symbol_cover(skull, second_view);
  select * into atlas from public.symbol_atlas() where id = skull;
  assert (atlas.cover ->> 'pin_id')::uuid = second_view, 'the chosen main detail is not the cover';
  perform public.set_symbol_cover(skull, viewed_pin);
  select * into atlas from public.symbol_atlas() where id = skull;
  assert (atlas.cover ->> 'pin_id')::uuid = viewed_pin, 'the older main detail loses to the newest pin';
  perform public.set_symbol_cover(skull, null);
  select * into atlas from public.symbol_atlas() where id = skull;
  assert (atlas.cover ->> 'pin_id')::uuid = second_view, 'clearing the main detail keeps it';

  update public.artworks set deleted_at = now() where id = painting;
  select * into atlas from public.symbol_atlas() where id = skull;
  assert atlas.pin_count = 0 and atlas.cover is null, 'the atlas counts pins of artworks in the trash';
  update public.artworks set deleted_at = null where id = painting;

  delete from public.symbols where id = skull;
  assert not exists (select 1 from public.artwork_pins where id = symbol_pin),
    'deleting a symbol keeps a pin with nothing else';
  assert (select symbol_id is null and symbol_meaning_id is null from public.artwork_pins where id = viewed_pin),
    'deleting a symbol keeps it on a pin';
  assert not exists (select 1 from public.symbol_meanings where id = vanitas), 'deleting a symbol keeps its meanings';

  insert into public.artwork_pins (image_id, x, y, glossary_entry_id, symbol_id) values (image, 0.3, 0.3, peter, lily)
    returning id into symbol_pin;
  delete from public.glossary_entries where id = peter;
  assert exists (select 1 from public.artwork_pins where id = symbol_pin),
    'deleting an entry drops a pin that keeps a symbol';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  lily uuid;
  foreign_value uuid;
  rejected boolean;
begin
  assert (select count(*) from public.symbols) = 0, 'B reads symbols of A';
  assert (select count(*) from public.symbol_meanings) = 0, 'B reads meanings of A';
  assert (select count(*) from public.symbol_meaning_contexts) = 0, 'B reads labels of A';
  assert (select count(*) from public.symbol_atlas()) = 0, 'B sees the atlas of A';

  set local role postgres;
  select id into lily from public.symbols where name = 'Lily';
  select id into foreign_value from public.category_values where name = 'Merisi' or name = 'Caravaggio' limit 1;
  insert into public.category_values (owner_id, category_code, name)
    values ('00000000-0000-0000-0000-00000000000a', 'style', 'Tenebrism') returning id into foreign_value;
  set local role authenticated;

  rejected := false;
  begin
    perform public.save_symbol('Stolen', '[]', lily);
  exception when no_data_found then rejected := true;
  end;
  assert rejected, 'B renames a symbol of A';

  rejected := false;
  begin
    perform public.save_symbol('Dove', jsonb_build_array(jsonb_build_object('text', 'peace', 'contexts',
      jsonb_build_array(jsonb_build_object('value_id', foreign_value)))));
  exception when foreign_key_violation then rejected := true;
  end;
  assert rejected, 'B labels a meaning with a value of A';

  delete from public.symbols where id = lily;
  set local role postgres;
  assert exists (select 1 from public.symbols where id = lily), 'B deletes a symbol of A';
end;
$$;

rollback;
