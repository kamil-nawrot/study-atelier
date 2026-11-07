\set ON_ERROR_STOP on

begin;

create schema exhibitions_test;
grant usage on schema exhibitions_test to authenticated;

create function exhibitions_test.failure(statement text)
returns text
language plpgsql
as $$
declare
  state text;
  hint text;
begin
  execute statement;
  return null;
exception
  when others then
    get stacked diagnostics state = returned_sqlstate, hint = pg_exception_hint;
    return concat_ws(' ', state, nullif(hint, ''));
end;
$$;

grant execute on all functions in schema exhibitions_test to authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  judith uuid;
  olympia uuid;
  raft uuid;
  gone uuid := '99999999-9999-9999-9999-999999999999';
  exhibition uuid := gen_random_uuid();
  revision integer;
  document jsonb;
  many jsonb;
begin
  select id into judith from public.save_artwork(
    '{"title": "Judith", "author_unknown": true}', '{"author": [], "location": []}');
  select id into olympia from public.save_artwork(
    '{"title": "Olympia", "author_unknown": true}', '{"author": [], "location": []}');
  select id into raft from public.save_artwork(
    '{"title": "Raft", "author_unknown": true}', '{"author": [], "location": []}');

  document := jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object('level', 2),
      'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Light'))),
    jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', olympia, 'palette', true),
      'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'A caption'))),
    jsonb_build_object('type', 'textBlock', 'content', jsonb_build_array(
      jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
        jsonb_build_object('type', 'text', 'text', 'Bold', 'marks', jsonb_build_array(jsonb_build_object('type', 'bold')))))
    )),
    jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', judith)),
    jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', olympia)),
    jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', gone))
  ));

  revision := public.save_exhibition(exhibition, '  Light  ', document);
  assert revision = 1, 'save_exhibition does not start an exhibition at revision 1';
  assert (select title from public.exhibitions where id = exhibition) = 'Light',
    'save_exhibition keeps the spaces around the title';
  assert (select array_agg(artwork_id order by position) from public.exhibition_artworks where exhibition_id = exhibition)
    = array[olympia, judith],
    'save_exhibition does not list the artworks once each in the order they first appear';
  assert (select array_agg(position order by position) from public.exhibition_artworks where exhibition_id = exhibition)
    = array[0, 1]::smallint[],
    'save_exhibition does not number the cover from 0';

  revision := public.save_exhibition(exhibition, 'Light', document - 'content' ||
    jsonb_build_object('content', jsonb_build_array(
      jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', raft)))), 1);
  assert revision = 2, 'save_exhibition does not raise the revision';
  assert (select array_agg(artwork_id) from public.exhibition_artworks where exhibition_id = exhibition) = array[raft],
    'save_exhibition keeps the rows of artworks the document no longer shows';

  revision := public.save_exhibition(exhibition, 'Light', jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'columns', 'content', jsonb_build_array(
      jsonb_build_object('type', 'column', 'content', jsonb_build_array(
        jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', judith, 'palette', true)))),
      jsonb_build_object('type', 'column', 'content', jsonb_build_array(
        jsonb_build_object('type', 'closeUp', 'attrs', jsonb_build_object(
          'artworkId', olympia, 'imageId', null, 'x', 0.4, 'y', 0.6, 'viewWidth', 0.25)))),
      jsonb_build_object('type', 'column', 'content', jsonb_build_array(
        jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object(
          'level', 2, 'align', 'center', 'valign', 'bottom')))))),
    jsonb_build_object('type', 'set', 'attrs', jsonb_build_object('align', 'right'), 'content', jsonb_build_array(
      jsonb_build_object('type', 'closeUp', 'attrs', jsonb_build_object('artworkId', raft, 'x', 0, 'y', 1, 'viewWidth', 1)),
      jsonb_build_object('type', 'closeUp', 'attrs', jsonb_build_object('artworkId', raft, 'x', 0.5, 'y', 0.5, 'viewWidth', 0.2)))),
    jsonb_build_object('type', 'set', 'content', jsonb_build_array(
      jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', olympia, 'paletteOnly', true)),
      jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', judith, 'paletteOnly', true)))),
    jsonb_build_object('type', 'divider'),
    jsonb_build_object('type', 'divider', 'attrs', jsonb_build_object('line', true)),
    jsonb_build_object('type', 'term', 'attrs', jsonb_build_object(
      'termId', '00000000-0000-4000-8000-0000000000f1', 'align', 'center')))), 2);
  assert revision = 3, 'save_exhibition does not take a document with a row, close-ups and sets';
  assert (select array_agg(artwork_id order by position) from public.exhibition_artworks where exhibition_id = exhibition)
    = array[judith, olympia, raft],
    'save_exhibition does not list the artworks of a row and of a close-up in the order they appear';

  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "columns", "content": [{"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a row of one column';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "columns", "content": [{"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}, {"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}, {"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}, {"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a row of four columns';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "columns", "content": [{"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}, {"type": "heading", "attrs": {"level": 2}}]}, {"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a column of two blocks';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "columns", "content": [{"type": "column", "content": [{"type": "columns", "content": [{"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}, {"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}]}]}, {"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a row inside a row';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a column outside a row';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 1.5, "y": 0.5, "viewWidth": 0.5}}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a close-up outside the image';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0}}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a close-up of no width';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5, "zoom": 2}}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a close-up with an attribute it does not know';

  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "heading", "attrs": {"level": 2, "align": "justify"}}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a block aligned in a way it does not know';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "quote", "attrs": {"valign": "baseline"}}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a block placed in a way it does not know';

  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "set", "content": [{"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a set of one item';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "set", "content": [{"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}, {"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}, {"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}, {"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}, {"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}, {"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a set of six items';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "set", "content": [{"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}, {"type": "artwork", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "paletteOnly": true}}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a set of a detail and a palette';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "set", "content": [{"type": "artwork", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001"}}, {"type": "artwork", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001"}}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a set of artworks that are not palettes';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "set", "content": [{"type": "set", "content": [{"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}, {"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}]}, {"type": "closeUp", "attrs": {"artworkId": "00000000-0000-4000-8000-000000000001", "x": 0.5, "y": 0.5, "viewWidth": 0.5}}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a set inside a set';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "columns", "content": [{"type": "column", "content": [{"type": "divider"}]}, {"type": "column", "content": [{"type": "heading", "attrs": {"level": 2}}]}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a divider beside another block';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "divider", "attrs": {"line": "yes"}}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a divider with a line it does not know';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "divider", "content": []}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a divider that holds something';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "divider", "attrs": {"align": "center"}}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a divider placed on a side';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "term"}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a term block with no entry';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "term", "attrs": {"termId": "sfumato"}}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a term block whose entry is not an id';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "term", "attrs": {"termId": "00000000-0000-4000-8000-0000000000f1"}, "content": [{"type": "text", "text": "x"}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a term block that holds text';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', %L, 3)', exhibition, '{"type": "doc", "content": [{"type": "set", "content": [{"type": "term", "attrs": {"termId": "00000000-0000-4000-8000-0000000000f1"}}, {"type": "term", "attrs": {"termId": "00000000-0000-4000-8000-0000000000f1"}}]}]}'::jsonb))
    = '23514 exhibition_document',
    'an exhibition has a set of term blocks';

  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', ''{"type": "doc", "content": []}'', 1)', exhibition))
    = '40001 exhibition_revision',
    'save_exhibition overwrites a save with an older revision';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', ''{"type": "doc", "content": []}'', 1)', gen_random_uuid()))
    = 'P0002',
    'save_exhibition saves an exhibition that does not exist';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', ''{"type": "doc", "content": []}'')', exhibition))
    = '23505',
    'save_exhibition creates an exhibition over an existing one';

  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, %L, ''{"type": "doc", "content": []}'')', gen_random_uuid(), repeat('a', 201)))
    = '23514',
    'an exhibition has a title over 200 characters';

  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, %L, ''{"type": "doc", "content": []}'')', gen_random_uuid(), '   '))
    = '23514',
    'an exhibition has no title';

  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(),
    '{"type": "doc", "content": [{"type": "script"}]}'))
    = '23514 exhibition_document',
    'save_exhibition accepts a node it does not know';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(),
    '{"type": "doc", "content": [{"type": "paragraph"}]}'))
    = '23514 exhibition_document',
    'save_exhibition accepts a paragraph straight in the document';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(),
    '{"type": "doc", "content": [{"type": "heading", "attrs": {"level": 1}, "content": []}]}'))
    = '23514 exhibition_document',
    'save_exhibition accepts a heading of level 1';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(),
    '{"type": "doc", "content": [{"type": "heading", "attrs": {"level": 2, "style": "x"}, "content": []}]}'))
    = '23514 exhibition_document',
    'save_exhibition accepts an attribute it does not know';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(),
    '{"type": "doc", "content": [{"type": "artwork", "attrs": {"artworkId": "not-an-id"}}]}'))
    = '23514 exhibition_document',
    'save_exhibition accepts an artwork block without a real id';
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(), '[]'))
    = '23514 exhibition_document',
    'save_exhibition accepts a document that is not a doc node';

  many := jsonb_build_object('type', 'doc', 'content', (
    select jsonb_agg(jsonb_build_object('type', 'quote', 'content',
      jsonb_build_array(jsonb_build_object('type', 'paragraph'))))
      from generate_series(1, 301)));
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(), many))
    = '53400 exhibition_blocks',
    'an exhibition holds more than 300 blocks';
  many := jsonb_build_object('type', 'doc', 'content', (
    select jsonb_agg(jsonb_build_object('type', 'quote', 'content',
      jsonb_build_array(jsonb_build_object('type', 'paragraph'))))
      from generate_series(1, 300)));
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(), many)) is null,
    'an exhibition cannot hold 300 blocks';

  many := jsonb_build_object('type', 'doc', 'content', (
    select jsonb_agg(jsonb_build_object('type', 'artwork', 'attrs', jsonb_build_object('artworkId', gen_random_uuid())))
      from generate_series(1, 101)));
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(), many))
    = '53400 exhibition_artworks',
    'an exhibition shows more than 100 artworks';

  many := jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object(
    'type', 'textBlock', 'content', jsonb_build_array(jsonb_build_object(
      'type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object(
        'type', 'text', 'text', repeat('a', 524288))))))));
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''x'', %L)', gen_random_uuid(), many))
    = '23514',
    'an exhibition holds more than 512 KB';

  update public.exhibitions set deleted_at = now() where id = exhibition;
  assert exhibitions_test.failure(format(
    'select public.save_exhibition(%L, ''Light'', ''{"type": "doc", "content": []}'', 2)', exhibition))
    = 'P0002',
    'save_exhibition saves an exhibition in Archiwum';
  assert (select count(*) from public.exhibition_artworks where exhibition_id = exhibition) = 3,
    'moving an exhibition to Archiwum keeps its rows';

  update public.exhibitions set deleted_at = null where id = exhibition;
  delete from public.artworks where id = raft;
  assert not exists (select 1 from public.exhibition_artworks where artwork_id = raft),
    'purging an artwork keeps its row in an exhibition';
  assert exists (select 1 from public.exhibitions where id = exhibition),
    'purging an artwork removes the exhibition that showed it';

  delete from public.exhibitions where id = exhibition;
  assert not exists (select 1 from public.exhibition_artworks where exhibition_id = exhibition),
    'purging an exhibition keeps its rows';
  assert (select count(*) from public.artworks) = 2, 'purging an exhibition removes artworks';
end;
$$;

do $$
declare
  document constant jsonb := '{"type": "doc", "content": []}';
  count_before integer;
begin
  select count(*) into count_before from public.exhibitions;
  for index in count_before + 1..200 loop
    insert into public.exhibitions (title, document) values ('Exhibition ' || index, document);
  end loop;
  assert exhibitions_test.failure(format('insert into public.exhibitions (title) values (''One too many'')'))
    = '53400 exhibitions',
    'an account holds more than 200 exhibitions';
end;
$$;

rollback;
