alter table public.profiles
  add column review_note_questions boolean not null default false;

grant insert (review_note_questions) on public.profiles to authenticated;
grant update (review_note_questions) on public.profiles to authenticated;

create function public.note_gap_artwork(
  scope_kind text default 'all',
  scope_value text default null,
  excluded uuid[] default '{}'
)
returns jsonb
language sql
volatile
security invoker
set search_path = ''
as $$
  with phrases as (
    select distinct lower(btrim(listed.phrase)) as phrase
      from public.glossary_entries as entry
      cross join lateral unnest(array[entry.name] || entry.synonyms || entry.forms) as listed (phrase)
      where btrim(listed.phrase) <> ''
  )
  select jsonb_build_object('id', artwork.id, 'notes', artwork.notes)
    from public.artworks as artwork
    where artwork.deleted_at is null
      and artwork.notes is not null
      and not (artwork.id = any (coalesce(excluded, '{}')))
      and exists (
        select 1 from public.artwork_images as image
          where image.artwork_id = artwork.id and image.position = 0
      )
      and (
        scope_kind = 'all'
        or (scope_kind = 'seen' and exists (
          select 1 from public.visit_artworks as seen where seen.artwork_id = artwork.id
        ))
        or (scope_kind = 'era' and artwork.era_code = scope_value)
        or (scope_kind in ('period', 'style') and exists (
          select 1
            from public.artwork_values as link
            join public.category_values as value on value.id = link.value_id
            where link.artwork_id = artwork.id
              and value.category_code = scope_kind
              and value.name = scope_value
        ))
      )
      and exists (
        select 1 from phrases
          where artwork.notes ~* (
            '(^|[^[:alnum:]])'
            || regexp_replace(phrases.phrase, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g')
            || '($|[^[:alnum:]])'
          )
      )
    order by random()
    limit 1;
$$;

revoke all on function public.note_gap_artwork(text, text, uuid[]) from public, anon;
grant execute on function public.note_gap_artwork(text, text, uuid[]) to authenticated;
