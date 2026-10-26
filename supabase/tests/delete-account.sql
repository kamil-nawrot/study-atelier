\set ON_ERROR_STOP on

begin;

create schema delete_test;
grant usage on schema delete_test to anon, authenticated;

create function delete_test.failure(statement text)
returns text
language plpgsql
as $$
declare
  state text;
begin
  execute statement;
  return null;
exception
  when others then
    get stacked diagnostics state = returned_sqlstate;
    return state;
end;
$$;

create function delete_test.act_as(user_id uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

grant execute on all functions in schema delete_test to anon, authenticated;

create table delete_test.counts (owner uuid, table_name text, rows bigint);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;

do $$
declare
  learner uuid;
  artwork uuid;
  image uuid;
  field uuid;
begin
  foreach learner in array array[
    '00000000-0000-0000-0000-00000000000a'::uuid, '00000000-0000-0000-0000-00000000000b'::uuid
  ] loop
    perform delete_test.act_as(learner);
    select id into artwork from public.save_artwork(
      '{"title": "Work", "author_unknown": false, "era_code": "early_modern"}',
      '{"author": ["Painter"], "period": ["Baroque"], "style": ["Tenebrism"], "material": ["Oil"]}',
      null,
      '[{"source_wikidata_id": "Q1", "source_image_file": "Work.jpg"}]'
    );
    select id into image from public.artwork_images where artwork_id = artwork limit 1;
    insert into public.artwork_pins (image_id, x, y, text) values (image, 0.5, 0.5, 'A pin');
    insert into public.artwork_fields (name, kind) values ('Source', 'text') returning id into field;
    insert into public.artwork_field_entries (artwork_id, field_id, field_kind, text_value)
      values (artwork, field, 'text', 'A source');
    insert into public.glossary_entries (name, category) values ('Tympanum', 'architecture');
    insert into public.timeline_events (name, year_to) values ('War', 1648);
    insert into public.profiles (display_name) values ('Learner');
    insert into public.era_details (era_code, summary) values ('early_modern', 'Era');
    insert into public.feedback (kind, title) values ('idea', 'An idea');
    perform public.save_visit('{"visited_on": "2026-10-12", "date_precision": "day"}', 'Museum', array[artwork]);
    insert into public.artwork_fields (name, kind) values ('Lecture', 'list');
    insert into public.period_details (value_id, summary)
      select id, 'Period' from public.category_values where name = 'Baroque';
    insert into public.style_details (value_id, summary)
      select id, 'Style' from public.category_values where name = 'Tenebrism';
    insert into public.material_details (value_id, summary)
      select id, 'Material' from public.category_values where name = 'Oil';
    insert into public.author_details (value_id, birth_year)
      select id, 1600 from public.category_values where name = 'Painter';
    insert into public.location_details (value_id, place_type)
      select id, 'museum' from public.category_values where name = 'Museum';
    perform public.record_review(artwork,
      '{"due": "2026-10-30T00:00:00Z", "stability": 1, "difficulty": 1, "state": 2, "reps": 1, "lapses": 0, "scheduled_days": 1, "learning_steps": 0}',
      '{"mode": "flashcard", "rating": 3}');
  end loop;
end;
$$;

reset role;

insert into storage.objects (bucket_id, name) values
  ('artwork-images', '00000000-0000-0000-0000-00000000000a/own.jpg'),
  ('artwork-images', '00000000-0000-0000-0000-00000000000b/own.jpg');

do $$
declare
  table_name text;
begin
  for table_name in
    select format('%I.%I', namespace.nspname, class.relname)
      from pg_class as class
      join pg_namespace as namespace on namespace.oid = class.relnamespace
      where namespace.nspname in ('public', 'private') and class.relkind in ('r', 'p')
        and exists (select 1 from pg_attribute where attrelid = class.oid and attname = 'owner_id')
  loop
    execute format(
      'insert into delete_test.counts select owner_id, %L, count(*) from %s where owner_id is not null group by owner_id',
      table_name, table_name
    );
  end loop;
end;
$$;

set local role authenticated;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
begin
  perform delete_test.act_as(a);
  assert delete_test.failure('select public.delete_account()') = '55000',
    'the account is deleted while its files are still stored';
end;
$$;

reset role;

select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects where name = '00000000-0000-0000-0000-00000000000a/own.jpg';

set local role authenticated;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
begin
  perform delete_test.act_as(a);
  assert delete_test.failure('select public.delete_account()') is null, 'the learner cannot delete their account';
end;
$$;

reset role;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
  counted record;
  left_over bigint;
  missing text;
begin
  assert not exists (select 1 from auth.users where id = a), 'the account of A is still there';
  assert exists (select 1 from auth.users where id = b), 'deleting A removed the account of B';
  select string_agg(owned.table_name, ', ') into missing
    from (
      select format('%I.%I', namespace.nspname, class.relname) as table_name
        from pg_class as class
        join pg_namespace as namespace on namespace.oid = class.relnamespace
        where namespace.nspname in ('public', 'private') and class.relkind in ('r', 'p')
          and exists (select 1 from pg_attribute where attrelid = class.oid and attname = 'owner_id')
      except
      select table_name from delete_test.counts where owner = a
    ) as owned;
  assert missing is null, format('A has no row in %s, so nothing checks that it is deleted', missing);

  for counted in select * from delete_test.counts loop
    execute format('select count(*) from %s where owner_id = %L', counted.table_name, counted.owner)
      into left_over;
    if counted.owner = a then
      assert left_over = 0, format('%s keeps %s rows of the deleted learner', counted.table_name, left_over);
    else
      assert left_over = counted.rows, format('deleting A changed the rows of B in %s', counted.table_name);
    end if;
  end loop;

  assert exists (select 1 from storage.objects where name = b || '/own.jpg'), 'deleting A removed a file of B';
end;
$$;

set local role anon;

do $$
begin
  assert delete_test.failure('select public.delete_account()') = '42501', 'a signed-out visitor can call delete_account';
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role": "authenticated"}', true);

do $$
begin
  assert delete_test.failure('select public.delete_account()') = '28000',
    'delete_account runs without a signed-in learner';
end;
$$;

rollback;
