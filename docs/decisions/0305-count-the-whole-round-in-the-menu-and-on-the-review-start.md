# 0305. Count the whole round in the menu and on the review start

- Status: accepted
- Date: 2026-11-15

## Context and problem statement

[ADR-0303](0303-ask-about-artworks-in-the-round-and-side-topics-on-top.md) put the style, year and order questions into the round of N places, but the menu counter and the review start still counted only the recognition places ([ADR-0287](0287-cap-the-review-counter-in-the-menu-at-one-round.md), [ADR-0302](0302-keep-the-whole-review-plan-in-the-database.md)). A round of 20 showed 13. A style place could also stay empty: `review_session` drops a style question that has fewer than three other styles to offer as wrong answers, so the round was shorter than planned.

## Decision drivers

- The learner should see one number for the round, the same in the menu, on the review start and in the session.
- The questions about artworks are the round ([ADR-0303](0303-ask-about-artworks-in-the-round-and-side-topics-on-top.md)).

## Considered options

- Count the recognition places only, as before.
- Count the whole round: recognition, style, year and order.

## Decision outcome

Chosen by the owner during the walkthrough of 0.24: count the whole round.

- `review_round_counts` returns `styles`, `years` and `orders` beside `known` and `fresh`, and `review_round_size` adds them up. `review_counts` gives it as `waiting`, and `review_plan` gives it as `tomorrow`.
- The review start keeps its texts: the heading gives the total, and the style, year and order questions count with the returning artworks ("powracające") in the line under it.
- `review_round` gives a style place only to an artwork whose style quiz can be built, with at least three other styles in the scope; otherwise recognition takes the place.

### Consequences

- Good: a round of N shows N and holds N questions whenever there are enough artworks.
- Bad: the heading still says artworks, while an order question shows four of them; the owner kept the texts for simplicity.
