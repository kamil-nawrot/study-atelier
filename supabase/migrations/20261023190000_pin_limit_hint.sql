create or replace function private.limit_pins_per_image()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.artwork_images where id = new.image_id for update;
  if (select count(*) from public.artwork_pins where image_id = new.image_id) >= 10 then
    raise exception 'an image holds at most 10 pins'
      using errcode = 'check_violation', hint = 'pin_limit';
  end if;
  return new;
end;
$$;

revoke all on function private.limit_pins_per_image() from public;
