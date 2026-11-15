\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

create function pg_temp.card(due timestamptz)
returns jsonb
language sql
as $$
  select jsonb_build_object('due', due, 'stability', 20, 'difficulty', 4, 'state', 2,
    'reps', 4, 'lapses', 0, 'scheduled_days', 20, 'learning_steps', 0, 'last_review', now() - interval '20 days');
$$;

create function pg_temp.scope(plan jsonb, wanted_kind text, wanted_value text default null)
returns jsonb
language sql
as $$
  select option.value
    from jsonb_array_elements(plan -> 'scopes') as option
    where option.value ->> 'kind' = wanted_kind
      and option.value ->> 'value' is not distinct from wanted_value;
$$;

do $$
declare
  day_start constant timestamptz := date_trunc('day', now());
  plan jsonb;
begin
  plan := public.review_plan(day_start);
  assert plan -> 'scopes' = '[{"kind": "all", "known": 0, "fresh": 0, "styles": 0, "years": 0, "orders": 0, "artworks": 0}]'::jsonb,
    'an empty atelier offers more than the whole atelier: ' || plan::text;
  assert plan -> 'free' = '[]'::jsonb and (plan ->> 'tomorrow')::integer = 0,
    'an empty atelier offers a free round or waits tomorrow';

  for number in 1..45 loop
    perform public.save_artwork(
      jsonb_build_object(
        'title', 'Work ' || number,
        'author_unknown', true,
        'era_code', case when number <= 30 then 'early_modern' else 'modern' end
      ),
      jsonb_build_object(
        'style', jsonb_build_array(case when number <= 25 then 'Baroque'
          else (array['Realism', 'Romanticism', 'Rococo', 'Cubism'])[number % 4 + 1] end),
        'period', jsonb_build_array('Period ' || (number % 3))
      ),
      null,
      jsonb_build_array(jsonb_build_object(
        'source_wikidata_id', 'Q' || number,
        'source_image_file', 'Work_' || number || '.jpg'
      ))
    );
  end loop;

  plan := public.review_plan(day_start, 'flashcards');
  assert pg_temp.scope(plan, 'all') @> '{"known": 0, "fresh": 10}',
    'a new atelier does not plan the 10 new artworks of the day';
  assert (pg_temp.scope(plan, 'all') ->> 'artworks')::integer = 45,
    'the plan does not count the artworks with an image';
  assert jsonb_array_length(plan -> 'scopes') = 1,
    'a scope without 10 artworks due is offered';
  assert (plan ->> 'tomorrow')::integer = 10, 'tomorrow does not bring 10 new artworks';

  perform public.record_review(artwork.id, pg_temp.card(now() - interval '1 hour'),
      '{"mode": "flashcard", "rating": 3}')
    from public.artworks as artwork
    where artwork.record_number <= 34;

  plan := public.review_plan(day_start, 'flashcards');
  assert pg_temp.scope(plan, 'all') @> '{"known": 20, "fresh": 0}',
    'a round of flashcards does not take 20 of the 34 artworks due';
  assert pg_temp.scope(plan, 'era', 'early_modern') is not null
      and pg_temp.scope(plan, 'era', 'modern') is null,
    'the eras offered do not follow the artworks due';
  assert pg_temp.scope(plan, 'style', 'Baroque') is not null
      and pg_temp.scope(plan, 'style', 'Realism') is null,
    'the styles offered do not follow 20 artworks and 10 due';
  assert (
    select array_agg(option.value ->> 'kind' order by option.ordinality)
      from jsonb_array_elements(plan -> 'scopes') with ordinality as option (value, ordinality)
  ) = array['all', 'era', 'style'],
    'the scopes are not in the order of the whole atelier, eras, periods and styles: ' || plan::text;

  plan := public.review_plan(day_start, 'mixed');
  assert pg_temp.scope(plan, 'all') @> '{"known": 16, "fresh": 0}',
    'a mixed round of 20 does not keep 4 places for the style';
  assert pg_temp.scope(plan, 'all') @> '{"styles": 4, "years": 0, "orders": 0}',
    'the plan does not count the style places of the round';
  assert (select waiting from public.review_counts(day_start)) = 20,
    'the menu counter does not count the whole round of the preferred form';
  assert pg_temp.scope(plan, 'style', 'Baroque') @> '{"known": 20}',
    'a round scoped to a style keeps places for the style';

  assert (
    select array_agg((option.value ->> 'kind') || coalesce(':' || (option.value ->> 'value'), '')
        || '=' || (option.value ->> 'count') order by option.ordinality)
      from jsonb_array_elements(plan -> 'free') with ordinality as option (value, ordinality)
  ) = array['all=34', 'era:early_modern=30', 'style:Baroque=25'],
    'the free round does not offer the reviewed artworks by scope: ' || (plan -> 'free')::text;
end;
$$;

reset role;
update public.artworks set year_to = 1790 + 15 * (record_number - 35) where record_number > 34;
set local role authenticated;

do $$
declare
  day_start constant timestamptz := date_trunc('day', now());
  session jsonb;
begin
  perform public.record_review(artwork.id, pg_temp.card(now() + interval '10 days'),
      '{"mode": "flashcard", "rating": 3}')
    from public.artworks as artwork
    where artwork.record_number > 34;
  insert into public.profiles (review_year_questions, review_order_questions) values (true, true)
    on conflict (owner_id) do update set review_year_questions = true, review_order_questions = true;

  assert pg_temp.scope(public.review_plan(day_start, 'mixed'), 'all') @> '{"known": 13}',
    'a mixed round of 20 does not keep 4 places for the style, 2 for the year and 1 for the order';
  assert pg_temp.scope(public.review_plan(day_start, 'mixed'), 'all') @> '{"styles": 4, "years": 2, "orders": 1}',
    'the plan does not count the style, year and order places';
  assert (select waiting from public.review_counts(day_start)) = 20,
    'the menu counter does not count the style, year and order places';

  session := public.review_session(day_start, 'mixed');
  assert jsonb_array_length(session) = 20,
    'a round of 20 does not hold 13 artworks, 4 styles, 2 years and 1 order: '
      || jsonb_array_length(session);
  assert (select count(*) from jsonb_array_elements(session) as item where item ->> 'mode' = 'year') = 2,
    'a round of 20 does not ask 2 years';
  assert (select count(*) from jsonb_array_elements(session) as item where item ->> 'mode' = 'order') = 1,
    'a round does not ask 1 order';

  update public.profiles set review_order_questions = false;
  assert (select waiting from public.review_counts(day_start)) = 20,
    'the round is not full while the order is switched off';
  assert pg_temp.scope(public.review_plan(day_start, 'mixed'), 'all') @> '{"known": 14, "orders": 0}',
    'the order keeps its place while it is switched off';
  assert not exists (
    select 1 from jsonb_array_elements(public.review_session(day_start, 'mixed')) as item
      where item ->> 'mode' = 'order'
  ), 'the order is asked while it is switched off';
end;
$$;

reset role;
delete from public.artwork_values as link
  using public.category_values as value
  where value.id = link.value_id and value.category_code = 'style' and value.name in ('Romanticism', 'Rococo', 'Cubism');
set local role authenticated;

do $$
declare
  day_start constant timestamptz := date_trunc('day', now());
begin
  assert pg_temp.scope(public.review_plan(day_start, 'mixed'), 'all') @> '{"styles": 0}',
    'a style place is planned while too few other styles make a quiz';
  assert (select waiting from public.review_counts(day_start)) = 20,
    'the round is not full while no style quiz can be made';
  assert jsonb_array_length(public.review_session(day_start, 'mixed')) = 20,
    'the session does not hold the whole round while no style quiz can be made';
end;
$$;

rollback;
