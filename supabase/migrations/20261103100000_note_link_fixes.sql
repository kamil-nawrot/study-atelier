drop trigger artworks_note_links_update on public.artworks;
create trigger artworks_note_links_update
  after update of notes on public.artworks
  for each row
  execute function private.note_links_from_notes('artwork');

drop trigger visits_note_links_update on public.visits;
create trigger visits_note_links_update
  after update of notes on public.visits
  for each row
  execute function private.note_links_from_notes('visit');

drop trigger era_details_note_links_update on public.era_details;
create trigger era_details_note_links_update
  after update of notes on public.era_details
  for each row
  execute function private.note_links_from_notes('era');

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'period_details', 'style_details', 'material_details', 'author_details', 'location_details'
  ] loop
    execute format('drop trigger %I on public.%I', table_name || '_note_links_update', table_name);
    execute format(
      'create trigger %I after update of notes on public.%I for each row'
        ' execute function private.note_links_from_notes(''value'')',
      table_name || '_note_links_update', table_name
    );
  end loop;
end;
$$;

drop index public.note_links_source_artwork_idx;

create or replace function private.rebuild_note_links(owner uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  delete from public.note_links as link where link.owner_id = owner;
  insert into public.note_links (
    owner_id, source_artwork_id, source_value_id, source_era_code, source_visit_id,
    target_artwork_id, target_value_id, target_era_code
  )
    select owner, source.artwork, source.value, source.era, source.visit,
      target.target_artwork_id, target.target_value_id, target.target_era_code
      from (
        select artwork.id as artwork, null::uuid as value, null::text as era, null::uuid as visit, artwork.notes
          from public.artworks as artwork where artwork.owner_id = owner
        union all
        select null, details.value_id, null, null, details.notes
          from public.period_details as details where details.owner_id = owner
        union all
        select null, details.value_id, null, null, details.notes
          from public.style_details as details where details.owner_id = owner
        union all
        select null, details.value_id, null, null, details.notes
          from public.material_details as details where details.owner_id = owner
        union all
        select null, details.value_id, null, null, details.notes
          from public.author_details as details where details.owner_id = owner
        union all
        select null, details.value_id, null, null, details.notes
          from public.location_details as details where details.owner_id = owner
        union all
        select null, null, details.era_code, null, details.notes
          from public.era_details as details where details.owner_id = owner
        union all
        select null, null, null, visit.id, visit.notes
          from public.visits as visit where visit.owner_id = owner
      ) as source
      cross join lateral private.note_link_targets(owner, source.notes) as target
      where strpos(source.notes, '](/atelier/') > 0;
end;
$$;

revoke all on function private.rebuild_note_links(uuid) from public, anon, authenticated;
