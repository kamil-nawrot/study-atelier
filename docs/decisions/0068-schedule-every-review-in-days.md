# 0068. Schedule every review in days, without short-term steps

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

[ADR-0062](0062-schedule-reviews-with-fsrs.md) runs FSRS with short-term steps on, so a new or forgotten artwork stays in a learning state that brings it back within minutes until it is rated Good. A right quiz answer counts as Hard, and Hard in the learning state brings the artwork back in 6 minutes every time. A mixed session asks new and learning artworks only quizzes ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md)), so they never left learning, and the counter in the menu, which counts cards due before the end of the day, kept showing them after a finished session (ATL-174). How should the scheduler treat the first answers to an artwork?

## Decision drivers

- Reviewing is one step a day: a finished session leaves nothing waiting today.
- A right quiz answer must move an artwork on, whatever the form of the session.
- The session already brings a forgotten artwork back three to five cards later.

## Considered options

- Turn short-term steps off: every answer schedules the artwork a day or more ahead.
- Count a right quiz answer as Good while the artwork is new or in learning.
- Both.

## Decision outcome

Chosen option: turn short-term steps off, as the owner decided.

- `ts-fsrs` runs with `enable_short_term: false`. A new artwork comes back after about one day for "Nie wiem", two for "Prawie" and three for "Wiem", before fuzz; a forgotten one the next day.
- The same-day repetition is the session's own: a wrong answer comes back later in the session, as before.
- Without short-term steps FSRS keeps a forgotten artwork in the review state and only counts the lapse. So that a forgotten artwork still gets a quiz in a mixed session, `review_session` treats an artwork whose last answer in `review_log` was "Nie wiem" like one in learning.
- Artworks already stuck in learning move to days at their next answer; no data changes.

### Consequences

- Good: a finished session clears the counter, and every quiz answer moves the schedule on.
- Good: the scheduler does nothing within a day that the session does not already do.
- Bad: an artwork learnt today is not checked again in a few minutes by the scheduler, only by the session's retry when it was wrong.

## More information

Replaces the "short-term steps on" of the parameters line of [ADR-0062](0062-schedule-reviews-with-fsrs.md). Migration `20261016110000_quiz_forgotten_artworks.sql`, test `supabase/tests/review-session.sql`; ATL-174.
