grant update (value_id) on public.artwork_values to authenticated;

create function public.value_usage()
returns table (id uuid, category_code text, name text, artwork_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select value.id, value.category_code, value.name, count(link.artwork_id)::integer
    from public.category_values as value
    left join public.artwork_values as link on link.value_id = value.id
    group by value.id
    order by value.category_code, value.name;
$$;

create function public.period_era_usage()
returns table (period_id uuid, era_code text, artwork_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select period_era.value_id, period_era.era_code, count(artwork.id)::integer
    from public.period_eras as period_era
    left join public.artwork_values as link on link.value_id = period_era.value_id
    left join public.artworks as artwork
      on artwork.id = link.artwork_id and artwork.era_code = period_era.era_code
    group by period_era.value_id, period_era.era_code
    order by period_era.value_id, period_era.era_code;
$$;

create function public.style_period_usage()
returns table (style_id uuid, period_id uuid, artwork_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select style_period.style_id, style_period.period_id, count(period_link.artwork_id)::integer
    from public.style_periods as style_period
    left join public.artwork_values as style_link on style_link.value_id = style_period.style_id
    left join public.artwork_values as period_link
      on period_link.artwork_id = style_link.artwork_id and period_link.value_id = style_period.period_id
    group by style_period.style_id, style_period.period_id
    order by style_period.style_id, style_period.period_id;
$$;

create function public.merge_category_values(merged_id uuid, kept_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  merged public.category_values;
  kept public.category_values;
begin
  select * into merged from public.category_values as value where value.id = merged_id;
  select * into kept from public.category_values as value where value.id = kept_id;

  if merged.id is null or kept.id is null then
    raise exception 'category value not found'
      using errcode = 'no_data_found';
  end if;

  if merged.id = kept.id or merged.category_code <> kept.category_code then
    raise exception 'only two different values of one category can be merged'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.artwork_values as link
    set value_id = kept_id
    where link.value_id = merged_id
      and not exists (
        select 1 from public.artwork_values as other
          where other.artwork_id = link.artwork_id and other.value_id = kept_id
      );

  insert into public.period_eras (value_id, era_code)
    select kept_id, period_era.era_code
      from public.period_eras as period_era
      where period_era.value_id = merged_id
    on conflict do nothing;

  insert into public.style_periods (style_id, period_id)
    select kept_id, style_period.period_id
      from public.style_periods as style_period
      where style_period.style_id = merged_id
    on conflict do nothing;

  insert into public.style_periods (style_id, period_id)
    select style_period.style_id, kept_id
      from public.style_periods as style_period
      where style_period.period_id = merged_id
    on conflict do nothing;

  delete from public.category_values as value where value.id = merged_id;
end;
$$;

create function public.set_period_eras(
  target_period uuid,
  era_codes text[],
  move_to text default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  wanted text[] := coalesce(era_codes, '{}');
  new_era text;
  moved integer;
begin
  if not exists (
    select 1 from public.category_values as value
      where value.id = target_period and value.category_code = 'period'
  ) then
    raise exception 'period not found'
      using errcode = 'no_data_found';
  end if;

  if move_to is not null and not (move_to = any (wanted)) then
    raise exception 'artworks can move only to an era the period keeps'
      using errcode = 'invalid_parameter_value';
  end if;

  insert into public.period_eras (value_id, era_code)
    select target_period, wanted_era from unnest(wanted) as wanted_era
    on conflict do nothing;

  delete from public.period_eras as period_era
    where period_era.value_id = target_period and not (period_era.era_code = any (wanted));

  new_era := coalesce(move_to, case when cardinality(wanted) = 1 then wanted[1] end);

  if new_era is null and cardinality(wanted) > 1 and exists (
    select 1
      from public.artwork_values as link
      join public.artworks as artwork on artwork.id = link.artwork_id
      where link.value_id = target_period
        and artwork.era_code is not null
        and not (artwork.era_code = any (wanted))
  ) then
    raise exception 'a new era is needed for the artworks of the period'
      using errcode = 'check_violation';
  end if;

  update public.artworks as artwork
    set era_code = new_era
    from public.artwork_values as link
    where link.artwork_id = artwork.id
      and link.value_id = target_period
      and artwork.era_code is not null
      and not (artwork.era_code = any (wanted));
  get diagnostics moved = row_count;

  return moved;
end;
$$;

create function public.set_style_periods(target_style uuid, period_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  wanted uuid[] := coalesce(period_ids, '{}');
begin
  if not exists (
    select 1 from public.category_values as value
      where value.id = target_style and value.category_code = 'style'
  ) then
    raise exception 'style not found'
      using errcode = 'no_data_found';
  end if;

  insert into public.style_periods (style_id, period_id)
    select target_style, wanted_period from unnest(wanted) as wanted_period
    on conflict do nothing;

  if exists (
    select 1
      from public.style_periods as style_period
      join public.artwork_values as style_link on style_link.value_id = style_period.style_id
      join public.artwork_values as period_link
        on period_link.artwork_id = style_link.artwork_id
        and period_link.value_id = style_period.period_id
      where style_period.style_id = target_style
        and not (style_period.period_id = any (wanted))
  ) then
    raise exception 'an artwork still has the style with a removed period'
      using errcode = 'restrict_violation';
  end if;

  delete from public.style_periods as style_period
    where style_period.style_id = target_style and not (style_period.period_id = any (wanted));
end;
$$;

create function public.delete_unused_value(target_value uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.category_values as value
    where value.id = target_value
      and not exists (
        select 1 from public.artwork_values as link where link.value_id = value.id
      );

  if not found then
    if exists (select 1 from public.category_values as value where value.id = target_value) then
      raise exception 'an artwork still uses the value'
        using errcode = 'restrict_violation';
    end if;
    raise exception 'category value not found'
      using errcode = 'no_data_found';
  end if;
end;
$$;

revoke all on function public.value_usage() from public, anon;
revoke all on function public.period_era_usage() from public, anon;
revoke all on function public.style_period_usage() from public, anon;
revoke all on function public.merge_category_values(uuid, uuid) from public, anon;
revoke all on function public.set_period_eras(uuid, text[], text) from public, anon;
revoke all on function public.set_style_periods(uuid, uuid[]) from public, anon;
revoke all on function public.delete_unused_value(uuid) from public, anon;

grant execute on function public.value_usage() to authenticated;
grant execute on function public.period_era_usage() to authenticated;
grant execute on function public.style_period_usage() to authenticated;
grant execute on function public.merge_category_values(uuid, uuid) to authenticated;
grant execute on function public.set_period_eras(uuid, text[], text) to authenticated;
grant execute on function public.set_style_periods(uuid, uuid[]) to authenticated;
grant execute on function public.delete_unused_value(uuid) to authenticated;
