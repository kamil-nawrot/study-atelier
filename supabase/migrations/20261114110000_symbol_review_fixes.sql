drop trigger symbols_clear_pins on public.symbols;

alter table public.artwork_pins
  drop constraint artwork_pins_symbol_id_owner_id_fkey,
  add constraint artwork_pins_symbol_id_owner_id_fkey
    foreign key (symbol_id, owner_id) references public.symbols (id, owner_id)
    deferrable initially deferred;

create trigger symbols_clear_pins
  after delete on public.symbols
  for each row execute function private.clear_symbol_from_pins();

alter table public.artwork_pins
  add constraint artwork_pins_id_owner_id_key unique (id, owner_id);

alter table public.symbols
  drop constraint symbols_cover_pin_id_fkey,
  add constraint symbols_cover_pin_id_owner_id_fkey
    foreign key (cover_pin_id, owner_id) references public.artwork_pins (id, owner_id)
    on delete set null (cover_pin_id)
    deferrable initially deferred;

create or replace function public.assign_symbol_meaning(target_meaning uuid, pin_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_symbol uuid;
begin
  select meaning.symbol_id into target_symbol
    from public.symbol_meanings as meaning
    where meaning.id = target_meaning;
  if target_symbol is null then
    raise exception 'meaning not found'
      using errcode = 'no_data_found';
  end if;

  if exists (
    select 1 from unnest(coalesce(pin_ids, '{}')) as chosen(id)
    where not exists (
      select 1 from public.artwork_pins as pin
      where pin.id = chosen.id and pin.symbol_id = target_symbol
    )
  ) then
    raise exception 'a pin does not show the symbol of this meaning'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.artwork_pins as pin
    set symbol_meaning_id = null
    where pin.symbol_meaning_id = target_meaning
      and not (pin.id = any (coalesce(pin_ids, '{}')))
      and exists (
        select 1
          from public.artwork_images as image
          join public.artworks as artwork on artwork.id = image.artwork_id
          where image.id = pin.image_id and artwork.deleted_at is null
      );

  update public.artwork_pins as pin
    set symbol_meaning_id = target_meaning
    where pin.id = any (coalesce(pin_ids, '{}'))
      and pin.symbol_meaning_id is distinct from target_meaning;
end;
$$;

drop function public.note_link_suggestions(text, text);

create function public.note_link_suggestions(link_trigger text, phrase text, excluded uuid[] default '{}')
returns table (
  kind text, id text, record_number integer, title text, authors text[], parents text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  with term as (
    select public.search_key(coalesce(phrase, '')) as key,
      case
        when btrim(coalesce(phrase, '')) ~ '^[0-9]{1,9}$' then btrim(phrase)::integer::text
      end as digits
  ),
  artworks as (
    select artwork.id, artwork.record_number, artwork.title,
      coalesce(
        array_agg(value.name order by link.position) filter (where value.id is not null),
        '{}'
      ) as authors
      from public.artworks as artwork
      left join public.artwork_values as link on link.artwork_id = artwork.id
      left join public.category_values as value
        on value.id = link.value_id and value.category_code = 'author'
      where note_link_suggestions.link_trigger = '#'
        and artwork.deleted_at is null
        and not (artwork.id = any (coalesce(note_link_suggestions.excluded, '{}')))
      group by artwork.id
  ),
  found_artworks as (
    select artworks.*,
      term.digits is not null and starts_with(artworks.record_number::text, term.digits) as numbered,
      public.search_key(artworks.title || ' ' || array_to_string(artworks.authors, ' ')) as key
      from artworks, term
  ),
  ranked_artworks as (
    select found.*, case when starts_with(found.key, term.key) then 0 else 1 end as rank
      from found_artworks as found, term
      where found.numbered or term.key = '' or strpos(found.key, term.key) > 0
  ),
  value_matches as (
    select value.id, value.category_code, value.name, public.search_key(value.name) as key
      from public.category_values as value, term
      where note_link_suggestions.link_trigger = '@'
        and value.category_code in ('period', 'style', 'material', 'author', 'location')
        and (term.key = '' or strpos(public.search_key(value.name), term.key) > 0)
  ),
  ranked_values as (
    select found.*, case when starts_with(found.key, term.key) then 0 else 1 end as rank
      from value_matches as found, term
      order by rank, found.key, found.name
      limit 8
  ),
  suggestions as (
    select 'artwork' as kind, ranked.id::text as id, ranked.record_number, ranked.title, ranked.authors,
      '{}'::text[] as parents,
      row_number() over (
        order by ranked.numbered desc,
          case when ranked.numbered then ranked.record_number end,
          ranked.rank,
          ranked.record_number desc
      ) as place
      from ranked_artworks as ranked
    union all
    select ranked.category_code, ranked.id::text, null, ranked.name, '{}',
      case ranked.category_code
        when 'period' then array(
          select period_era.era_code
            from public.period_eras as period_era
            join public.eras as era on era.code = period_era.era_code
            where period_era.value_id = ranked.id
            order by era.position
        )
        when 'style' then array(
          select period.name
            from public.style_periods as style_period
            join public.category_values as period on period.id = style_period.period_id
            where style_period.style_id = ranked.id
            order by period.name
        )
        else '{}'
      end,
      row_number() over (order by ranked.rank, ranked.key, ranked.name)
      from ranked_values as ranked
  )
  select suggestions.kind, suggestions.id, suggestions.record_number, suggestions.title,
    suggestions.authors, suggestions.parents
    from suggestions
    where suggestions.place <= 8
    order by suggestions.place;
$$;

revoke all on function public.note_link_suggestions(text, text, uuid[]) from public, anon;
grant execute on function public.note_link_suggestions(text, text, uuid[]) to authenticated;
