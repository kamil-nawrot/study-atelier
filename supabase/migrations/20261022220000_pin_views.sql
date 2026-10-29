alter table public.artwork_pins
  add column view_width double precision check (view_width > 0 and view_width <= 1);

alter table public.artwork_pins drop constraint artwork_pins_check;
alter table public.artwork_pins
  add constraint artwork_pins_check
  check (glossary_entry_id is not null or text is not null or view_width is not null);

create or replace function private.drop_pins_left_without_text()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.artwork_pins
    where glossary_entry_id = old.id and text is null and view_width is null;
  return old;
end;
$$;

grant insert (view_width), update (view_width) on public.artwork_pins to authenticated;
