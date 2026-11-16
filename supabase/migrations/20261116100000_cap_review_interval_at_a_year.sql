create or replace function private.next_style_card(
  card public.review_cards,
  reviewed_at timestamptz,
  grade integer
)
returns public.review_cards
language plpgsql
immutable
set search_path = ''
as $$
declare
  w constant double precision[] := array[
    0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796,
    1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542
  ];
  decay constant double precision := -0.1542;
  factor double precision;
  elapsed integer := 0;
  recall double precision;
  forget double precision;
  again_stability double precision;
  hard_stability double precision;
  again_days integer;
  hard_days integer;
  damped double precision;
  easy_start double precision;
  following public.review_cards := card;
begin
  factor := round((exp(ln(0.9) / decay) - 1)::numeric, 8)::double precision;
  if card.last_review is null then
    following.difficulty := least(10, greatest(1,
      round((w[5] - exp((grade - 1) * w[6]) + 1)::numeric, 8)::double precision));
    following.stability := greatest(w[grade], 0.1);
    again_stability := greatest(w[1], 0.1);
    hard_stability := greatest(w[2], 0.1);
    following.reps := 1;
    following.lapses := 0;
  else
    elapsed := (reviewed_at at time zone 'UTC')::date - (card.last_review at time zone 'UTC')::date;
    recall := round(power(1 + factor * elapsed / card.stability, decay)::numeric, 8)::double precision;
    forget := round(least(36500, greatest(0.001,
      w[12] * power(card.difficulty, -w[13]) * (power(card.stability + 1, w[14]) - 1)
        * exp((1 - recall) * w[15])
    ))::numeric, 8)::double precision;
    again_stability := least(greatest(card.stability, 0.001), forget);
    hard_stability := round(least(36500, greatest(0.001,
      card.stability * (1 + exp(w[9]) * (11 - card.difficulty) * power(card.stability, -w[10])
        * (exp((1 - recall) * w[11]) - 1) * w[16])
    ))::numeric, 8)::double precision;
    damped := card.difficulty
      + round((-w[7] * (grade - 3) * (10 - card.difficulty) / 9)::numeric, 8)::double precision;
    easy_start := round((w[5] - exp(3 * w[6]) + 1)::numeric, 8)::double precision;
    following.difficulty := least(10, greatest(1,
      round((w[8] * easy_start + (1 - w[8]) * damped)::numeric, 8)::double precision));
    following.stability := case when grade = 1 then again_stability else hard_stability end;
    following.reps := card.reps + 1;
    following.lapses := card.lapses + case when grade = 1 then 1 else 0 end;
  end if;
  again_days := least(365, greatest(1, round(again_stability::numeric)::integer));
  hard_days := least(365, greatest(1, round(hard_stability::numeric)::integer));
  again_days := least(again_days, hard_days);
  hard_days := greatest(hard_days, again_days + 1);
  following.scheduled_days := case when grade = 1 then again_days else hard_days end;
  following.due := reviewed_at + make_interval(days => following.scheduled_days);
  following.state := 2;
  following.learning_steps := 0;
  following.last_review := reviewed_at;
  following.last_rating := grade;
  return following;
end;
$$;
