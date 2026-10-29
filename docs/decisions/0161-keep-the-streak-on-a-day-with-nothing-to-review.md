# 0161. Keep the streak on a day with nothing to review

- Status: accepted
- Date: 2026-10-29

## Context and problem statement

[ADR-0078](0078-show-a-streak-of-days-with-reviews-on-the-review-start.md) counts the run of consecutive days with a review answer. On a day when nothing waits (no artwork is due and no new artwork can join), the learner can only take a free round, which saves no answer, so the streak breaks through no fault of theirs. With the streak multiplying the points of the day's plan ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)), the break also costs points. How does the streak treat such a day?

## Decision drivers

- A day on which nothing waited does not end a streak.
- It does not add a day either: the streak counts days with reviews.
- The streak is still computed from the log, with no stored counter that can drift.
- The learner does not have to open the app on such a day.

## Considered options

- Keep the rule of ADR-0078
- Store the days without a plan when the learner opens the app on them
- Rebuild those days from the log, which keeps each card's due date before every answer

## Decision outcome

Chosen by the owner: a day on which nothing waited is neutral; the third option builds it.

- `record_review` writes the card's due date before the answer into the new column `review_log.due_before`; the export and import carry it.
- `review_streak(day_start, time_zone)` walks back from yesterday: a day with an answer adds one, a day on which nothing waited is passed over, and any other day ends the streak. Today counts when it has an answer and never ends the streak, as before.
- Nothing waited on a day when the learner had fewer than 20 artworks with an image in the atelier then, or when every one of them was already in the reviews and no card was due by the end of that day. A card's due date on a past day is the `due_before` of its first answer after that day, or its current due date when it has none since.
- An answer logged before this change has no `due_before`, so its card counts as waiting on the days before it, and an older gap ends the streak as it did.

### Consequences

- Good: a small collection that has been fully learnt keeps its streak between due dates.
- Good: no stored state; the rule works retroactively from the day the column is filled.
- Bad: one more column on every answer, and the streak looks at the cards for each day without an answer it passes, which stays cheap for the expected gaps.
- Bad: whether an artwork has an image is read as it is now, not as it was on that day.

## More information

ATL-383. Supersedes the counting rule of ADR-0078; its place on the review start and its tag stay as they are.
