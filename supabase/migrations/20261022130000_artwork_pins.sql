alter table public.artwork_images add unique (id, owner_id);
alter table public.glossary_entries add unique (id, owner_id);

create table public.artwork_pins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  image_id uuid not null,
  x double precision not null check (x between 0 and 1),
  y double precision not null check (y between 0 and 1),
  glossary_entry_id uuid,
  text text check (text = btrim(text) and text <> '' and char_length(text) <= 300),
  created_at timestamptz not null default now(),
  foreign key (image_id, owner_id) references public.artwork_images (id, owner_id) on delete cascade,
  foreign key (glossary_entry_id, owner_id) references public.glossary_entries (id, owner_id)
    on delete set null (glossary_entry_id),
  check (glossary_entry_id is not null or text is not null)
);

create index artwork_pins_image_id_idx on public.artwork_pins (image_id);
create index artwork_pins_glossary_entry_id_idx on public.artwork_pins (glossary_entry_id)
  where glossary_entry_id is not null;

create function private.limit_pins_per_image()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select count(*) from public.artwork_pins where image_id = new.image_id) >= 10 then
    raise exception 'an image holds at most 10 pins'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger artwork_pins_limit_per_image
  before insert on public.artwork_pins
  for each row execute function private.limit_pins_per_image();

create function private.drop_pins_left_without_text()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.artwork_pins
    where glossary_entry_id = old.id and text is null;
  return old;
end;
$$;

create trigger glossary_entries_drop_empty_pins
  before delete on public.glossary_entries
  for each row execute function private.drop_pins_left_without_text();

alter table public.artwork_pins enable row level security;

create policy "Owners manage the pins of their images"
  on public.artwork_pins for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.artwork_pins from anon, authenticated;
grant select, delete on public.artwork_pins to authenticated;
grant insert (image_id, x, y, glossary_entry_id, text) on public.artwork_pins to authenticated;
grant update (x, y, glossary_entry_id, text) on public.artwork_pins to authenticated;

revoke all on function private.limit_pins_per_image() from public;
revoke all on function private.drop_pins_left_without_text() from public;
