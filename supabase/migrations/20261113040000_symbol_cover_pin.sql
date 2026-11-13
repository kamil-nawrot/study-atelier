alter table public.symbols
  add column cover_pin_id uuid references public.artwork_pins (id) on delete set null;

create index symbols_cover_pin_id_idx on public.symbols (cover_pin_id)
  where cover_pin_id is not null;

create or replace function public.symbol_atlas()
returns table (
  id uuid,
  name text,
  created_at timestamptz,
  first_meaning text,
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
    (select meaning.text from public.symbol_meanings as meaning
      where meaning.symbol_id = symbol.id order by meaning.position limit 1),
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

create function public.set_symbol_cover(symbol_id uuid, pin_id uuid default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if pin_id is not null and not exists (
    select 1 from public.artwork_pins as pin
      where pin.id = pin_id and pin.symbol_id = set_symbol_cover.symbol_id
        and pin.view_width is not null
  ) then
    raise exception 'the main detail must be a pin of the symbol with a crop'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.symbols as symbol
    set cover_pin_id = pin_id
    where symbol.id = set_symbol_cover.symbol_id;

  if not found then
    raise exception 'symbol not found' using errcode = 'no_data_found';
  end if;
end;
$$;

revoke all on function public.set_symbol_cover(uuid, uuid) from public, anon;
grant execute on function public.set_symbol_cover(uuid, uuid) to authenticated;
