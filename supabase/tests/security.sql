\set ON_ERROR_STOP on

begin;

create schema security_test;
grant usage on schema security_test to anon, authenticated;

create function security_test.denied(statement text)
returns boolean
language plpgsql
as $$
begin
  execute statement;
  return false;
exception
  when insufficient_privilege or check_violation or foreign_key_violation
    or no_data_found or not_null_violation or restrict_violation or unique_violation then
    return true;
end;
$$;

create function security_test.affected(statement text)
returns bigint
language plpgsql
as $$
declare
  changed bigint;
begin
  execute statement;
  get diagnostics changed = row_count;
  return changed;
end;
$$;

create function security_test.act_as(user_id uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

grant execute on all functions in schema security_test to anon, authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
  table_name text;
  routine record;
begin
  for table_name in
    select relname from pg_class
      where relnamespace in ('public'::regnamespace, 'private'::regnamespace)
        and relkind in ('r', 'p') and not relrowsecurity
  loop
    raise exception 'row level security is off on %', table_name;
  end loop;

  for table_name in
    select format('%I.%I', schemaname, tablename) from pg_tables where schemaname in ('public', 'private')
  loop
    assert not has_table_privilege('anon', table_name, 'select,insert,update,delete'),
      format('anon has table privileges on %s', table_name);
  end loop;

  for routine in
    select p.oid::regprocedure as signature, p.proname, p.prosecdef, p.proconfig
      from pg_proc as p
      where p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)
  loop
    assert routine.proconfig is not null and 'search_path=""' = any (routine.proconfig),
      format('%s does not pin an empty search_path', routine.signature);
    assert not has_function_privilege('anon', routine.signature, 'execute')
      or routine.proname = 'keep_alive',
      format('anon can execute %s', routine.signature);
    assert not routine.prosecdef or not has_function_privilege('authenticated', routine.signature, 'execute'),
      format('authenticated can execute the security definer function %s', routine.signature);
  end loop;

  assert not has_schema_privilege('anon', 'private', 'usage')
    and not has_schema_privilege('authenticated', 'private', 'usage'),
    'the private schema is reachable by API roles';
end;
$$;

set local role authenticated;
select security_test.act_as('00000000-0000-0000-0000-00000000000a');

select id, record_number from public.save_artwork(
  '{"title": "Owner A work", "author_unknown": true, "era_code": "early_modern"}',
  '{"author": [], "period": ["Baroque"], "style": ["Tenebrism"]}',
  null,
  '[{"own_image_path": "00000000-0000-0000-0000-00000000000a/plan.jpg", "image_width": 4, "image_height": 3}]'
);

insert into public.category_values (category_code, name) values ('style', 'Unlinked');
insert into public.category_values (category_code, name) values ('author', 'Painter');

insert into public.period_details (value_id, summary)
  select id, 'Period summary' from public.category_values where category_code = 'period';
insert into public.era_details (era_code, summary) values ('early_modern', 'Era summary');
insert into public.glossary_entries (name, category, definition, forms)
  values ('Tympanum', 'architecture', 'A definition', '{tympana}');
insert into public.timeline_events (name, year_from, year_to, description)
  values ('Thirty Years'' War', 1618, 1648, 'A description');

insert into storage.objects (bucket_id, name)
  values ('artwork-images', '00000000-0000-0000-0000-00000000000a/work.jpg');

select public.record_review(
  (select id from public.artworks),
  '{"due": "2026-10-16T10:00:00Z", "stability": 2.3, "difficulty": 5.1, "state": 1, "reps": 1, "lapses": 0, "scheduled_days": 0, "learning_steps": 1, "last_review": "2026-10-16T09:50:00Z", "elapsed_days": 0}',
  '{"mode": "quiz_title", "rating": 2, "correct": true, "answer_ms": 4200}'
);

insert into public.artwork_fields (name, kind) values ('Lecture', 'list'), ('Source', 'text');
insert into public.category_values (category_code, name)
  select id::text, 'Baroque class' from public.artwork_fields where name = 'Lecture';
insert into public.artwork_field_entries (artwork_id, field_id, field_kind, text_value)
  select artwork.id, field.id, 'text', 'A source'
    from public.artworks as artwork cross join public.artwork_fields as field
    where field.name = 'Source';

reset role;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
  a_artwork uuid;
  a_value uuid;
  a_unlinked uuid;
  a_author uuid;
  a_merged uuid;
  a_lecture uuid;
  a_source uuid;
begin
  select id into a_artwork from public.artworks where owner_id = a;
  select id into a_value from public.category_values where owner_id = a and category_code = 'period';
  select id into a_unlinked from public.category_values where owner_id = a and name = 'Unlinked';
  select id into a_author from public.category_values where owner_id = a and name = 'Painter';
  select id into a_lecture from public.artwork_fields where owner_id = a and name = 'Lecture';
  select id into a_source from public.artwork_fields where owner_id = a and name = 'Source';
  assert a_artwork is not null and a_value is not null, 'fixture for owner A was not created';
  assert a_lecture is not null and a_source is not null, 'fields of owner A were not created';

  set local role authenticated;
  perform security_test.act_as(b);

  assert (select count(*) from public.artworks) = 0, 'B reads artworks of A';
  assert (select count(*) from public.category_values) = 0, 'B reads category values of A';
  assert (select count(*) from public.artwork_values) = 0, 'B reads artwork values of A';
  assert (select count(*) from public.artwork_images) = 0, 'B reads artwork images of A';
  assert (select count(*) from public.period_eras) = 0, 'B reads period eras of A';
  assert (select count(*) from public.style_periods) = 0, 'B reads style periods of A';
  assert (select count(*) from public.period_details) = 0, 'B reads period details of A';
  assert (select count(*) from public.era_details) = 0, 'B reads era details of A';
  assert (select count(*) from public.glossary_entries) = 0, 'B reads glossary entries of A';
  assert (select count(*) from public.timeline_events) = 0, 'B reads timeline events of A';
  assert (select count(*) from storage.objects) = 0, 'B reads image objects of A';
  assert (select count(*) from public.value_usage()) = 0, 'B sees value usage of A';
  assert (select count(*) from public.artwork_fields) = 0, 'B reads artwork fields of A';
  assert (select count(*) from public.artwork_field_entries) = 0, 'B reads field entries of A';
  assert (select count(*) from public.artwork_field_usage()) = 0, 'B sees field usage of A';
  assert (select count(*) from public.categories) = 5, 'B reads the categories of the fields of A';
  assert (select count(*) from public.notes_mentions()) = 0, 'B sees the notes of A';
  assert not (select has_content from public.value_page_content(a_value)),
    'B sees the page content of a value of A';
  assert (select count(*) from public.eras) = 6, 'B cannot read the shared eras';
  assert (select count(*) from public.review_cards) = 0, 'B reads review cards of A';
  assert (select count(*) from public.review_log) = 0, 'B reads the review log of A';
  assert (select due + new_available + new_today + with_image from public.review_counts('2026-10-16T00:00:00Z')) = 0,
    'B counts reviews of A';
  assert public.review_streak('2026-10-16T00:00:00Z', 'UTC') = 0, 'B counts the review streak of A';
  assert public.review_session('2026-10-16T00:00:00Z') = '[]'::jsonb, 'B builds a session of A';
  assert public.review_session('2026-10-16T00:00:00Z', 'mixed', 'all', null, 0) = '[]'::jsonb,
    'B builds a free session of A';

  assert security_test.affected(format('update public.artworks set title = ''x'' where id = %L', a_artwork)) = 0,
    'B updates an artwork of A';
  assert security_test.affected(format('delete from public.artworks where id = %L', a_artwork)) = 0,
    'B deletes an artwork of A';
  assert security_test.affected(format('update public.category_values set name = ''x'' where id = %L', a_value)) = 0,
    'B renames a value of A';
  assert security_test.affected(format('delete from public.category_values where id = %L', a_value)) = 0,
    'B deletes a value of A';
  assert security_test.affected(format(
    'update public.period_details set summary = ''x'' where value_id = %L', a_value)) = 0,
    'B updates period details of A';
  assert security_test.affected('update public.era_details set summary = ''x''') = 0,
    'B updates era details of A';
  assert security_test.affected('update public.review_cards set due = now()') = 0,
    'B reschedules a review card of A';
  assert security_test.affected('update public.glossary_entries set definition = ''x''') = 0,
    'B updates a glossary entry of A';
  assert security_test.affected('delete from public.glossary_entries') = 0,
    'B deletes a glossary entry of A';
  assert security_test.affected('update public.timeline_events set name = ''x''') = 0,
    'B updates a timeline event of A';
  assert security_test.affected('update public.artwork_fields set name = ''x''') = 0,
    'B renames an artwork field of A';
  assert security_test.affected('delete from public.artwork_fields') = 0,
    'B deletes an artwork field of A';
  assert security_test.affected('delete from public.artwork_field_entries') = 0,
    'B deletes field entries of A';
  assert security_test.affected('delete from public.timeline_events') = 0,
    'B deletes a timeline event of A';

  assert security_test.denied(format(
    'insert into public.artworks (owner_id, title, author_unknown) values (%L, ''Forged'', true)', a)),
    'B inserts an artwork owned by A';
  assert security_test.denied(format(
    'insert into public.artwork_values (artwork_id, value_id) values (%L, %L)', a_artwork, a_unlinked)),
    'B links a value to an artwork of A';
  assert security_test.denied(format(
    'insert into public.glossary_entries (owner_id, name, category) values (%L, ''Forged'', ''general'')', a)),
    'B inserts a glossary entry owned by A';
  assert security_test.denied(format(
    'insert into public.timeline_events (owner_id, name, year_to) values (%L, ''Forged'', 1500)', a)),
    'B inserts a timeline event owned by A';
  assert security_test.denied(format(
    'insert into public.feedback (owner_id, kind, title) values (%L, ''bug'', ''Forged'')', a)),
    'B sends feedback owned by A';
  assert security_test.denied(format(
    'insert into public.period_eras (value_id, era_code) values (%L, ''modern'')', a_value)),
    'B adds an era to a period of A';
  assert security_test.denied(format(
    'insert into public.category_values (category_code, name) values (%L, ''Forged'')', a_lecture)),
    'B adds a value to a list field of A';
  assert security_test.denied(format(
    'insert into public.artwork_field_entries (artwork_id, field_id, field_kind, text_value) values (%L, %L, ''text'', ''Forged'')',
    a_artwork, a_source)),
    'B fills in a field of A';
  assert security_test.denied(format(
    'insert into public.artwork_fields (owner_id, name, kind) values (%L, ''Forged'', ''text'')', a)),
    'B inserts an artwork field owned by A';
  assert security_test.denied(format('select public.move_artwork_field(%L, 1)', a_lecture)),
    'B moves an artwork field of A';
  perform public.save_artwork('{"title": "B work", "author_unknown": true}',
    jsonb_build_object('author', '[]'::jsonb), null, null, jsonb_build_object(a_source::text, 'Forged'));
  assert (select count(*) from public.artwork_field_entries) = 0,
    'B fills in a field of A through save_artwork';
  assert security_test.denied(format(
    'select public.save_artwork(''{"title": "B list", "author_unknown": true}'', ''{"author": [], "%s": ["Forged"]}'')',
    a_lecture)),
    'B adds a value to a list field of A through save_artwork';
  assert security_test.denied(format(
    'insert into public.style_details (value_id, summary) values (%L, ''Forged'')', a_unlinked)),
    'B adds details to a value of A';
  assert security_test.denied(format(
    'select public.save_value_details(%L, ''{"summary": "Forged"}'')', a_value)),
    'B saves details of a value of A through save_value_details';
  perform public.save_era_details('early_modern', '{"summary": "B era"}');
  assert (select count(*) from public.era_details) = 1, 'B does not get era details of their own';
  assert security_test.denied(format(
    'select public.save_artwork(''{"title": "Overwrite", "author_unknown": true}'', ''{}'', %L)', a_artwork)),
    'B overwrites an artwork of A through save_artwork';
  assert security_test.denied(format('select public.merge_category_values(%L, %L)', a_value, a_value)),
    'B merges values of A';
  assert security_test.denied(format('select public.delete_unused_value(%L)', a_value)),
    'B deletes a value of A through delete_unused_value';
  assert security_test.denied(format('select public.set_period_eras(%L, ''{modern}'')', a_value)),
    'B changes the eras of a period of A';
  assert security_test.denied(format(
    'select public.record_review(%L, ''{"due": "2026-10-17T00:00:00Z", "stability": 1, "difficulty": 1, "state": 2, "reps": 1, "lapses": 0, "scheduled_days": 1, "learning_steps": 0}'', ''{"mode": "flashcard", "rating": 3}'')',
    a_artwork)),
    'B records a review of an artwork of A';

  assert security_test.denied(format(
    'insert into storage.objects (bucket_id, name) values (''artwork-images'', ''%s/forged.jpg'')', a)),
    'B uploads into the folder of A';
  assert security_test.denied(
    'insert into storage.objects (bucket_id, name) values (''artwork-images'', ''loose.jpg'')'),
    'B uploads outside of any folder';
  assert security_test.denied(format(
    'insert into public.artwork_images (artwork_id, position, own_image_url) values (%L, 1, ''https://example.com/b.jpg'')',
    a_artwork)),
    'B adds an image to an artwork of A';
  assert security_test.denied(format(
    'select public.save_artwork(''{"title": "Mine", "author_unknown": true}'', ''{}'', null, ''[{"own_image_path": "%s/plan.jpg"}]'')',
    a)),
    'B points an extra image at an image of A';
  assert security_test.affected('delete from public.artwork_images') = 0, 'B deletes artwork images of A';

  perform security_test.act_as(a);

  assert (select count(*) from public.glossary_entries) = 1, 'A does not see their glossary entry';
  assert not security_test.denied(
    'insert into public.glossary_entries (name, category, forms) values (''Sfumato'', ''technique'', ''{sfumata,sfumatem}'')'),
    'A cannot add a glossary entry';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category) values (''tympanum'', ''architecture'')'),
    'A adds a glossary entry whose name differs only in letter case';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category) values (''Fresco'', ''fresco'')'),
    'A gives a glossary entry a category that does not exist';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category) values ('' Padded '', ''general'')'),
    'A adds a glossary entry with a padded name';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category, definition) values (''Blank'', ''general'', '''')'),
    'A adds a glossary entry with an empty definition';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category, forms) values (''Blank forms'', ''general'', ''{a,""}'')'),
    'A adds a glossary entry with an empty form';
  assert not security_test.denied(
    'insert into public.glossary_entries (name, category, synonyms, sort_name) values (''Lorenzo de Medici'', ''person'', ''{Lorenzo Wspaniały}'', ''Medici, Lorenzo de'')'),
    'A cannot add a glossary entry with synonyms and a sort name';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category, synonyms) values (''Blank synonyms'', ''general'', ''{a,""}'')'),
    'A adds a glossary entry with an empty synonym';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category, sort_name) values (''Padded sort'', ''general'', '' Sort '')'),
    'A adds a glossary entry with a padded sort name';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category, sort_name) values (''Blank sort'', ''general'', '''')'),
    'A adds a glossary entry with an empty sort name';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category, source_title) values (''Half source'', ''general'', ''Title'')'),
    'A adds a glossary entry with a half-filled source';
  assert security_test.denied(
    'insert into public.glossary_entries (name, category, source_title, source_url, source_licence, source_fetched_on) values (''Insecure'', ''general'', ''Title'', ''http://pl.wikipedia.org/wiki/Title'', ''CC BY-SA 4.0'', ''2026-10-17'')'),
    'A adds a glossary entry with a source address that is not https';
  assert not security_test.denied(
    'insert into public.glossary_entries (name, category, definition, source_title, source_url, source_licence, source_fetched_on) values (''Whole source'', ''general'', ''Text'', ''Title'', ''https://pl.wikipedia.org/wiki/Title'', ''CC BY-SA 4.0'', ''2026-10-17'')'),
    'A cannot add a glossary entry with a whole source';
  assert security_test.denied('update public.glossary_entries set owner_id = gen_random_uuid()'),
    'A changes the owner of a glossary entry';
  assert security_test.denied('update public.glossary_entries set created_at = now()'),
    'A changes when a glossary entry was created';

  assert (select count(*) from public.timeline_events) = 1, 'A does not see their timeline event';
  assert not security_test.denied(
    'insert into public.timeline_events (name, year_to, year_approximate) values (''Birth of Jesus'', -4, true)'),
    'A cannot add a timeline event with a single year';
  assert not security_test.denied(
    'insert into public.timeline_events (name, year_from, year_to) values (''Pax Romana'', -27, 180)'),
    'A cannot add a timeline event across the turn of the eras';
  assert security_test.denied(
    'insert into public.timeline_events (name) values (''Undated'')'),
    'A adds a timeline event without a year';
  assert security_test.denied(
    'insert into public.timeline_events (name, year_to) values (''Year zero'', 0)'),
    'A adds a timeline event in the year 0';
  assert security_test.denied(
    'insert into public.timeline_events (name, year_from, year_to) values (''Backwards'', 1815, 1803)'),
    'A adds a timeline event that ends before it starts';
  assert security_test.denied(
    'insert into public.timeline_events (name, year_from, year_to) values (''Same year'', 1648, 1648)'),
    'A adds a timeline event whose span starts and ends in the same year';
  assert security_test.denied(
    'insert into public.timeline_events (name, year_to) values ('' Padded '', 1500)'),
    'A adds a timeline event with a padded name';
  assert security_test.denied(
    'insert into public.timeline_events (name, year_to, description) values (''Blank'', 1500, '''')'),
    'A adds a timeline event with an empty description';
  assert security_test.denied(format(
    'insert into public.timeline_events (name, year_to, description) values (''Long'', 1500, %L)', repeat('a', 301))),
    'A adds a timeline event with a description over 300 characters';
  assert security_test.denied(format(
    'insert into public.timeline_events (name, year_to) values (%L, 1500)', repeat('a', 121))),
    'A adds a timeline event with a name over 120 characters';
  assert security_test.denied(
    'insert into public.timeline_events (name, year_to, source_title) values (''Half source'', 1500, ''Title'')'),
    'A adds a timeline event with a half-filled source';
  assert security_test.denied(
    'insert into public.timeline_events (name, year_to, source_title, source_url, source_licence, source_fetched_on) values (''Insecure'', 1500, ''Title'', ''http://pl.wikipedia.org/wiki/Title'', ''CC BY-SA 4.0'', ''2026-10-21'')'),
    'A adds a timeline event with a source address that is not https';
  assert not security_test.denied(
    'insert into public.timeline_events (name, year_to, description, source_title, source_url, source_licence, source_fetched_on) values (''Whole source'', 1500, ''Text'', ''Title'', ''https://pl.wikipedia.org/wiki/Title'', ''CC BY-SA 4.0'', ''2026-10-21'')'),
    'A cannot add a timeline event with a whole source';
  assert security_test.denied('update public.timeline_events set owner_id = gen_random_uuid()'),
    'A changes the owner of a timeline event';
  assert security_test.denied('update public.timeline_events set created_at = now()'),
    'A changes when a timeline event was created';

  assert not security_test.denied(
    'insert into public.feedback (kind, title, description) values (''bug'', ''Broken filter'', ''Details'')'),
    'A cannot send feedback';
  assert not security_test.denied(
    'insert into public.feedback (kind, title) values (''idea'', ''Dark mode'')'),
    'A cannot send feedback without a description';
  assert security_test.denied('select * from public.feedback'), 'A reads feedback';
  assert security_test.denied('update public.feedback set title = ''x'''), 'A updates feedback';
  assert security_test.denied('delete from public.feedback'), 'A deletes feedback';
  assert security_test.denied(
    'insert into public.feedback (kind, title) values (''question'', ''Wrong kind'')'),
    'A sends feedback of an unknown kind';
  assert security_test.denied(
    'insert into public.feedback (kind, title) values (''bug'', '' Padded '')'),
    'A sends feedback with a padded title';
  assert security_test.denied(
    'insert into public.feedback (kind, title) values (''bug'', '''')'),
    'A sends feedback with an empty title';
  assert security_test.denied(
    'insert into public.feedback (kind, title, description) values (''bug'', ''Blank'', '''')'),
    'A sends feedback with an empty description';
  assert security_test.denied(
    format('insert into public.feedback (kind, title) values (''bug'', %L)', repeat('x', 121))),
    'A sends feedback with a title over 120 characters';
  assert security_test.denied(
    format('insert into public.feedback (kind, title, description) values (''bug'', ''Long'', %L)', repeat('x', 4001))),
    'A sends feedback with a description over 4000 characters';

  assert security_test.denied('update public.artworks set owner_id = gen_random_uuid()'),
    'A changes the owner of an artwork';
  assert security_test.denied('update public.artworks set record_number = 99'),
    'A changes the record number of an artwork';
  assert security_test.denied('insert into public.artworks (record_number, title, author_unknown) values (99, ''x'', true)'),
    'A chooses a record number';
  assert security_test.denied(
    'select public.save_artwork(''{"title": "Span", "author_unknown": true, "year_from": 1503}'', ''{}'')'),
    'A saves a year span without an end year';
  assert security_test.denied(
    'select public.save_artwork(''{"title": "Span", "author_unknown": true, "year_from": 1519, "year_to": 1503}'', ''{}'')'),
    'A saves a year span that ends before it starts';
  assert not security_test.denied(
    'select public.save_artwork(''{"title": "Span", "author_unknown": true, "year_from": -50, "year_to": 20}'', ''{}'')'),
    'A cannot save a year span across the turn of the eras';
  assert security_test.denied(format(
    'insert into public.style_details (value_id, summary) values (%L, ''Wrong kind'')', a_value)),
    'A adds style details to a period';
  assert security_test.denied(format(
    'insert into public.period_details (value_id, category_code) values (%L, ''style'')', a_unlinked)),
    'A sets the kind of a details row';
  assert security_test.denied(format(
    'update public.period_details set summary = repeat(''x'', 301) where value_id = %L', a_value)),
    'A saves a summary longer than 300 characters';
  assert security_test.denied(format(
    'update public.period_details set summary = '''' where value_id = %L', a_value)),
    'A saves an empty summary';
  assert security_test.denied(format(
    'insert into public.author_details (value_id, birth_year, death_year) values (%L, 1519, 1452)', a_author)),
    'A saves an author who dies before being born';
  assert security_test.denied(format(
    'insert into public.author_details (value_id, own_image_path) values (%L, ''%s/portrait.jpg'')', a_author, b)),
    'A points a portrait at the folder of B';
  assert security_test.denied(format(
    'insert into public.location_details (value_id, place_type) values (%L, ''garden'')', a_author)),
    'A saves location details for an author';
  assert security_test.denied('insert into public.era_details (era_code) values (''forged'')'),
    'A saves details of an era that does not exist';

  perform public.save_artwork(
    '{"title": "Catalogue work", "author_unknown": true}',
    '{"author": [], "location": ["Luwr"]}');
  perform public.save_artwork(
    '{"title": "Own place work", "author_unknown": true}',
    '{"author": [], "location": ["Cellar"]}');
  assert (select country_code from public.location_details as details
      join public.category_values as value on value.id = details.value_id where value.name = 'Luwr') = 'FR',
    'a museum from the catalogue does not bring its country';
  assert (select place_type from public.location_details as details
      join public.category_values as value on value.id = details.value_id where value.name = 'Luwr') = 'museum',
    'a museum from the catalogue is not a museum';
  assert (select catalogue_wikidata_id from public.location_details as details
      join public.category_values as value on value.id = details.value_id where value.name = 'Luwr') = 'Q19675',
    'a museum from the catalogue does not remember where it came from';
  assert not exists (select 1 from public.location_details as details
      join public.category_values as value on value.id = details.value_id where value.name = 'Cellar'),
    'a place missing from the catalogue gets details';
  assert (select count(*) from public.catalogue_museums) > 100, 'A does not read the museum catalogue';
  assert security_test.denied('insert into public.catalogue_museums (wikidata_id, name, country_code) values (''Q1'', ''Forged'', ''FR'')'),
    'A adds a museum to the catalogue';
  assert security_test.denied('update public.catalogue_museums set country_code = ''PL'''),
    'A changes a museum in the catalogue';
  assert security_test.denied('delete from public.catalogue_museums'),
    'A deletes a museum from the catalogue';
  assert security_test.denied(format(
    'insert into public.location_details (value_id, catalogue_wikidata_id) values (%L, ''Q404'')',
    (select id from public.category_values where name = 'Cellar'))),
    'A points a place at a museum that is not in the catalogue';
  assert not security_test.denied(format(
    'insert into public.author_details (value_id, birth_year, death_year, years_approximate) values (%L, -480, -430, true)', a_author)),
    'A cannot save the years of life of an author';

  perform security_test.affected(format(
    'insert into public.style_details (value_id, summary) values (%L, ''Style summary'')', a_unlinked));
  perform public.delete_unused_value(a_unlinked);
  assert (select count(*) from public.style_details) = 0, 'deleting a value keeps its details';

  assert (select has_content from public.value_page_content(a_value)), 'A does not see their page content';
  assert security_test.denied(format(
    'update public.period_details set notes = '''' where value_id = %L', a_value)),
    'A saves empty notes';

  insert into public.category_values (category_code, name) values ('period', 'Merged') returning id into a_merged;
  insert into public.period_details (value_id, summary) values (a_merged, 'Merged summary');
  update public.artworks set notes = format('See [Merged](/atelier/values/period/%s) and [x](/atelier/12).', a_merged)
    where id = a_artwork;
  update public.period_details set notes = format('Also [Merged](/atelier/values/period/%s).', a_merged)
    where value_id = a_value;
  perform public.merge_category_values(a_merged, a_value);
  assert (select notes from public.artworks where id = a_artwork)
      = format('See [Merged](/atelier/values/period/%s) and [x](/atelier/12).', a_value),
    'merging rewrites links to the merged value in artwork notes';
  assert (select notes from public.period_details where value_id = a_value)
      = format('Also [Merged](/atelier/values/period/%s).', a_value),
    'merging rewrites links to the merged value in value notes';
  assert (select array_agg(summary) from public.period_details) = array['Period summary'],
    'merging keeps the details of the merged value or drops those of the kept one';

  perform public.save_value_details(a_value, '{"notes": "Period notes"}');
  assert (select summary from public.period_details where value_id = a_value) = 'Period summary',
    'save_value_details clears a field it was not given';
  perform public.save_value_details(a_value, '{"summary": "  "}');
  assert (select summary from public.period_details where value_id = a_value) is null,
    'save_value_details keeps a blank summary';
  perform public.save_value_details(a_value, '{"summary": "Period summary"}');
  perform public.save_value_details(a_author, '{"death_year": 1519, "sort_name": "Painter, The"}');
  assert (select birth_year from public.author_details where value_id = a_author) = -480,
    'save_value_details clears the year of birth of an author';
  assert security_test.denied(format(
    'select public.save_value_details(%L, ''{"summary": "%s"}'')', a_value, repeat('x', 301))),
    'A saves a summary longer than 300 characters through save_value_details';
  perform public.save_era_details('early_modern', '{"notes": "Era notes"}');
  assert (select summary from public.era_details where era_code = 'early_modern') = 'Era summary',
    'save_era_details clears a field it was not given';

  assert security_test.denied('insert into public.categories (code, multiple, position) values (''forged'', true, 99)'),
    'A adds a category';
  assert security_test.denied('update public.categories set multiple = false'),
    'A changes a category';
  assert security_test.denied('update public.artwork_fields set kind = ''flag'''),
    'A changes the kind of an artwork field';
  assert security_test.denied('update public.artwork_fields set multiple = true'),
    'A changes the number of values of an artwork field';
  assert security_test.denied('update public.artwork_fields set owner_id = gen_random_uuid()'),
    'A changes the owner of an artwork field';
  assert security_test.denied(format(
    'insert into public.artwork_field_entries (artwork_id, field_id, field_kind) values (%L, %L, ''flag'')',
    a_artwork, a_lecture)),
    'A ticks a list field';
  assert security_test.denied(
    'insert into public.artwork_fields (name, kind) values (''Padded '', ''text'')'),
    'A adds an artwork field with a padded name';
  assert security_test.denied(format(
    'insert into public.artwork_fields (name, kind) values (%L, ''text'')', repeat('x', 61))),
    'A adds an artwork field with a name over 60 characters';
  assert security_test.denied(format(
    'insert into public.artwork_fields (name, description, kind) values (''Long'', %L, ''text'')', repeat('x', 151))),
    'A adds an artwork field with a description over 150 characters';
  assert security_test.denied(
    'insert into public.artwork_fields (name, kind) values (''Number'', ''number'')'),
    'A adds an artwork field of an unknown kind';
  assert security_test.denied('update public.eras set position = 99'), 'A changes an era';
  assert security_test.denied('insert into public.artwork_types (code, position) values (''forged'', 99)'),
    'A adds an artwork type';
  assert security_test.denied('select * from private.record_counters'), 'A reads the record counters';
  assert security_test.denied('update public.review_cards set owner_id = gen_random_uuid()'),
    'A changes the owner of a review card';
  assert security_test.denied('update public.review_cards set created_at = now()'),
    'A changes when a review card was created';
  assert security_test.denied('update public.review_log set rating = 3'), 'A rewrites the review log';
  assert security_test.denied('delete from public.review_log'), 'A deletes from the review log';
  assert security_test.denied(format(
    'select public.record_review(%L, ''{"due": "2026-10-17T00:00:00Z", "stability": 1, "difficulty": 1, "state": 2, "reps": 1, "lapses": 0, "scheduled_days": 1, "learning_steps": 0}'', ''{"mode": "flashcard", "rating": 4}'')',
    a_artwork)),
    'A records a rating out of range';
  assert security_test.denied(format(
    'select public.record_review(%L, ''{"due": "2026-10-17T00:00:00Z", "stability": 1, "difficulty": 1, "state": 2, "reps": 1, "lapses": 0, "scheduled_days": 1, "learning_steps": 0}'', ''{"mode": "quiz_image", "rating": 1}'')',
    a_artwork)),
    'A records a quiz answer without saying whether it was right';
  perform public.record_review(a_artwork,
    '{"due": "2026-10-20T00:00:00Z", "stability": 4, "difficulty": 5, "state": 2, "reps": 2, "lapses": 0, "scheduled_days": 4, "learning_steps": 0, "last_review": "2026-10-16T10:00:00Z"}',
    '{"mode": "flashcard", "rating": 3, "answer_ms": 3000}');
  assert (select count(*) from public.review_cards) = 1, 'a second review adds a card instead of updating it';
  assert (select reps from public.review_cards) = 2, 'record_review does not update the card';
  assert (select count(*) from public.review_log) = 2, 'record_review does not log every answer';
  assert (select with_image from public.review_counts('2026-10-16T00:00:00Z')) = 1,
    'review_counts does not count an artwork with a main image';
  assert (select count(*) from storage.objects) = 1, 'A does not see their own image object';

  reset role;
  set local role anon;

  assert security_test.denied('select * from public.artworks'), 'anon reads artworks';
  assert security_test.denied('select * from public.eras'), 'anon reads eras';
  assert security_test.denied('select * from public.era_details'), 'anon reads era details';
  assert security_test.denied('select * from public.author_details'), 'anon reads author details';
  assert security_test.denied('select * from public.catalogue_museums'), 'anon reads the museum catalogue';
  assert security_test.denied('select * from public.glossary_entries'), 'anon reads glossary entries';
  assert (select count(*) from storage.objects) = 0, 'anon reads image objects';
  assert security_test.denied('select public.value_usage()'), 'anon executes value_usage';
  assert security_test.denied('select * from public.artwork_fields'), 'anon reads artwork fields';
  assert security_test.denied('select * from public.artwork_field_entries'), 'anon reads field entries';
  assert security_test.denied('select public.artwork_field_usage()'), 'anon executes artwork_field_usage';
  assert security_test.denied(format('select public.move_artwork_field(%L, 1)', gen_random_uuid())),
    'anon executes move_artwork_field';
  assert security_test.denied('select public.notes_mentions()'), 'anon executes notes_mentions';
  assert security_test.denied(format('select public.value_page_content(%L)', gen_random_uuid())),
    'anon executes value_page_content';
  assert security_test.denied('select public.save_artwork(''{}'', ''{}'')'), 'anon executes save_artwork';
  assert security_test.denied('select * from public.review_cards'), 'anon reads review cards';
  assert security_test.denied('select public.review_counts(now())'), 'anon executes review_counts';
  assert security_test.denied('select public.review_session(now())'), 'anon executes review_session';
  assert security_test.denied('select public.review_streak(now(), ''UTC'')'), 'anon executes review_streak';
  assert security_test.denied('select public.save_era_details(''antiquity'', ''{}'')'),
    'anon executes save_era_details';
  assert (select public.keep_alive()) is not null, 'anon cannot execute keep_alive';

  reset role;
end;
$$;

rollback;
