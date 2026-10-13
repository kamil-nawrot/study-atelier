alter table public.artworks
  add column image_width integer check (image_width > 0),
  add column image_height integer check (image_height > 0),
  add constraint artworks_image_size_check check ((image_width is null) = (image_height is null));

grant insert (image_width, image_height) on public.artworks to authenticated;
grant update (image_width, image_height) on public.artworks to authenticated;
