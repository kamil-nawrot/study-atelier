create or replace function public.note_gap_artwork(
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
  with pattern as (
    select '(^|[^[:alnum:]])('
      || string_agg(regexp_replace(phrase, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g'), '|' order by length(phrase) desc)
      || ')($|[^[:alnum:]])' as regex
      from (
        select distinct lower(btrim(listed.phrase)) as phrase
          from public.glossary_entries as entry
          cross join lateral unnest(array[entry.name] || entry.synonyms || entry.forms) as listed (phrase)
          where btrim(listed.phrase) <> ''
      ) as phrases
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', drawn.id, 'notes', drawn.notes)), '[]')
    from (
      select artwork.id, artwork.notes
        from public.artworks as artwork, pattern
        where artwork.deleted_at is null
          and artwork.notes is not null
          and pattern.regex is not null
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
          and regexp_replace(artwork.notes, '^[ \t]*#.*$', '', 'gn') ~* pattern.regex
        order by random()
        limit 5
    ) as drawn;
$$;
