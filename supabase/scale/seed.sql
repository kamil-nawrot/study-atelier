create temporary table scale_learners on commit drop as
select
  n,
  ('5ca1e000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid as id,
  case when n <= 10 then 400 + 60 * n when n <= 300 then 50 else 5 end as artworks,
  case when n <= 10 then 150 when n <= 300 then 30 else 8 end as values_per_category,
  case when n <= 10 then 300 when n <= 300 then 20 else 2 end as glossary,
  case when n <= 10 then 40 when n <= 300 then 5 else 0 end as visits,
  case when n <= 10 then 100 when n <= 300 then 10 else 0 end as events
from generate_series(1, 3000) as n;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'scale-' || n || '@example.com', '{}'::jsonb, now(), now()
from scale_learners;

insert into public.profiles (owner_id)
select id from scale_learners
on conflict do nothing;

insert into public.category_values (owner_id, category_code, name)
select l.id, c.code, c.code || ' ' || v
from scale_learners l
cross join (values ('author'), ('period'), ('style'), ('material'), ('location')) as c (code)
cross join lateral generate_series(1, l.values_per_category) as v;

insert into public.artworks (owner_id, record_number, title, year_from, year_to, type_code, era_code, notes, favourite, created_at)
select l.id, a, 'Dzieło ' || a || ' ' || md5(l.n || '-' || a),
  1400 + (a * 7) % 600, 1400 + (a * 7) % 600,
  (array['architecture', 'painting', 'sculpture', 'drawing', 'printmaking', 'applied_arts', 'photography', 'other'])[1 + a % 8],
  (array['prehistory', 'antiquity', 'middle_ages', 'early_modern', 'modern', 'contemporary'])[1 + a % 6],
  'Notatka o dziele ' || a || ' z odniesieniem do ' || md5(a::text),
  a % 9 = 0,
  now() - make_interval(days => a % 700)
from scale_learners l
cross join lateral generate_series(1, l.artworks) as a;

update public.artworks
set deleted_at = now() - interval '3 days'
where record_number % 50 = 0
  and owner_id in (select id from scale_learners);

insert into public.artwork_values (artwork_id, value_id, owner_id, position)
select a.id, v.id, a.owner_id, 0
from public.artworks a
join scale_learners l on l.id = a.owner_id
cross join (values ('author'), ('period'), ('style'), ('material')) as c (code)
join lateral (
  select cv.id
  from public.category_values cv
  where cv.owner_id = a.owner_id
    and cv.category_code = c.code
    and cv.name = c.code || ' ' || (1 + a.record_number % l.values_per_category)
) v on true;

insert into public.artwork_images (artwork_id, owner_id, position, own_image_path, source_wikidata_id, source_image_file, image_width, image_height)
select a.id, a.owner_id, 0,
  case when a.record_number % 2 = 0 then a.owner_id || '/' || gen_random_uuid() || '.webp' end,
  case when a.record_number % 2 = 1 then 'Q' || a.record_number end,
  case when a.record_number % 2 = 1 then 'Scale_' || a.record_number || '.jpg' end,
  1200, 1600
from public.artworks a
where a.owner_id in (select id from scale_learners);

insert into public.review_cards (artwork_id, owner_id, facet, due, stability, difficulty, state, reps, last_review)
select a.id, a.owner_id, 'recognise',
  now() + make_interval(days => (a.record_number % 30) - 10),
  5, 5, 2, 3, now() - make_interval(days => a.record_number % 20)
from public.artworks a
where a.owner_id in (select id from scale_learners)
  and a.record_number % 5 <> 0;

insert into public.review_log (artwork_id, owner_id, facet, mode, rating, correct, answer_ms, reviewed_at)
select a.id, a.owner_id, 'recognise', 'quiz_title', 3, true, 4000,
  now() - make_interval(days => 2 + r * 3 + a.record_number % 3)
from public.artworks a
join scale_learners l on l.id = a.owner_id and l.n <= 300
cross join generate_series(1, 3) as r
where a.record_number % 5 <> 0;

insert into public.glossary_entries (owner_id, name, category, definition, sort_name)
select l.id, 'Pojęcie ' || g || ' ' || l.n, 'technique', 'Definicja pojęcia ' || g, 'pojęcie ' || g
from scale_learners l
cross join lateral generate_series(1, l.glossary) as g;

insert into public.timeline_events (owner_id, name, year_from, year_to, description)
select l.id, 'Wydarzenie ' || e, 1300 + e * 5, 1301 + e * 5 + e % 30, 'Opis ' || e
from scale_learners l
cross join lateral generate_series(1, l.events) as e;

insert into public.visits (owner_id, place_id, category_code, visited_on, date_precision, notes)
select l.id, p.id, 'location', current_date - v * 30, 'day', 'Wizyta ' || v
from scale_learners l
cross join lateral generate_series(1, l.visits) as v
join lateral (
  select cv.id
  from public.category_values cv
  where cv.owner_id = l.id
    and cv.category_code = 'location'
    and cv.name = 'location ' || (1 + v % l.values_per_category)
) p on true;

insert into public.visit_artworks (visit_id, artwork_id, owner_id)
select vi.id, a.id, vi.owner_id
from public.visits vi
join lateral (
  select a.id
  from public.artworks a
  where a.owner_id = vi.owner_id
  order by a.record_number
  limit 10
) a on true
where vi.owner_id in (select id from scale_learners);

analyze;
