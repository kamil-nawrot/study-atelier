create or replace function public.card_index()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'values', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
          'id', value.id,
          'category_code', value.category_code,
          'name', value.name,
          'artwork_count', (select count(*) from public.artwork_values as link where link.value_id = value.id),
          'visit_count', (select count(*) from public.visits as visit where visit.place_id = value.id),
          'sort_name', author.sort_name,
          'birth_year', author.birth_year,
          'country_code', place.country_code,
          'place_type', place.place_type
        )) order by value.category_code, value.name)
        from public.category_values as value
        left join public.author_details as author on author.value_id = value.id
        left join public.location_details as place on place.value_id = value.id
    ), '[]'::jsonb),
    'period_eras', coalesce((
      select jsonb_agg(jsonb_build_object(
          'period_id', usage.period_id, 'era_code', usage.era_code, 'artwork_count', usage.artwork_count
        ) order by usage.period_id, usage.era_code)
        from public.period_era_usage() as usage
    ), '[]'::jsonb),
    'style_periods', coalesce((
      select jsonb_agg(jsonb_build_object(
          'style_id', usage.style_id, 'period_id', usage.period_id, 'artwork_count', usage.artwork_count
        ) order by usage.style_id, usage.period_id)
        from public.style_period_usage() as usage
    ), '[]'::jsonb)
  );
$$;
