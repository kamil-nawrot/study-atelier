create function public.assign_symbol_meaning(target_meaning uuid, pin_ids uuid[])
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
      and not (pin.id = any (coalesce(pin_ids, '{}')));

  update public.artwork_pins as pin
    set symbol_meaning_id = target_meaning
    where pin.id = any (coalesce(pin_ids, '{}'))
      and pin.symbol_meaning_id is distinct from target_meaning;
end;
$$;

revoke all on function public.assign_symbol_meaning(uuid, uuid[]) from public, anon;
grant execute on function public.assign_symbol_meaning(uuid, uuid[]) to authenticated;
