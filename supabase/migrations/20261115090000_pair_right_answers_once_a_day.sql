drop function public.confused_pairs();

create function public.confused_pairs(time_zone text default 'UTC')
returns table (kind text, first_value text, second_value text, confused_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  with labels as (
    select link.artwork_id,
        string_agg(value.name, ', ' order by link.position) filter (where value.category_code = 'author')
          as author,
        (array_agg(value.name order by link.position) filter (where value.category_code = 'style'))[1] as style
      from public.artwork_values as link
      join public.category_values as value on value.id = link.value_id
      where value.category_code in ('author', 'style')
      group by link.artwork_id
  ),
  answered as (
    select substr(entry.mode, 6) as kind,
        case entry.mode when 'quiz_author' then label.author else label.style end as right_value,
        btrim(entry.wrong_answer) as wrong_value,
        entry.reviewed_at
      from public.review_log as entry
      join labels as label on label.artwork_id = entry.artwork_id
      where entry.mode in ('quiz_author', 'quiz_style')
        and entry.correct is false
        and entry.wrong_answer is not null
  ),
  quiz_confusions as (
    select answered.kind,
        least(lower(answered.right_value), lower(answered.wrong_value)) as first_key,
        greatest(lower(answered.right_value), lower(answered.wrong_value)) as second_key,
        case when lower(answered.right_value) < lower(answered.wrong_value)
          then answered.right_value else answered.wrong_value end as first_value,
        case when lower(answered.right_value) < lower(answered.wrong_value)
          then answered.wrong_value else answered.right_value end as second_value,
        answered.reviewed_at
      from answered
      where answered.right_value is not null
        and lower(answered.right_value) <> lower(answered.wrong_value)
  ),
  pair_answers as (
    select substr(entry.mode, 6) as kind,
        least(lower(entry.pair[1]), lower(entry.pair[2])) as first_key,
        greatest(lower(entry.pair[1]), lower(entry.pair[2])) as second_key,
        entry.correct,
        entry.reviewed_at
      from public.review_log as entry
      where entry.facet = 'pair'
  ),
  confusions as (
    select confusion.kind, confusion.first_key, confusion.second_key,
        (array_agg(confusion.first_value order by confusion.reviewed_at desc))[1] as first_value,
        (array_agg(confusion.second_value order by confusion.reviewed_at desc))[1] as second_value,
        max(confusion.reviewed_at) as confused_at
      from quiz_confusions as confusion
      group by confusion.kind, confusion.first_key, confusion.second_key
  ),
  last_confusion as (
    select confusion.*,
        greatest(confusion.confused_at, (
          select max(answer.reviewed_at) from pair_answers as answer
            where answer.kind = confusion.kind
              and answer.first_key = confusion.first_key
              and answer.second_key = confusion.second_key
              and answer.correct is false
        )) as since
      from confusions as confusion
  )
  select pair.kind, pair.first_value, pair.second_value, pair.since
    from last_confusion as pair
    where (
        select count(distinct (answer.reviewed_at at time zone time_zone)::date) from pair_answers as answer
          where answer.kind = pair.kind
            and answer.first_key = pair.first_key
            and answer.second_key = pair.second_key
            and answer.correct
            and answer.reviewed_at > pair.since
      ) < 3
    order by pair.since desc;
$$;

revoke all on function public.confused_pairs(text) from public, anon;
grant execute on function public.confused_pairs(text) to authenticated;
