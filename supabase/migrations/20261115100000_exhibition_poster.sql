alter table public.exhibitions
  add column cover_artwork_id uuid,
  add column cover_image_id uuid,
  add column cover_x real check (cover_x between 0 and 1),
  add column cover_y real check (cover_y between 0 and 1),
  add column cover_zoom real check (cover_zoom between 1 and 3),
  add column cover_grayscale smallint not null default 0 check (cover_grayscale between 0 and 100),
  add column cover_sepia smallint not null default 0 check (cover_sepia between 0 and 100),
  add column cover_brightness smallint not null default 100 check (cover_brightness between 70 and 130),
  add column cover_contrast smallint not null default 100 check (cover_contrast between 70 and 130),
  add column cover_saturate smallint not null default 100 check (cover_saturate between 0 and 150),
  add foreign key (cover_artwork_id, owner_id) references public.artworks (id, owner_id)
    on delete set null (cover_artwork_id),
  add foreign key (cover_image_id, owner_id) references public.artwork_images (id, owner_id)
    on delete set null (cover_image_id),
  add check ((cover_x is null) = (cover_y is null) and (cover_x is null) = (cover_zoom is null));

create index exhibitions_cover_artwork_id_idx on public.exhibitions (cover_artwork_id)
  where cover_artwork_id is not null;
create index exhibitions_cover_image_id_idx on public.exhibitions (cover_image_id)
  where cover_image_id is not null;

grant update (
  cover_artwork_id, cover_image_id, cover_x, cover_y, cover_zoom,
  cover_grayscale, cover_sepia, cover_brightness, cover_contrast, cover_saturate
) on public.exhibitions to authenticated;

create function public.set_exhibition_cover(
  exhibition_id uuid,
  artwork_id uuid default null,
  image_id uuid default null,
  x real default null,
  y real default null,
  zoom real default null,
  grayscale smallint default 0,
  sepia smallint default 0,
  brightness smallint default 100,
  contrast smallint default 100,
  saturate smallint default 100
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if image_id is not null and not exists (
    select 1 from public.artwork_images as image
      where image.id = set_exhibition_cover.image_id
        and image.artwork_id = set_exhibition_cover.artwork_id
  ) then
    raise exception 'the image of the poster must be an image of its artwork'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.exhibitions as saved
    set cover_artwork_id = artwork_id,
      cover_image_id = image_id,
      cover_x = x,
      cover_y = y,
      cover_zoom = zoom,
      cover_grayscale = grayscale,
      cover_sepia = sepia,
      cover_brightness = brightness,
      cover_contrast = contrast,
      cover_saturate = saturate
    where saved.id = set_exhibition_cover.exhibition_id
      and saved.deleted_at is null;

  if not found then
    raise exception 'exhibition not found' using errcode = 'no_data_found';
  end if;
end;
$$;

revoke all on function public.set_exhibition_cover(
  uuid, uuid, uuid, real, real, real, smallint, smallint, smallint, smallint, smallint
) from public, anon;
grant execute on function public.set_exhibition_cover(
  uuid, uuid, uuid, real, real, real, smallint, smallint, smallint, smallint, smallint
) to authenticated;
