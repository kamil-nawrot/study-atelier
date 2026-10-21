# 0103. Draw free review rounds at random

- Status: accepted
- Date: 2026-10-21

## Context and problem statement

[ADR-0084](0084-free-review-after-the-day-is-done.md) builds a free review round from the artworks already reviewed, the weakest first: they are ordered by stability, lapses and record number, and round _n_ takes the next 20. The round counter lives in the page and starts at 0 on every visit, and a free round saves no answer, so the order never changes. A learner reported that every free review was the same: the same 20 artworks in the same order on every visit (ATL-256). Which artworks should a free round take?

## Decision drivers

- Two free rounds in a row, or on two visits, should not be the same.
- A free round still saves nothing and stays out of the schedule.
- The earlier calls of `review_session` keep working while the new code is deployed.

## Considered options

- Keep the weakest-first order and remember the round counter for the day.
- Draw 20 at random from the weakest 40.
- Remember the round counter for the day and shuffle the order inside a round.
- Draw 20 at random from every reviewed artwork.

## Decision outcome

Chosen option: "draw 20 at random from every reviewed artwork", by the owner.

- The pool of a free round is every artwork of the scope with a review card, the "Utrwalone" and "W trakcie nauki" of the review start; nothing else of ADR-0084 changes.
- Every free round draws up to 20 artworks from the pool at random, in random order, whatever its number. `review_session` keeps its optional `free_round`, which now only marks the session as free.
- The caption under "Powtórka swobodna" reads "Dodatkowa runda losowo wybranych dzieł, które już powtarzasz. Nie zmienia planu powtórek ani serii."

### Consequences

- Good: every free round is different, also on a new visit.
- Good: no state to keep in the browser.
- Bad: the weakest artworks no longer get the extra practice first, and an artwork can come back in the next round.

## More information

- [ADR-0084](0084-free-review-after-the-day-is-done.md): free review rounds; this ADR replaces its choice of artworks.
- Migration `20261021180000_draw_free_review_rounds_at_random.sql`.
