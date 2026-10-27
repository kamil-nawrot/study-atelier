load 'auto_explain';
set auto_explain.log_min_duration = 0;
set auto_explain.log_analyze = on;
set auto_explain.log_buffers = on;
set auto_explain.log_timing = on;
set auto_explain.log_nested_statements = on;
set auto_explain.log_level = notice;
set client_min_messages = notice;

select set_config('scale.learner', id::text, false)
from scale_learners
where n = 10;

select set_config('scale.value', cv.id::text, false)
from public.category_values cv
where cv.owner_id = current_setting('scale.learner')::uuid
  and cv.category_code = 'style'
order by cv.name
limit 1;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('scale.learner'), 'role', 'authenticated')::text,
  false
);
set role authenticated;

do $$ begin raise notice '### wall'; end $$;
select a.id, a.record_number, a.title, i.own_image_path, v.values, va.visit_id
from public.artworks a
left join lateral (
  select ai.own_image_path from public.artwork_images ai where ai.artwork_id = a.id and ai.position = 0
) i on true
left join lateral (
  select array_agg(av.value_id) as values from public.artwork_values av where av.artwork_id = a.id
) v on true
left join lateral (
  select vis.visit_id from public.visit_artworks vis where vis.artwork_id = a.id limit 1
) va on true
where a.deleted_at is null
order by a.created_at desc, a.id desc
limit 60;

do $$ begin raise notice '### trash'; end $$;
select a.id from public.artworks a
where a.deleted_at is not null
order by a.deleted_at desc, a.id desc
limit 60;

do $$ begin raise notice '### value_usage'; end $$;
select count(*) from public.value_usage();

do $$ begin raise notice '### artwork_field_usage'; end $$;
select count(*) from public.artwork_field_usage();

do $$ begin raise notice '### period_era_usage'; end $$;
select count(*) from public.period_era_usage();

do $$ begin raise notice '### style_period_usage'; end $$;
select count(*) from public.style_period_usage();

do $$ begin raise notice '### value_page_content'; end $$;
select count(*) from public.value_page_content(current_setting('scale.value')::uuid);

do $$ begin raise notice '### review_counts'; end $$;
select * from public.review_counts(date_trunc('day', now()));

do $$ begin raise notice '### review_streak'; end $$;
select * from public.review_streak(date_trunc('day', now()), 'Europe/Warsaw');

do $$ begin raise notice '### review_session'; end $$;
select count(*) from public.review_session(date_trunc('day', now()), 'mixed', 'all', null, 0);

do $$ begin raise notice '### notes_mentions'; end $$;
select count(*) from public.notes_mentions('Dzieło 1');

do $$ begin raise notice '### storage_usage'; end $$;
select public.storage_usage();

do $$ begin raise notice '### timeline'; end $$;
select e.id from public.timeline_events e order by e.year_to;

do $$ begin raise notice '### chronicle'; end $$;
select v.id, (select count(*) from public.visit_artworks va where va.visit_id = v.id)
from public.visits v
order by v.visited_on desc;

do $$ begin raise notice '### glossary'; end $$;
select g.id from public.glossary_entries g order by g.sort_name;

do $$ begin raise notice '### values of a category'; end $$;
select cv.id from public.category_values cv where cv.category_code = 'style' order by lower(cv.name);

do $$ begin raise notice '### pins of the images'; end $$;
select p.id from public.artwork_pins p
where p.image_id in (select ai.id from public.artwork_images ai limit 20);

do $$ begin raise notice '### add an artwork'; end $$;
do $$
begin
  insert into public.artworks (title) values ('Nowe dzieło');
exception when others then
  raise notice 'refused: %', sqlerrm;
end
$$;

do $$ begin raise notice '### add a glossary entry'; end $$;
do $$
begin
  insert into public.glossary_entries (name, category, definition, sort_name)
    values ('Nowe pojęcie', 'general', 'Definicja', 'nowe pojęcie');
exception when others then
  raise notice 'refused: %', sqlerrm;
end
$$;

do $$ begin raise notice '### record a review answer'; end $$;
do $$
begin
  insert into public.review_log (artwork_id, facet, mode, rating, correct, answer_ms)
    select a.id, 'recognise', 'quiz_title', 3, true, 3000
    from public.artworks a
    where a.record_number = 1;
exception when others then
  raise notice 'refused: %', sqlerrm;
end
$$;

do $$ begin raise notice '### send feedback'; end $$;
do $$
begin
  insert into public.feedback (kind, title) values ('idea', 'Pomysł');
exception when others then
  raise notice 'refused: %', sqlerrm;
end
$$;

do $$ begin raise notice '### delete an artwork'; end $$;
do $$
begin
  delete from public.artworks where record_number = 2;
exception when others then
  raise notice 'refused: %', sqlerrm;
end
$$;

do $$ begin raise notice '### delete the account'; end $$;
do $$
begin
  perform public.delete_account();
exception when others then
  raise notice 'refused: %', sqlerrm;
end
$$;

reset role;
