alter table public.artwork_images
  add column palette jsonb check (
    palette is null
    or (jsonb_typeof(palette) = 'array' and jsonb_array_length(palette) between 1 and 6)
  );

grant update (palette) on public.artwork_images to authenticated;

create function public.forget_palette_of_changed_image()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.palette is not distinct from old.palette
    and (new.source_wikidata_id, new.source_image_file, new.own_image_path, new.own_image_url)
      is distinct from
      (old.source_wikidata_id, old.source_image_file, old.own_image_path, old.own_image_url)
  then
    new.palette := null;
  end if;
  return new;
end;
$$;

create trigger forget_palette_of_changed_image
  before update on public.artwork_images
  for each row execute function public.forget_palette_of_changed_image();
