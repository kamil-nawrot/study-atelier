begin;

with params as (
  select id as owner_id, interval '1 day' * 1 as shift
    from auth.users
    where email = 'learner@example.com'
),
cards as (
  update public.review_cards as card
     set due = card.due - params.shift,
         last_review = card.last_review - params.shift,
         created_at = card.created_at - params.shift
    from params
    where card.owner_id = params.owner_id
  returning 1
),
log as (
  update public.review_log as entry
     set reviewed_at = entry.reviewed_at - params.shift
    from params
    where entry.owner_id = params.owner_id
  returning 1
)
select (select count(*) from cards) as cards_shifted,
       (select count(*) from log) as answers_shifted;

commit;
