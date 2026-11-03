create function public.note_link_suggestions(link_trigger text, phrase text)
returns table (
  kind text, id text, record_number integer, title text, authors text[], parents text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  with term as (
    select public.search_key(coalesce(phrase, '')) as key,
      case
        when btrim(coalesce(phrase, '')) ~ '^[0-9]{1,9}$' then btrim(phrase)::integer::text
      end as digits
  ),
  artworks as (
    select artwork.id, artwork.record_number, artwork.title,
      coalesce(
        array_agg(value.name order by link.position) filter (where value.id is not null),
        '{}'
      ) as authors
      from public.artworks as artwork
      left join public.artwork_values as link on link.artwork_id = artwork.id
      left join public.category_values as value
        on value.id = link.value_id and value.category_code = 'author'
      where note_link_suggestions.link_trigger = '#'
        and artwork.deleted_at is null
      group by artwork.id
  ),
  found_artworks as (
    select artworks.*,
      term.digits is not null and starts_with(artworks.record_number::text, term.digits) as numbered,
      public.search_key(artworks.title || ' ' || array_to_string(artworks.authors, ' ')) as key
      from artworks, term
  ),
  ranked_artworks as (
    select found.*, case when starts_with(found.key, term.key) then 0 else 1 end as rank
      from found_artworks as found, term
      where found.numbered or term.key = '' or strpos(found.key, term.key) > 0
  ),
  value_matches as (
    select value.id, value.category_code, value.name, public.search_key(value.name) as key
      from public.category_values as value, term
      where note_link_suggestions.link_trigger = '@'
        and value.category_code in ('period', 'style', 'material', 'author', 'location')
        and (term.key = '' or strpos(public.search_key(value.name), term.key) > 0)
  ),
  ranked_values as (
    select found.*, case when starts_with(found.key, term.key) then 0 else 1 end as rank
      from value_matches as found, term
      order by rank, found.key, found.name
      limit 8
  ),
  suggestions as (
    select 'artwork' as kind, ranked.id::text as id, ranked.record_number, ranked.title, ranked.authors,
      '{}'::text[] as parents,
      row_number() over (
        order by ranked.numbered desc,
          case when ranked.numbered then ranked.record_number end,
          ranked.rank,
          ranked.record_number desc
      ) as place
      from ranked_artworks as ranked
    union all
    select ranked.category_code, ranked.id::text, null, ranked.name, '{}',
      case ranked.category_code
        when 'period' then array(
          select period_era.era_code
            from public.period_eras as period_era
            join public.eras as era on era.code = period_era.era_code
            where period_era.value_id = ranked.id
            order by era.position
        )
        when 'style' then array(
          select period.name
            from public.style_periods as style_period
            join public.category_values as period on period.id = style_period.period_id
            where style_period.style_id = ranked.id
            order by period.name
        )
        else '{}'
      end,
      row_number() over (order by ranked.rank, ranked.key, ranked.name)
      from ranked_values as ranked
  )
  select suggestions.kind, suggestions.id, suggestions.record_number, suggestions.title,
    suggestions.authors, suggestions.parents
    from suggestions
    where suggestions.place <= 8
    order by suggestions.place;
$$;

revoke all on function public.note_link_suggestions(text, text) from public, anon;
grant execute on function public.note_link_suggestions(text, text) to authenticated;
