\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test'),
  ('00000000-0000-0000-0000-00000000000c', 'owner-c@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  lecture uuid;
  motifs uuid;
  first_artwork uuid;
  second_artwork uuid;
  third_artwork uuid;
  vermeer uuid;
  baroque uuid;
  tenebrism uuid;
  image uuid;
  term uuid;
begin
  insert into public.artwork_fields (name, kind) values ('Wykład', 'list') returning id into lecture;
  insert into public.artwork_fields (name, kind) values ('Widziane', 'flag');
  insert into public.category_values (category_code, name) values (lecture::text, 'Lecture 1');
  insert into public.category_values (category_code, name) values ('author', 'Fabritius');

  select id into first_artwork from public.save_artwork(
    '{"title": "Girl", "author_unknown": false, "era_code": "early_modern"}',
    '{"author": ["Vermeer"], "period": ["Baroque"], "style": ["Tenebrism"]}',
    null,
    null
  );
  select id into vermeer from public.category_values where name = 'Vermeer';
  select id into baroque from public.category_values where name = 'Baroque';
  select id into tenebrism from public.category_values where name = 'Tenebrism';
  update public.artworks
    set notes = '[Vermeer](/atelier/values/author/' || vermeer || ') and [#0001](/atelier/1)'
    where id = first_artwork;

  select id into second_artwork from public.save_artwork('{"title": "Milkmaid", "author_unknown": true}', '{}', null, null);
  select id into third_artwork from public.save_artwork('{"title": "Trashed", "author_unknown": true}', '{}', null, null);
  update public.artworks set deleted_at = now() where id = third_artwork;
  insert into public.artwork_relations (from_id, to_id, kind) values (first_artwork, second_artwork, 'study');
  insert into public.artwork_relations (from_id, to_id, kind)
    values (least(second_artwork, third_artwork), greatest(second_artwork, third_artwork), 'related');
  insert into public.author_relations (from_id, to_id, kind)
    select vermeer, id, 'influence' from public.category_values where name = 'Fabritius';

  insert into public.artwork_field_entries (artwork_id, field_id, field_kind)
    select first_artwork, id, 'flag' from public.artwork_fields where name = 'Widziane';

  insert into public.artwork_images (artwork_id, position, source_wikidata_id, source_image_file)
    values (first_artwork, 1, 'Q1', 'Girl.jpg') returning id into image;
  insert into public.glossary_entries (name, category, definition) values ('Tenebrism', 'painting', 'Dark') returning id into term;
  insert into public.artwork_pins (image_id, x, y, glossary_entry_id) values (image, 0.25, 0.5, term);
  perform public.save_symbol('Pearl', jsonb_build_array(
    jsonb_build_object('text', 'purity', 'contexts', jsonb_build_array(jsonb_build_object('value_id', vermeer),
      jsonb_build_object('text', 'Dutch genre'))),
    jsonb_build_object('text', 'vanity')));
  insert into public.artwork_pins (image_id, x, y, view_width, symbol_id, symbol_meaning_id)
    select image, 0.5, 0.5, 0.2, meaning.symbol_id, meaning.id from public.symbol_meanings as meaning where meaning.position = 1;
  perform public.set_symbol_cover(pin.symbol_id, pin.id) from public.artwork_pins as pin where pin.symbol_id is not null;
  insert into public.timeline_events (name, year_to) values ('War', 1648);
  perform public.save_visit('{"visited_on": "2026-10-12", "date_precision": "day", "notes": "Seen"}', 'Louvre',
    array[first_artwork, third_artwork]);
  perform public.save_exhibition(gen_random_uuid(), 'Dutch light',
    jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
      jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', first_artwork)),
      jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', second_artwork)))));

  perform public.record_review(first_artwork,
    jsonb_build_object('due', now() + interval '3 days', 'stability', 3, 'difficulty', 5,
      'state', 2, 'reps', 2, 'lapses', 0, 'scheduled_days', 3, 'learning_steps', 0,
      'last_review', now() - interval '1 day'),
    '{"mode": "flashcard", "rating": 3}');
  perform public.record_review(first_artwork,
    jsonb_build_object('due', now() + interval '5 days', 'stability', 4, 'difficulty', 5,
      'state', 2, 'reps', 1, 'lapses', 0, 'scheduled_days', 5, 'learning_steps', 0,
      'last_review', now()),
    '{"facet": "date", "mode": "year", "rating": 3, "correct": true}');
end;
$$;

reset role;

insert into public.author_details (owner_id, value_id, category_code, summary)
  select owner_id, id, 'author', 'Painter' from public.category_values where name = 'Vermeer';

create temp table payloads (payload jsonb);

do $$
declare
  owner constant uuid := '00000000-0000-0000-0000-00000000000a';
  tables constant text[] := array[
    'artworks', 'artwork_images', 'glossary_entries', 'symbols', 'symbol_meanings', 'artwork_pins', 'artwork_fields',
    'category_values', 'artwork_values', 'period_eras', 'style_periods', 'author_details',
    'period_details', 'style_details', 'material_details', 'location_details', 'era_details',
    'artwork_relations', 'author_relations',
    'artwork_field_entries', 'symbol_meaning_contexts', 'timeline_events', 'visits', 'visit_artworks', 'exhibitions', 'review_cards', 'review_log'
  ];
  table_name text;
  rows jsonb;
  data jsonb := '{}';
  text_payload text;
  old_id uuid;
begin
  foreach table_name in array tables loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(t) - ''owner_id'' order by to_jsonb(t) ->> ''position'' desc nulls last), ''[]'') from public.%I as t where t.owner_id = $1',
      table_name
    ) into rows using owner;
    data := data || jsonb_build_object(table_name, rows);
  end loop;
  text_payload := data::text;
  for old_id in
    select (item ->> 'id')::uuid
      from jsonb_each(data) as entry, jsonb_array_elements(entry.value) as item
      where item ? 'id' and (item ->> 'id') ~ '^[0-9a-f-]{36}$'
  loop
    text_payload := replace(text_payload, old_id::text, gen_random_uuid()::text);
  end loop;
  insert into payloads values (text_payload::jsonb);
end;
$$;

grant select on payloads to authenticated;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  payload jsonb := (select p.payload from payloads as p);
  counts jsonb;
  vermeer uuid;
  saved record;
  rejected boolean := false;
begin
  assert jsonb_array_length(payload -> 'artworks') = 3, 'the payload does not hold the artworks';

  counts := public.import_atelier(payload || jsonb_build_object('exhibit_tiers', jsonb_build_array(
    jsonb_build_object('exhibit', 'collection', 'tier', 1, 'tiers', 9, 'unlocked_at', '2026-10-20T10:00:00Z'),
    jsonb_build_object('exhibit', 'removed_exhibit', 'tier', 1, 'tiers', 1, 'unlocked_at', '2026-10-20T10:00:00Z'))));
  assert (counts ->> 'artworks')::integer = 3, 'import_atelier does not count the artworks';
  assert (select array_agg(exhibit) from public.exhibit_tiers) = '{collection}',
    'the import does not skip the tiers of an exhibit missing from the catalogue';

  assert (select array_agg(record_number order by record_number) from public.artworks) = '{1,2,3}',
    'the record numbers do not survive the import';
  assert (select count(*) from public.artworks where deleted_at is not null) = 1,
    'the trash does not survive the import';

  select id into vermeer from public.category_values where name = 'Vermeer';
  assert (select notes from public.artworks where title = 'Girl')
      = '[Vermeer](/atelier/values/author/' || vermeer || ') and [#0001](/atelier/1)',
    'a link to a value in a note does not follow the new id';
  assert (select array_agg(coalesce(link.target_value_id = vermeer, false) order by link.target_value_id nulls first)
      from public.note_links as link
      join public.artworks as source on source.id = link.source_artwork_id
      where source.title = 'Girl') = '{false,true}',
    'the import does not store the links of a note, or stores them before the values exist';
  assert (select count(*) from public.style_periods) = 1
    and (select count(*) from public.author_details) = 1
    and (select count(*) from public.artwork_values) = 3
    and (select count(*) from public.artwork_images) = 1
    and (select count(*) from public.artwork_pins) = 2
    and (select count(*) from public.glossary_entries) = 1
    and (select count(*) from public.timeline_events) = 1
    and (select count(*) from public.review_cards) = 2
    and (select count(*) from public.review_log) = 2
    and (select count(*) from public.artwork_field_entries) = 1
    and (select count(*) from public.visits) = 1
    and (select count(*) from public.visit_artworks) = 2
    and (select count(*) from public.exhibitions) = 1,
    'a table does not come back whole';
  assert (select array_agg(artwork.title order by shown.position)
      from public.exhibition_artworks as shown
      join public.artworks as artwork on artwork.id = shown.artwork_id) = '{Girl,Milkmaid}',
    'the import does not rebuild the artworks of an exhibition from its document';
  assert (select document -> 'content' -> 0 -> 'attrs' ->> 'artworkId' from public.exhibitions)
      = (select id::text from public.artworks where title = 'Girl'),
    'an exhibition does not follow the new id of its artwork';
  assert (select stability from public.review_cards where facet = 'date') = 4
    and (select mode from public.review_log where facet = 'date') = 'year',
    'the date card or its answer does not survive the import';
  assert (select place.name from public.visits as visit
      join public.category_values as place on place.id = visit.place_id) = 'Louvre',
    'a visit does not keep its place';
  assert (select array_agg(name order by position) from public.artwork_fields) = '{Wykład,Widziane}',
    'the fields do not keep their order';
  assert (select count(*) from public.category_values as value
      join public.categories as category on category.code = value.category_code
      where value.name = 'Lecture 1' and category.owner_id = auth.uid()) = 1,
    'the value of a list field does not follow the new field';
  assert (select count(*) from public.artwork_pins as pin
      join public.glossary_entries as entry on entry.id = pin.glossary_entry_id) = 1,
    'a pin does not follow the new glossary entry';

  assert (select array_agg(meaning.text order by meaning.position) from public.symbol_meanings as meaning
      join public.symbols as symbol on symbol.id = meaning.symbol_id where symbol.name = 'Pearl') = '{purity,vanity}',
    'the meanings of a symbol do not keep their order';
  assert (select array_agg(coalesce(value.name, label.text) order by label.position)
      from public.symbol_meaning_contexts as label
      left join public.category_values as value on value.id = label.value_id) = '{Vermeer,"Dutch genre"}',
    'a context label does not follow the new value';
  assert (select meaning.text from public.artwork_pins as pin
      join public.symbol_meanings as meaning on meaning.id = pin.symbol_meaning_id) = 'vanity',
    'a pin does not follow the new symbol and meaning';
  assert (select pin.symbol_id from public.symbols as symbol
      join public.artwork_pins as pin on pin.id = symbol.cover_pin_id) = (select id from public.symbols where name = 'Pearl'),
    'the main detail of a symbol does not follow the new pin';

  assert (select count(*) from public.artwork_relations) = 2,
    'the relations of the artworks do not come back';
  assert (select bool_and(from_id < to_id) from public.artwork_relations where kind = 'related'),
    'a symmetric relation does not keep the order of its new ids';
  assert (select target.title from public.artwork_relations as relation
      join public.artworks as source on source.id = relation.from_id
      join public.artworks as target on target.id = relation.to_id
      where relation.kind = 'study') = 'Milkmaid' and (select source.title from public.artwork_relations as relation
      join public.artworks as source on source.id = relation.from_id where relation.kind = 'study') = 'Girl',
    'a relation does not follow the new ids of its artworks';
  assert (select target.name from public.author_relations as relation
      join public.category_values as source on source.id = relation.from_id
      join public.category_values as target on target.id = relation.to_id
      where source.name = 'Vermeer' and relation.kind = 'influence') = 'Fabritius',
    'a relation of authors does not follow the new ids of its authors';

  select * into saved from public.save_artwork('{"title": "New", "author_unknown": true}', '{}', null, null);
  assert saved.record_number = 4, 'the next record number does not follow the imported ones';

  begin
    perform public.import_atelier(payload);
  exception when others then
    rejected := sqlstate = '55000';
  end;
  assert rejected, 'a second import into a filled atelier was not refused';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
begin
  assert (select count(*) from public.artworks) = 3, 'the import touched the atelier it was made from';
end;
$$;

select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}', true);

do $$
declare
  rejected boolean := false;
begin
  begin
    perform public.import_atelier('[]');
  exception when invalid_parameter_value then
    rejected := true;
  end;
  assert rejected, 'a payload that is not an object was accepted';

  rejected := false;
  begin
    perform public.import_atelier(jsonb_build_object('artworks', jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'record_number', 1, 'title', ' '))));
  exception when check_violation then
    rejected := true;
  end;
  assert rejected, 'a row that breaks a check was accepted';
  assert (select count(*) from public.artworks) = 0, 'a failed import left rows behind';
end;
$$;

select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;

do $$
declare
  rejected boolean := false;
begin
  begin
    perform public.import_atelier('{}');
  exception when insufficient_privilege then
    rejected := true;
  end;
  assert rejected, 'a signed-out visitor can import';
end;
$$;

rollback;
