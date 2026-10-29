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
  saved uuid;
  facade uuid;
  plan uuid;
  term uuid;
  both_pin uuid;
  rejected boolean;
  limit_hint text;
begin
  select id into saved from public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/facade.jpg"}, {"own_image_url": "https://example.com/plan.jpg"}]');
  select id into facade from public.artwork_images where artwork_id = saved and position = 0;
  select id into plan from public.artwork_images where artwork_id = saved and position = 1;
  insert into public.glossary_entries (name, category) values ('Tympanum', 'architecture') returning id into term;

  insert into public.artwork_pins (image_id, x, y, glossary_entry_id) values (facade, 0.25, 0.5, term);
  insert into public.artwork_pins (image_id, x, y, text) values (facade, 0, 1, 'A lily');
  insert into public.artwork_pins (image_id, x, y, glossary_entry_id, text)
    values (facade, 0.5, 0.5, term, 'The sculpted field') returning id into both_pin;
  assert (select count(*) from public.artwork_pins where image_id = facade) = 3, 'a pin is not stored';

  rejected := false;
  begin
    insert into public.artwork_pins (image_id, x, y) values (facade, 0.5, 0.5);
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'an empty pin is stored';

  rejected := false;
  begin
    insert into public.artwork_pins (image_id, x, y, text) values (facade, 1.1, 0.5, 'Outside');
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a pin outside the image is stored';

  rejected := false;
  begin
    insert into public.artwork_pins (image_id, x, y, text) values (facade, 0.5, 0.5, repeat('a', 301));
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a text longer than 300 characters is stored';

  for number in 4..10 loop
    insert into public.artwork_pins (image_id, x, y, text) values (facade, 0.1, 0.1, 'Pin ' || number);
  end loop;
  rejected := false;
  begin
    insert into public.artwork_pins (image_id, x, y, text) values (facade, 0.9, 0.9, 'Eleventh');
  exception when check_violation then
    rejected := true;
    get stacked diagnostics limit_hint = pg_exception_hint;
  end;
  assert rejected, 'an image takes more than 10 pins';
  assert limit_hint = 'pin_limit', 'the pin limit gives no hint the app can recognise';
  insert into public.artwork_pins (image_id, x, y, text) values (plan, 0.9, 0.9, 'Another image');

  update public.artwork_pins set x = 0.75 where id = both_pin;
  assert (select x from public.artwork_pins where id = both_pin) = 0.75, 'a pin does not move';

  rejected := false;
  begin
    update public.artwork_pins set image_id = plan where id = both_pin;
  exception when insufficient_privilege then rejected := true;
  end;
  assert rejected, 'a pin moves to another image';

  delete from public.glossary_entries where id = term;
  assert (select glossary_entry_id from public.artwork_pins where id = both_pin) is null,
    'deleting an entry keeps it on its pins';
  assert (select text from public.artwork_pins where id = both_pin) = 'The sculpted field',
    'deleting an entry removes the text of a pin';
  assert (select count(*) from public.artwork_pins where image_id = facade) = 9,
    'deleting an entry keeps a pin that has no text left';

  perform public.save_artwork(
    '{"title": "Parthenon", "author_unknown": true}', '{}', saved,
    jsonb_build_array(jsonb_build_object('id', facade, 'own_image_url', 'https://example.com/replaced.jpg')));
  assert (select count(*) from public.artwork_pins where image_id = facade) = 9,
    'replacing an image drops its pins';
  assert (select count(*) from public.artwork_pins where image_id = plan) = 0,
    'removing an image keeps its pins';

  delete from public.artworks where id = saved;
  assert (select count(*) from public.artwork_pins) = 0, 'deleting an artwork keeps its pins';
end;
$$;

do $$
declare
  saved uuid;
  image uuid;
  term uuid;
  viewed uuid;
  rejected boolean := false;
begin
  select id into saved from public.save_artwork(
    '{"title": "Arnolfini Portrait", "author_unknown": true}', '{}', null,
    '[{"own_image_url": "https://example.com/arnolfini.jpg"}]');
  select id into image from public.artwork_images where artwork_id = saved;
  insert into public.glossary_entries (name, category) values ('Convex mirror', 'painting') returning id into term;

  insert into public.artwork_pins (image_id, x, y, view_width) values (image, 0.5, 0.4, 0.1);
  insert into public.artwork_pins (image_id, x, y, glossary_entry_id, view_width)
    values (image, 0.5, 0.4, term, 0.2) returning id into viewed;
  assert (select count(*) from public.artwork_pins where image_id = image) = 2,
    'a pin with only a view is not stored';

  begin
    insert into public.artwork_pins (image_id, x, y, view_width) values (image, 0.5, 0.4, 1.5);
  exception when check_violation then rejected := true;
  end;
  assert rejected, 'a view wider than the image is stored';

  delete from public.glossary_entries where id = term;
  assert exists (select 1 from public.artwork_pins where id = viewed),
    'deleting an entry drops a pin that keeps a view';
end;
$$;

rollback;
