alter table public.artwork_pins
  add constraint artwork_pins_crop_path_owner_folder
  check (crop_path is null or split_part(crop_path, '/', 1) = owner_id::text);
