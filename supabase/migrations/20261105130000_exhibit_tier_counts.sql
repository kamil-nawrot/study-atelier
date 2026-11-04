alter table public.exhibit_tiers
  add column tiers smallint check (tiers >= tier);

create or replace function private.unlock_exhibits_for(owner uuid, time_zone text)
returns table (exhibit text, value integer, thresholds integer[])
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
    with current_values as (
      select * from private.exhibit_values(owner, time_zone)
    ),
    unlocked as (
      insert into public.exhibit_tiers (owner_id, exhibit, tier, tiers)
        select owner, current_values.exhibit, tier.number, cardinality(current_values.thresholds)
          from current_values,
            generate_subscripts(current_values.thresholds, 1) as tier (number)
          where current_values.thresholds[tier.number] <= current_values.value
        on conflict do nothing
    ),
    rewarded as (
      insert into public.point_events (owner_id, kind, code)
        select owner, 'easter_egg', current_values.exhibit
          from current_values
          where current_values.exhibit in ('night_watch', 'marathon', 'back_from_storage')
            and current_values.thresholds[1] <= current_values.value
            and (select count(*) from public.point_events as existing where existing.owner_id = owner) < 50000
        on conflict do nothing
    )
    select current_values.exhibit, current_values.value, current_values.thresholds
      from current_values
      order by current_values.place;
end;
$$;

do $$
declare
  account record;
begin
  for account in select distinct owner_id from public.exhibit_tiers loop
    update public.exhibit_tiers as unlocked
      set tiers = cardinality(current_values.thresholds)
      from private.exhibit_values(account.owner_id, 'Europe/Warsaw') as current_values
      where unlocked.owner_id = account.owner_id
        and unlocked.exhibit = current_values.exhibit
        and cardinality(current_values.thresholds) >= unlocked.tier;
  end loop;
end;
$$;
