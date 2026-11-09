create or replace function private.exhibition_children()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "doc": ["textBlock", "heading", "quote", "artwork", "closeUp", "set", "divider", "term", "columns"],
    "textBlock": ["paragraph", "bulletList", "orderedList"],
    "bulletList": ["listItem"],
    "orderedList": ["listItem"],
    "listItem": ["paragraph", "bulletList", "orderedList"],
    "paragraph": ["text"],
    "heading": ["text"],
    "quote": ["paragraph"],
    "artwork": ["text"],
    "closeUp": [],
    "set": ["artwork", "closeUp"],
    "divider": [],
    "term": [],
    "columns": ["column"],
    "column": ["textBlock", "heading", "quote", "artwork", "closeUp", "set", "term"],
    "text": [],
    "bold": [],
    "italic": []
  }'::jsonb;
$$;

create or replace function private.exhibition_attributes()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "doc": [],
    "textBlock": ["align", "valign"],
    "bulletList": [],
    "orderedList": ["start", "type"],
    "listItem": [],
    "paragraph": [],
    "heading": ["level", "align", "valign"],
    "quote": ["align", "valign"],
    "artwork": ["artworkId", "imageId", "palette", "paletteOnly", "note", "align", "valign"],
    "closeUp": ["artworkId", "imageId", "x", "y", "viewWidth", "align", "valign"],
    "set": ["align", "valign"],
    "divider": ["line"],
    "term": ["termId", "align", "valign"],
    "columns": [],
    "column": [],
    "text": [],
    "bold": [],
    "italic": []
  }'::jsonb;
$$;

revoke all on function private.exhibition_children() from public;
revoke all on function private.exhibition_attributes() from public;

create or replace function private.validate_exhibition_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  children constant jsonb := private.exhibition_children();
  attributes constant jsonb := private.exhibition_attributes();
  node jsonb;
  node_type text;
  child jsonb;
  artwork_ids text[];
begin
  if jsonb_typeof(new.document) is distinct from 'object' or new.document ->> 'type' is distinct from 'doc' then
    raise exception 'the document of an exhibition is a doc node'
      using errcode = 'check_violation', hint = 'exhibition_document';
  end if;

  for node in
    select value from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && exists(@.type))') as value
  loop
    node_type := node ->> 'type';
    if jsonb_typeof(node -> 'type') <> 'string' or not children ? node_type then
      raise exception 'an exhibition has no node of this kind'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if exists (
      select 1 from jsonb_object_keys(node) as key where key not in ('type', 'attrs', 'content', 'text', 'marks')
    ) then
      raise exception 'an exhibition node has a key it does not know'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node ? 'attrs' and (
      jsonb_typeof(node -> 'attrs') <> 'object'
      or exists (
        select 1 from jsonb_object_keys(node -> 'attrs') as key
          where not (attributes -> node_type) ? key
      )
    ) then
      raise exception 'an exhibition node has an attribute it does not know'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node ? 'content' then
      if jsonb_typeof(node -> 'content') <> 'array' then
        raise exception 'the content of an exhibition node is a list'
          using errcode = 'check_violation', hint = 'exhibition_document';
      end if;
      for child in select value from jsonb_array_elements(node -> 'content') loop
        if jsonb_typeof(child) <> 'object' or not (children -> node_type) ? (child ->> 'type') then
          raise exception 'an exhibition node holds a node it may not hold'
            using errcode = 'check_violation', hint = 'exhibition_document';
        end if;
      end loop;
    end if;
    if node ? 'attrs' and (
      (node -> 'attrs' ? 'align' and node -> 'attrs' ->> 'align' not in ('left', 'center', 'right'))
      or (node -> 'attrs' ? 'valign' and node -> 'attrs' ->> 'valign' not in ('top', 'middle', 'bottom'))
    ) then
      raise exception 'a block of an exhibition stands left, centre or right and top, middle or bottom'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'text' and jsonb_typeof(node -> 'text') is distinct from 'string' then
      raise exception 'a text node of an exhibition has no text'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'heading' and node -> 'attrs' ->> 'level' is distinct from '2' then
      raise exception 'a heading of an exhibition is of level 2'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'artwork' then
      if node -> 'attrs' ->> 'artworkId' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or coalesce(node -> 'attrs' ->> 'imageId', '00000000-0000-0000-0000-000000000000')
          !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then
        raise exception 'an artwork block of an exhibition needs the id of an artwork'
          using errcode = 'check_violation', hint = 'exhibition_document';
      end if;
    end if;
    if node_type = 'closeUp' then
      if node -> 'attrs' ->> 'artworkId' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or coalesce(node -> 'attrs' ->> 'imageId', '00000000-0000-0000-0000-000000000000')
          !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or jsonb_typeof(node -> 'attrs' -> 'x') is distinct from 'number'
        or jsonb_typeof(node -> 'attrs' -> 'y') is distinct from 'number'
        or jsonb_typeof(node -> 'attrs' -> 'viewWidth') is distinct from 'number'
        or (node -> 'attrs' ->> 'x')::numeric not between 0 and 1
        or (node -> 'attrs' ->> 'y')::numeric not between 0 and 1
        or (node -> 'attrs' ->> 'viewWidth')::numeric not between 0.001 and 1
      then
        raise exception 'a close-up of an exhibition needs an artwork and a fragment of its image'
          using errcode = 'check_violation', hint = 'exhibition_document';
      end if;
    end if;
    if node_type = 'set' and (
      jsonb_typeof(node -> 'content') is distinct from 'array'
      or jsonb_array_length(node -> 'content') not between 2 and 5
      or (select count(distinct value ->> 'type') from jsonb_array_elements(node -> 'content') as value) <> 1
      or exists (
        select 1 from jsonb_array_elements(node -> 'content') as value
          where value ->> 'type' = 'artwork' and value -> 'attrs' -> 'paletteOnly' is distinct from 'true'::jsonb
      )
    ) then
      raise exception 'a set of an exhibition holds two to five details or two to five palettes'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'term' and (
      node ? 'content'
      or coalesce(node -> 'attrs' ->> 'termId', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ) then
      raise exception 'a term block of an exhibition needs the id of a glossary entry'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'divider' and (
      node ? 'content'
      or (node -> 'attrs' ? 'line' and jsonb_typeof(node -> 'attrs' -> 'line') <> 'boolean')
    ) then
      raise exception 'a divider of an exhibition holds nothing and has a line or none'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'columns' and (
      jsonb_typeof(node -> 'content') is distinct from 'array'
      or jsonb_array_length(node -> 'content') not between 2 and 3
    ) then
      raise exception 'a row of an exhibition holds two or three columns'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
    if node_type = 'column' and (
      jsonb_typeof(node -> 'content') is distinct from 'array'
      or jsonb_array_length(node -> 'content') <> 1
    ) then
      raise exception 'a column of an exhibition holds one block'
        using errcode = 'check_violation', hint = 'exhibition_document';
    end if;
  end loop;

  if (
    select count(*)
      from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && exists(@.type))') as value
      where value ->> 'type' in ('textBlock', 'heading', 'quote', 'artwork', 'closeUp', 'divider', 'term')
  ) > 300 then
    raise exception 'an exhibition holds at most 300 blocks'
      using errcode = 'configuration_limit_exceeded', hint = 'exhibition_blocks';
  end if;

  select array_agg(distinct (value #>> '{}')) into artwork_ids
    from jsonb_path_query(new.document, 'strict $.** ? (@.type() == "object" && exists(@.artworkId)).artworkId') as value;
  if coalesce(array_length(artwork_ids, 1), 0) > 100 then
    raise exception 'an exhibition holds at most 100 artworks'
      using errcode = 'configuration_limit_exceeded', hint = 'exhibition_artworks';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_exhibition_document() from public;
