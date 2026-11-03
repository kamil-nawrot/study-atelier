\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

create schema links_test;

create function links_test.targets(source_title text)
returns text[]
language sql
security definer
set search_path = ''
as $$
  select coalesce(array_agg(
      coalesce('#' || target.record_number::text, value.name, link.target_era_code)
      order by coalesce('#' || target.record_number::text, value.name, link.target_era_code)
    ), '{}')
    from public.note_links as link
    left join public.artworks as source on source.id = link.source_artwork_id
    left join public.category_values as source_value on source_value.id = link.source_value_id
    left join public.visits as source_visit on source_visit.id = link.source_visit_id
    left join public.category_values as place on place.id = source_visit.place_id
    left join public.artworks as target on target.id = link.target_artwork_id
    left join public.category_values as value on value.id = link.target_value_id
    where link.owner_id = (select auth.uid())
      and coalesce(source.title, source_value.name, place.name, link.source_era_code) = source_title;
$$;

create function links_test.act_as(user_id uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

grant usage on schema links_test to authenticated;
grant execute on all functions in schema links_test to authenticated;

set local role authenticated;
select links_test.act_as('00000000-0000-0000-0000-00000000000b');

do $$
begin
  perform public.save_artwork('{"title": "B first", "author_unknown": true}', '{"period": ["B period"]}');
  perform public.save_artwork('{"title": "B second", "author_unknown": true}', '{}');
  insert into public.era_details (era_code, notes) values ('antiquity', 'B on [x](/atelier/values/era/modern)');
end;
$$;

select links_test.act_as('00000000-0000-0000-0000-00000000000a');

do $$
declare
  baroque uuid;
  caravaggio uuid;
  linking uuid;
begin
  perform public.save_artwork('{"title": "First", "author_unknown": true}', '{"period": ["Baroque"]}');
  perform public.save_artwork('{"title": "Second", "author_unknown": false}', '{"author": ["Caravaggio"]}');
  select id into baroque from public.category_values where name = 'Baroque';
  select id into caravaggio from public.category_values where name = 'Caravaggio';

  select id into linking from public.save_artwork(
    jsonb_build_object(
      'title', 'Linking',
      'author_unknown', true,
      'notes', concat_ws(' ',
        '[a](/atelier/1) [a again](/atelier/0001) [b](/atelier/2)',
        '[period](/atelier/values/period/' || baroque || ')',
        '[author](/atelier/values/author/' || upper(caravaggio::text) || ')',
        '[era](/atelier/values/era/early_modern)',
        '[missing](/atelier/99) [too long](/atelier/1234567890)',
        '[wrong kind](/atelier/values/style/' || baroque || ')',
        '[not a uuid](/atelier/values/period/not-a-uuid) [bad era](/atelier/values/era/bronze)',
        '[unknown kind](/atelier/values/type/' || baroque || ')',
        '[title](/atelier/1 "First") [outside](https://example.test/atelier/2) /atelier/2'
      )
    ),
    '{}'
  );
  assert links_test.targets('Linking') = '{#1,#2,Baroque,Caravaggio,early_modern}',
    format('a note does not store exactly its well formed links: %s', links_test.targets('Linking'));

  update public.artworks set notes = '[c](/atelier/3)' where id = linking;
  assert links_test.targets('Linking') = '{#3}', 'a changed note keeps its old links or misses a link to itself';

  update public.artworks set title = 'Linking' where id = linking;
  assert links_test.targets('Linking') = '{#3}', 'a save without a change to the note changes its links';

  update public.artworks set notes = null where id = linking;
  assert links_test.targets('Linking') = '{}', 'a cleared note keeps its links';

  update public.artworks set notes = (select string_agg('[n](/atelier/' || n || ')', ' ') from generate_series(1, 3) as n)
    where id = linking;
  insert into public.period_details (value_id, notes) values (baroque, 'Compare [first](/atelier/1)');
  assert links_test.targets('Baroque') = '{#1}', 'the notes of a value do not store their links';

  insert into public.era_details (era_code, notes) values ('antiquity', 'A on [x](/atelier/values/era/modern) [y](/atelier/2)');
  assert links_test.targets('antiquity') = '{#2,modern}', 'the notes of an era do not store their links';

  perform public.save_visit(
    '{"visited_on": "2026-10-12", "date_precision": "day", "notes": "Saw [first](/atelier/1)"}', 'Museum', '{}'
  );
  assert links_test.targets('Museum') = '{#1}', 'the notes of a visit do not store their links';

  update public.artworks set notes = 'B [x](/atelier/values/period/' || (
      select id from public.category_values where name = 'Caravaggio'
    ) || ')' where id = linking;
  assert links_test.targets('Linking') = '{}', 'a link to a value of another category is stored';
end;
$$;

do $$
declare
  baroque uuid := (select id from public.category_values where name = 'Baroque');
begin
  assert (select array_agg(kind || ':' || coalesce(title, id) order by kind)
      from public.note_link_mentions(artwork_number => 1)) = array['period:Baroque', 'visit:Museum · 12.10.2026'],
    format('note_link_mentions does not give the notes that link an artwork: %s',
      (select array_agg(kind || ':' || coalesce(title, id)) from public.note_link_mentions(artwork_number => 1)));
  assert (select array_agg(kind || ':' || id) from public.note_link_mentions(era_code => 'modern'))
      = array['era:antiquity'],
    'note_link_mentions does not give the notes that link an era, or gives those of another account';
  assert (select count(*) from public.note_link_mentions(value_id => baroque)) = 0,
    'note_link_mentions gives a value nobody links';
  assert (select count(*) from public.note_link_mentions()) = 0, 'note_link_mentions without a target gives rows';
  assert (select array_agg(kind || ':' || coalesce(record_number::text, id) || ':' || coalesce(title, '') order by kind)
      from public.note_link_labels(era_code => 'antiquity')) = array['artwork:2:Second', 'era:modern:'],
    'note_link_labels does not give the targets of a note';
  assert (select array_agg(kind || ':' || title) from public.note_link_labels(value_id => baroque))
      = array['artwork:First'],
    'note_link_labels does not give the targets of the notes of a value';
  assert (select array_agg(record_number) from public.note_link_labels(
      visit_id => (select id from public.visits))) = array[1],
    'note_link_labels does not give the targets of the notes of a visit';
  assert (select count(*) from public.note_link_labels(artwork_number => 3)) = 0,
    'note_link_labels gives a link to a value of another category';
end;
$$;

do $$
begin
  assert (select array_agg(record_number::text || ':' || title || ':' || array_to_string(authors, ','))
      from public.note_link_suggestions('#', 'carav')) = array['2:Second:Caravaggio'],
    'note_link_suggestions does not find an artwork by its author';
  assert (select array_agg(record_number) from public.note_link_suggestions('#', '')) = array[3, 2, 1],
    'note_link_suggestions does not list the newest artworks first without a phrase';
  assert (select (array_agg(record_number))[1] from public.note_link_suggestions('#', '02')) = 2,
    'note_link_suggestions does not put the artwork with the record number first';
  assert (select count(*) from public.note_link_suggestions('#', '%')) = 0,
    'a percent sign in the phrase matches as a wildcard';
  assert (select array_agg(kind || ':' || title) from public.note_link_suggestions('@', 'CARAVÁGGIO'))
      = array['author:Caravaggio'],
    'note_link_suggestions does not find a value regardless of case and diacritics';
  assert (select count(*) from public.note_link_suggestions('@', 'b period')) = 0,
    'note_link_suggestions gives a value of another account';
  assert (select count(*) from public.note_link_suggestions('@', 'second')) = 0
    and (select count(*) from public.note_link_suggestions('#', 'baroque')) = 0,
    'note_link_suggestions mixes artworks and values';
end;
$$;

do $$
declare
  baroque uuid := (select id from public.category_values where name = 'Baroque');
  tenebrism uuid;
begin
  perform public.save_visit(
    '{"visited_on": "2026-10-20", "date_precision": "day", "notes": "Again [first](/atelier/1)"}', 'Museum', '{}'
  );
  update public.artworks set notes = 'See [first](/atelier/1)' where title = 'Second';
  assert (select array_agg(kind || ':' || coalesce(record_number::text, title))
      from public.note_link_mentions(artwork_number => 1))
      = array['artwork:2', 'period:Baroque', 'visit:Museum · 20.10.2026', 'visit:Museum · 12.10.2026'],
    format('note_link_mentions does not order the notes by kind, record number and newest visit: %s',
      (select array_agg(kind || ':' || coalesce(record_number::text, title))
        from public.note_link_mentions(artwork_number => 1)));
  update public.artworks set notes = null where title = 'Second';
  delete from public.visits where visited_on = '2026-10-20';

  perform public.save_value_details(baroque, '{"notes": "Compare [second](/atelier/2)"}');
  perform public.save_era_details('antiquity', '{"notes": "Now [third](/atelier/3)"}');
  assert links_test.targets('Baroque') = '{#2}' and links_test.targets('antiquity') = '{#3}',
    'saving the details of a value or an era again does not replace their links';
  perform public.save_value_details(baroque, '{"notes": "Compare [first](/atelier/1)"}');
  perform public.save_era_details('antiquity', '{"notes": "A on [x](/atelier/values/era/modern) [y](/atelier/2)"}');

  insert into public.period_eras (value_id, era_code) values (baroque, 'modern'), (baroque, 'early_modern');
  insert into public.category_values (category_code, name) values ('style', 'Tenebrism') returning id into tenebrism;
  insert into public.style_periods (style_id, period_id) values (tenebrism, baroque);
  insert into public.category_values (category_code, name) values ('style', 'Anti Baroque');
  assert (select array_agg(kind || ':' || title || ':' || array_to_string(parents, ','))
      from public.note_link_suggestions('@', 'baroque'))
      = array['period:Baroque:early_modern,modern', 'style:Anti Baroque:'],
    format('note_link_suggestions does not put the value starting with the phrase first with its eras: %s',
      (select array_agg(kind || ':' || title || ':' || array_to_string(parents, ','))
        from public.note_link_suggestions('@', 'baroque')));
  assert (select parents from public.note_link_suggestions('@', 'tenebr')) = array['Baroque'],
    'note_link_suggestions does not give the periods of a style';
  delete from public.category_values where id = tenebrism or name = 'Anti Baroque';
  delete from public.period_eras where value_id = baroque;

  perform public.save_artwork('{"title": "A second look", "author_unknown": true}', '{}');
  assert (select array_agg(record_number) from public.note_link_suggestions('#', 'second')) = array[2, 4],
    'note_link_suggestions does not put the artwork whose title starts with the phrase first';
  assert (select (array_agg(record_number))[1] from public.note_link_suggestions('#', '0003')) = 3,
    'note_link_suggestions does not read a record number with leading zeros';
  delete from public.artworks where title = 'A second look';
end;
$$;

reset role;

do $$
declare
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b_period uuid := (select id from public.category_values where owner_id = b and name = 'B period');
begin
  assert (select count(*) from public.note_links where owner_id = b) = 1
    and (select count(*) from public.note_links where owner_id = a and target_era_code = 'modern') = 1,
    'two accounts do not each keep their own link to one era';

  update public.artworks set notes = '[b](/atelier/values/period/' || b_period || ') [own](/atelier/2)'
    where owner_id = a and title = 'Linking';
  assert (select count(*) from public.note_links where target_value_id = b_period) = 0,
    'a note links a value of another account';
  assert (select count(*) from public.note_links as link
      join public.artworks as target on target.id = link.target_artwork_id
      where link.owner_id = a and target.owner_id <> a) = 0,
    'a note links an artwork of another account by its record number';

  delete from public.era_details where owner_id = b;
  assert (select count(*) from public.note_links where owner_id = b) = 0
    and (select count(*) from public.note_links where owner_id = a and target_era_code = 'modern') = 1,
    'deleting the era notes of one account touches the links of another';
end;
$$;

set local role authenticated;
select links_test.act_as('00000000-0000-0000-0000-00000000000a');

do $$
declare
  first uuid := (select id from public.artworks where title = 'First');
  baroque uuid := (select id from public.category_values where name = 'Baroque');
  caravaggio uuid := (select id from public.category_values where name = 'Caravaggio');
begin
  update public.artworks set deleted_at = now() where id = first;
  assert links_test.targets('Baroque') = '{#1}' and links_test.targets('Museum') = '{#1}',
    'moving an artwork to the trash drops the links to it';
  assert (select count(*) from public.note_link_labels(value_id => baroque)) = 0,
    'note_link_labels gives a label for an artwork in the trash';
  assert (select count(*) from public.note_link_suggestions('#', 'first')) = 0,
    'note_link_suggestions suggests an artwork in the trash';
  update public.artworks set notes = '[x](/atelier/2)' where id = first;
  assert (select count(*) from public.note_link_mentions(artwork_number => 2) where id = first::text) = 0,
    'note_link_mentions gives a note of an artwork in the trash';
  update public.artworks set deleted_at = null where id = first;
  assert links_test.targets('Baroque') = '{#1}', 'a restored artwork loses the links to it';

  update public.artworks set notes = '[author](/atelier/values/author/' || upper(caravaggio::text) || ')'
    where title = 'First';
  perform public.save_artwork('{"title": "Third", "author_unknown": false}', '{"author": ["Merisi"]}');
  perform public.merge_category_values(caravaggio, (select id from public.category_values where name = 'Merisi'));
  assert links_test.targets('First') = '{Merisi}', 'a merge does not move the links to the kept value';
  assert (select notes from public.artworks where title = 'First')
      = '[author](/atelier/values/author/' || (select id from public.category_values where name = 'Merisi') || ')',
    'a merge does not rewrite a link written in upper case';

  delete from public.period_details where value_id = baroque;
  assert links_test.targets('Baroque') = '{}', 'deleting the notes of a value keeps their links';

  insert into public.period_details (value_id, notes) values (baroque, '[first](/atelier/1)');
  delete from public.artworks where id = first;
  assert links_test.targets('Baroque') = '{}', 'deleting an artwork keeps the links to it';

  delete from public.category_values where id = baroque;
  assert (select count(*) from public.note_links where source_value_id = baroque) = 0,
    'deleting a value keeps the links from its notes';

  begin
    insert into public.note_links (target_era_code, source_era_code) values ('modern', 'antiquity');
    raise exception 'a learner wrote a note link';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  baseline bigint;
begin
  insert into public.category_values (owner_id, category_code, name)
    select a, 'style', 'Style ' || n from generate_series(1, 210) as n;
  update public.artworks
    set notes = (select string_agg('[s](/atelier/values/style/' || id || ')', ' ' order by substr(name, 7)::integer)
      from public.category_values where owner_id = a and category_code = 'style') || ' [last](/atelier/2)'
    where owner_id = a and title = 'Linking';
  assert (select count(*) from public.note_links as link
      join public.artworks as source on source.id = link.source_artwork_id
      where source.title = 'Linking') = 200,
    'a note stores more than 200 links';
  assert (select array_agg(value.name order by value.name) from public.note_links as link
      join public.artworks as source on source.id = link.source_artwork_id
      join public.category_values as value on value.id = link.target_value_id
      where source.title = 'Linking' and value.name in ('Style 1', 'Style 200', 'Style 201'))
      = array['Style 1', 'Style 200'],
    'a note over the limit does not keep its first 200 links';

  perform set_config('study_atelier.importing', 'on', true);
  update public.artworks set notes = '[none](/atelier/2)' where owner_id = a and title = 'Second';
  perform set_config('study_atelier.importing', '', true);
  assert (select count(*) from public.note_links as link
      join public.artworks as source on source.id = link.source_artwork_id
      where source.title = 'Second') = 0,
    'a note saved during an import stores its links before the import rebuilds them';

  create temp table stored_links as select owner_id, source_artwork_id, source_value_id, source_era_code, source_visit_id,
      target_artwork_id, target_value_id, target_era_code from public.note_links;
  select count(*) into baseline from stored_links;
  perform private.rebuild_note_links(account.id) from auth.users as account;
  assert (select count(*) from public.note_links) = baseline + 1,
    'a rebuild does not add the one link saved during the import';
  assert not exists (
      select owner_id, source_artwork_id, source_value_id, source_era_code, source_visit_id,
        target_artwork_id, target_value_id, target_era_code from stored_links
      except
      select owner_id, source_artwork_id, source_value_id, source_era_code, source_visit_id,
        target_artwork_id, target_value_id, target_era_code from public.note_links
    ),
    'a rebuild does not give the rows the triggers stored';
  assert not exists (select 1 from private.note_link_failures), 'a note save failed to store its links';
end;
$$;

alter table public.note_links add constraint links_test_refused check (target_era_code is null) not valid;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
begin
  update public.artworks set notes = 'Fails [x](/atelier/values/era/modern)' where owner_id = a and title = 'Second';
  assert (select notes from public.artworks where owner_id = a and title = 'Second')
      = 'Fails [x](/atelier/values/era/modern)',
    'a failure to store the links aborts the note save';
  assert (select count(*) from private.note_link_failures where owner_id = a and error_code = '23514') = 1,
    'a failure to store the links is not counted';
end;
$$;

alter table public.note_links drop constraint links_test_refused;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
begin
  update public.artworks set notes = notes where owner_id = a and title = 'Second';
  assert (select array_agg(link.target_era_code) from public.note_links as link
      join public.artworks as source on source.id = link.source_artwork_id
      where source.owner_id = a and source.title = 'Second') = array['modern'],
    'saving a note again without a change does not store the links a failed save missed';
end;
$$;

rollback;
