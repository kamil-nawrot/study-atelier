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
    "column": ["textBlock", "heading", "quote", "artwork", "closeUp", "set", "divider", "term"],
    "text": [],
    "bold": [],
    "italic": []
  }'::jsonb;
$$;

revoke all on function private.exhibition_children() from public;
