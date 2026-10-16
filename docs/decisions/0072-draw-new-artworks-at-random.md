# 0072. Draw the new artworks of a session at random

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

`review_session` ([ADR-0065](0065-build-review-sessions-in-the-database.md)) adds new artworks, up to 10 a day, in the order they were added to the atelier. A learner who entered a large collection meets its oldest records first, for weeks, and the same ones on every device. The owner also asked whether the whole collection could be reviewed any number of times a day, each time with a fresh set of artworks. In what order should new artworks come, and may the daily limit be passed?

## Decision drivers

- A session mixes the atelier from its first day.
- The daily limit keeps the reviews of the following days bearable.

## Considered options

- New artworks in the order they were added (as before).
- New artworks drawn at random from the scope.
- New artworks drawn in turn from every era of the scope.
- On top of a random draw, further rounds of 10 new artworks after today's plan, as many as the learner wants.

## Decision outcome

Chosen option: new artworks drawn at random from the scope, as the owner decided. The due artworks still come first, the most overdue first, and the new ones fill what is left of the session, up to 10 a day. The draw happens each time a session is built, so a session that is stopped before any answer may draw others the next time.

Further rounds of new artworks beyond the daily limit were considered and rejected by the owner: an artwork answered today comes back in one to three days, so bringing in the whole collection in one day would bring almost all of it back on the same day a few days later. Rounds of the artworks due today stay unlimited.

### Consequences

- Good: the first sessions mix eras, authors and styles, whatever order the atelier was entered in.
- Bad: which new artworks come next cannot be foreseen, and the start screen counts how many, not which.

## More information

Changes the order of new artworks in [ADR-0065](0065-build-review-sessions-in-the-database.md). Migration `20261016130000_draw_new_artworks_at_random.sql`, test `supabase/tests/review-session.sql`; ATL-176. The scopes and the start of the same issue are in [ADR-0071](0071-put-the-plan-first-on-the-review-start.md).
