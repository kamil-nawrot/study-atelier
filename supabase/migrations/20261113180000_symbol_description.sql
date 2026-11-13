alter table public.symbols
  add column description text
    check (description <> '' and description = btrim(description) and char_length(description) <= 2000);

grant insert (description), update (description) on public.symbols to authenticated;

drop function public.save_symbol(text, jsonb, uuid);

create function public.save_symbol(
  new_name text,
  new_meanings jsonb,
  symbol_id uuid default null,
  new_description text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid;
  saved_description text := nullif(btrim(coalesce(new_description, '')), '');
  meaning jsonb;
  meaning_index integer := 0;
  saved_meaning_id uuid;
  kept_ids uuid[];
  context jsonb;
  context_index integer;
begin
  if new_meanings is null or jsonb_typeof(new_meanings) <> 'array' then
    raise exception 'the meanings are not a list'
      using errcode = 'invalid_parameter_value';
  end if;
  if jsonb_array_length(new_meanings) > 10 then
    raise exception 'a symbol holds at most 10 meanings'
      using errcode = 'check_violation', hint = 'symbol_meanings';
  end if;

  if symbol_id is null then
    insert into public.symbols (name, description)
      values (btrim(coalesce(new_name, '')), saved_description)
      returning id into saved_id;
  else
    update public.symbols as symbol
      set name = btrim(coalesce(new_name, '')), description = saved_description
      where symbol.id = save_symbol.symbol_id
      returning symbol.id into saved_id;
    if saved_id is null then
      raise exception 'symbol not found'
        using errcode = 'no_data_found';
    end if;
  end if;

  select coalesce(array_agg((item ->> 'id')::uuid), '{}')
    into kept_ids
    from jsonb_array_elements(new_meanings) as item
    where item ->> 'id' is not null;

  delete from public.symbol_meanings as old_meaning
    where old_meaning.symbol_id = saved_id
      and not (old_meaning.id = any (kept_ids));

  for meaning in select value from jsonb_array_elements(new_meanings) loop
    saved_meaning_id := null;
    if meaning ->> 'id' is not null then
      update public.symbol_meanings as kept
        set position = meaning_index, text = btrim(coalesce(meaning ->> 'text', ''))
        where kept.id = (meaning ->> 'id')::uuid and kept.symbol_id = saved_id
        returning kept.id into saved_meaning_id;
      if saved_meaning_id is null then
        raise exception 'meaning not found'
          using errcode = 'no_data_found';
      end if;
      delete from public.symbol_meaning_contexts as old_context
        where old_context.meaning_id = saved_meaning_id;
    else
      insert into public.symbol_meanings (symbol_id, position, text)
        values (saved_id, meaning_index, btrim(coalesce(meaning ->> 'text', '')))
        returning id into saved_meaning_id;
    end if;

    if jsonb_typeof(coalesce(meaning -> 'contexts', '[]')) <> 'array' then
      raise exception 'the context labels are not a list'
        using errcode = 'invalid_parameter_value';
    end if;
    if jsonb_array_length(coalesce(meaning -> 'contexts', '[]')) > 10 then
      raise exception 'a meaning holds at most 10 context labels'
        using errcode = 'check_violation', hint = 'symbol_meaning_contexts';
    end if;

    context_index := 0;
    for context in select value from jsonb_array_elements(coalesce(meaning -> 'contexts', '[]')) loop
      insert into public.symbol_meaning_contexts
        (meaning_id, position, value_id, era_code, artwork_id, glossary_entry_id, text)
        values (
          saved_meaning_id,
          context_index,
          (context ->> 'value_id')::uuid,
          context ->> 'era_code',
          (context ->> 'artwork_id')::uuid,
          (context ->> 'glossary_entry_id')::uuid,
          nullif(btrim(context ->> 'text'), '')
        );
      context_index := context_index + 1;
    end loop;

    meaning_index := meaning_index + 1;
  end loop;

  return saved_id;
end;
$$;

revoke all on function public.save_symbol(text, jsonb, uuid, text) from public, anon;
grant execute on function public.save_symbol(text, jsonb, uuid, text) to authenticated;

drop function public.symbol_atlas();

create function public.symbol_atlas()
returns table (
  id uuid,
  name text,
  created_at timestamptz,
  meaning_count integer,
  pin_count integer,
  cover jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    symbol.id,
    symbol.name,
    symbol.created_at,
    (select count(*)::integer from public.symbol_meanings as meaning
      where meaning.symbol_id = symbol.id),
    (select count(*)::integer from public.artwork_pins as pin
      join public.artwork_images as image on image.id = pin.image_id
      join public.artworks as artwork on artwork.id = image.artwork_id
      where pin.symbol_id = symbol.id and artwork.deleted_at is null),
    (select jsonb_build_object(
        'pin_id', pin.id, 'artwork_id', image.artwork_id, 'x', pin.x, 'y', pin.y,
        'view_width', pin.view_width, 'crop_path', pin.crop_path, 'image_id', image.id,
        'source_wikidata_id', image.source_wikidata_id, 'source_image_file', image.source_image_file,
        'source_image_licence', image.source_image_licence,
        'source_image_licence_url', image.source_image_licence_url,
        'source_image_attribution', image.source_image_attribution,
        'own_image_path', image.own_image_path, 'own_image_url', image.own_image_url,
        'image_width', image.image_width, 'image_height', image.image_height)
      from public.artwork_pins as pin
      join public.artwork_images as image on image.id = pin.image_id
      join public.artworks as artwork on artwork.id = image.artwork_id
      where pin.symbol_id = symbol.id and pin.view_width is not null and artwork.deleted_at is null
      order by (pin.id = symbol.cover_pin_id) desc, pin.created_at desc, pin.id
      limit 1)
  from public.symbols as symbol
  order by lower(symbol.name), symbol.id;
$$;

revoke all on function public.symbol_atlas() from public, anon;
grant execute on function public.symbol_atlas() to authenticated;
