# 0078. Show a streak of days with reviews on the review start

- Status: accepted
- Date: 2026-10-17

## Context and problem statement

The learner asked for the number of days in a row with reviews to be shown in the review module, counting the reviews already done. How is the streak computed, and which day counts?

## Decision drivers

- Reviews done before the feature ships count, with no backfill.
- The day is the same one the learner sees in the rest of the module ([ADR-0065](0065-build-review-sessions-in-the-database.md)).
- Simple form for now.

## Considered options

- A counter column kept up to date by `record_review`
- A database function that computes the streak from `review_log`
- Computing the streak in the browser from the loaded log

## Decision outcome

Chosen option: "a database function that computes the streak from `review_log`". Every answer is already logged with `reviewed_at`, so `review_streak(day_start, time_zone)` groups the log by day in the learner's time zone (the one the browser reports) and counts the run of consecutive days that ends today or, when today has no review yet, yesterday. A streak therefore stays alive until the end of the day after the last review. Any answer, flashcard or quiz, makes a day count. Nothing is stored, so past reviews count from the first day they were logged.

The start of a review shows one line, "Seria: n dni z powtórkami z rzędu", only when the streak is at least one day. There is no record, calendar or reward.

### Consequences

- Good: no new column, no backfill and no way for a counter to drift from the log.
- Good: the day follows the device's time zone, like the daily limit of new artworks.
- Bad: a learner who changes time zone can see the streak break or stretch by a day.
- Bad: the function reads the whole log of the learner; the `(owner_id, reviewed_at)` index keeps this cheap at the expected size.

## More information

Migration `20261017100000_review_streak.sql`, test `supabase/tests/review-streak.sql`; ATL-193.
