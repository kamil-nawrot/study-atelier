alter table public.location_details
  drop constraint location_details_place_type_check,
  add constraint location_details_place_type_check
    check (place_type in ('museum', 'gallery', 'private_collection', 'on_site'));
