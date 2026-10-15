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
    or no_data_found or restrict_violation then
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
  '{"author": [], "period": ["Baroque"], "style": ["Tenebrism"]}'
);

insert into public.category_values (category_code, name) values ('style', 'Unlinked');
insert into public.category_values (category_code, name) values ('author', 'Painter');

insert into public.period_details (value_id, summary)
  select id, 'Period summary' from public.category_values where category_code = 'period';
insert into public.era_details (era_code, summary) values ('early_modern', 'Era summary');

insert into storage.objects (bucket_id, name)
  values ('artwork-images', '00000000-0000-0000-0000-00000000000a/work.jpg');

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
begin
  select id into a_artwork from public.artworks where owner_id = a;
  select id into a_value from public.category_values where owner_id = a and category_code = 'period';
  select id into a_unlinked from public.category_values where owner_id = a and name = 'Unlinked';
  select id into a_author from public.category_values where owner_id = a and name = 'Painter';
  assert a_artwork is not null and a_value is not null, 'fixture for owner A was not created';

  set local role authenticated;
  perform security_test.act_as(b);

  assert (select count(*) from public.artworks) = 0, 'B reads artworks of A';
  assert (select count(*) from public.category_values) = 0, 'B reads category values of A';
  assert (select count(*) from public.artwork_values) = 0, 'B reads artwork values of A';
  assert (select count(*) from public.period_eras) = 0, 'B reads period eras of A';
  assert (select count(*) from public.style_periods) = 0, 'B reads style periods of A';
  assert (select count(*) from public.period_details) = 0, 'B reads period details of A';
  assert (select count(*) from public.era_details) = 0, 'B reads era details of A';
  assert (select count(*) from storage.objects) = 0, 'B reads image objects of A';
  assert (select count(*) from public.value_usage()) = 0, 'B sees value usage of A';
  assert not (select has_content from public.value_page_content(a_value)),
    'B sees the page content of a value of A';
  assert (select count(*) from public.eras) = 6, 'B cannot read the shared eras';

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

  assert security_test.denied(format(
    'insert into public.artworks (owner_id, title, author_unknown) values (%L, ''Forged'', true)', a)),
    'B inserts an artwork owned by A';
  assert security_test.denied(format(
    'insert into public.artwork_values (artwork_id, value_id) values (%L, %L)', a_artwork, a_unlinked)),
    'B links a value to an artwork of A';
  assert security_test.denied(format(
    'insert into public.period_eras (value_id, era_code) values (%L, ''modern'')', a_value)),
    'B adds an era to a period of A';
  assert security_test.denied(format(
    'insert into public.style_details (value_id, summary) values (%L, ''Forged'')', a_unlinked)),
    'B adds details to a value of A';
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
    'insert into storage.objects (bucket_id, name) values (''artwork-images'', ''%s/forged.jpg'')', a)),
    'B uploads into the folder of A';
  assert security_test.denied(
    'insert into storage.objects (bucket_id, name) values (''artwork-images'', ''loose.jpg'')'),
    'B uploads outside of any folder';
  assert security_test.denied(format(
    'insert into public.artworks (title, author_unknown, own_image_path) values (''Borrowed'', true, ''%s/work.jpg'')', a)),
    'B points an artwork at an image of A';

  perform security_test.act_as(a);

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
  perform public.merge_category_values(a_merged, a_value);
  assert (select array_agg(summary) from public.period_details) = array['Period summary'],
    'merging keeps the details of the merged value or drops those of the kept one';

  assert security_test.denied('insert into public.categories (code, multiple, position) values (''forged'', true, 99)'),
    'A adds a category';
  assert security_test.denied('update public.eras set position = 99'), 'A changes an era';
  assert security_test.denied('insert into public.artwork_types (code, position) values (''forged'', 99)'),
    'A adds an artwork type';
  assert security_test.denied('select * from private.record_counters'), 'A reads the record counters';
  assert (select count(*) from storage.objects) = 1, 'A does not see their own image object';

  reset role;
  set local role anon;

  assert security_test.denied('select * from public.artworks'), 'anon reads artworks';
  assert security_test.denied('select * from public.eras'), 'anon reads eras';
  assert security_test.denied('select * from public.era_details'), 'anon reads era details';
  assert security_test.denied('select * from public.author_details'), 'anon reads author details';
  assert (select count(*) from storage.objects) = 0, 'anon reads image objects';
  assert security_test.denied('select public.value_usage()'), 'anon executes value_usage';
  assert security_test.denied(format('select public.value_page_content(%L)', gen_random_uuid())),
    'anon executes value_page_content';
  assert security_test.denied('select public.save_artwork(''{}'', ''{}'')'), 'anon executes save_artwork';
  assert (select public.keep_alive()) is not null, 'anon cannot execute keep_alive';

  reset role;
end;
$$;

rollback;
