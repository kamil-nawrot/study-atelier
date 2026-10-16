create table public.review_cards (
  artwork_id uuid not null,
  owner_id uuid not null default auth.uid(),
  facet text not null default 'recognise' check (facet in ('recognise')),
  due timestamptz not null,
  stability double precision not null check (stability >= 0),
  difficulty double precision not null check (difficulty >= 0),
  state smallint not null check (state between 0 and 3),
  reps integer not null default 0 check (reps >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  scheduled_days integer not null default 0 check (scheduled_days >= 0),
  learning_steps integer not null default 0 check (learning_steps >= 0),
  last_review timestamptz,
  created_at timestamptz not null default now(),
  primary key (artwork_id, facet),
  foreign key (artwork_id, owner_id) references public.artworks (id, owner_id) on delete cascade
);

create index review_cards_owner_id_due_idx on public.review_cards (owner_id, due);

create table public.review_log (
  id bigint generated always as identity primary key,
  artwork_id uuid not null,
  owner_id uuid not null default auth.uid(),
  facet text not null default 'recognise' check (facet in ('recognise')),
  mode text not null check (mode in ('flashcard', 'quiz_image', 'quiz_title', 'quiz_style')),
  rating smallint not null check (rating between 1 and 3),
  correct boolean,
  answer_ms integer check (answer_ms >= 0),
  reviewed_at timestamptz not null default now(),
  foreign key (artwork_id, owner_id) references public.artworks (id, owner_id) on delete cascade,
  check ((mode = 'flashcard') = (correct is null))
);

create index review_log_owner_id_reviewed_at_idx on public.review_log (owner_id, reviewed_at);
create index review_log_artwork_id_idx on public.review_log (artwork_id);

alter table public.review_cards enable row level security;
alter table public.review_log enable row level security;

create policy "Owners manage their review cards"
  on public.review_cards for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their review log"
  on public.review_log for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.review_cards, public.review_log from anon, authenticated;

grant select on public.review_cards to authenticated;
grant insert (
  artwork_id, facet, due, stability, difficulty, state, reps, lapses, scheduled_days,
  learning_steps, last_review
) on public.review_cards to authenticated;
grant update (
  due, stability, difficulty, state, reps, lapses, scheduled_days, learning_steps, last_review
) on public.review_cards to authenticated;

grant select on public.review_log to authenticated;
grant insert (artwork_id, facet, mode, rating, correct, answer_ms) on public.review_log to authenticated;

create function public.record_review(
  target_artwork uuid,
  card jsonb,
  answer jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_card public.review_cards := jsonb_populate_record(null::public.review_cards, card);
  given public.review_log := jsonb_populate_record(null::public.review_log, answer);
  target_facet text := coalesce(given.facet, 'recognise');
begin
  insert into public.review_cards (
    artwork_id, facet, due, stability, difficulty, state, reps, lapses, scheduled_days,
    learning_steps, last_review
  )
  values (
    target_artwork, target_facet, next_card.due, next_card.stability, next_card.difficulty,
    next_card.state, next_card.reps, next_card.lapses, next_card.scheduled_days,
    next_card.learning_steps, next_card.last_review
  )
  on conflict (artwork_id, facet) do update
    set due = excluded.due,
      stability = excluded.stability,
      difficulty = excluded.difficulty,
      state = excluded.state,
      reps = excluded.reps,
      lapses = excluded.lapses,
      scheduled_days = excluded.scheduled_days,
      learning_steps = excluded.learning_steps,
      last_review = excluded.last_review;

  insert into public.review_log (artwork_id, facet, mode, rating, correct, answer_ms)
  values (
    target_artwork, target_facet, given.mode, given.rating, given.correct, given.answer_ms
  );
end;
$$;

create function public.review_counts(day_start timestamptz)
returns table (due integer, new_available integer, new_today integer, with_image integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with live as (
    select artwork.id
      from public.artworks as artwork
      where artwork.deleted_at is null
        and (artwork.source_image_file is not null
          or artwork.own_image_path is not null
          or artwork.own_image_url is not null)
  )
  select
    (select count(*)::integer
      from public.review_cards as card
      join live on live.id = card.artwork_id
      where card.due < day_start + interval '1 day'),
    (select count(*)::integer
      from live
      where not exists (select 1 from public.review_cards as card where card.artwork_id = live.id)),
    (select count(*)::integer
      from public.review_cards as card
      where card.created_at >= day_start),
    (select count(*)::integer from live);
$$;

revoke all on function public.record_review(uuid, jsonb, jsonb) from public, anon;
revoke all on function public.review_counts(timestamptz) from public, anon;
grant execute on function public.record_review(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.review_counts(timestamptz) to authenticated;
