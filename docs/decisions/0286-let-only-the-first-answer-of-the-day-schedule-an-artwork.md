# 0286. Let only the first answer of the day schedule an artwork

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

An artwork the learner did not know comes back later in the same session (R-78). Up to 0.23 every answer, the repeated one included, went through `record_review`, which ran FSRS again and overwrote the card. "Nie wiem" followed by "Wiem" five questions later scheduled the artwork in 3 days instead of 1, while the summary of the round showed it under "Do poprawki". Two "Nie wiem" in a row counted two lapses, which inflated "Powrót z magazynu" and the artworks forgotten most often in "W pamięci". The repeated question also came back without limit.

The state "forgotten", which gives an artwork a quiz instead of a flashcard, was not stored: `review_session` read it from the last rating in `review_log` (FSRS with short-term steps off never goes back to learning, [ADR-0068](0068-schedule-every-review-in-days.md)). Logging repeated answers as before would change that state by accident.

Which answers schedule an artwork, what happens to the others, and where is "forgotten" kept?

## Decision drivers

- The schedule follows the learner's real recall, not a second look minutes later.
- The summary of the round and the schedule tell the same story.
- One place holds the rule, and it holds on every device.
- Counters of memory (lapses, statistics, exhibits) count each day once.

## Considered options

- Who keeps the rule: the database, the browser, or both.
- How often the repeated question comes back: until right as before, until right at most twice, or once.
- What the card keeps: whether the artwork is forgotten, the last rating, or nothing new (read the history without practice).
- Whether the session marks the repeated question on screen.

## Decision outcome

Chosen by the owner:

1. **The first answer of the day schedules.** For each artwork and facet, the first answer saved on the learner's day (from local midnight) runs FSRS and updates the card. `record_review` checks for an earlier scheduling answer of that artwork and facet on the same day; when there is one, it logs the answer as **practice** and leaves the card, its lapses and its due date as they are. The rule lives in the database only, so a second tab or a second device behaves the same.
2. **Practice is logged.** `review_log` gets `practice boolean not null default false`. A practice entry keeps the mode, rating, answer, time and wrong answer like any other.
3. **The repeated question in the session** (Polish: "powtórne pytanie w sesji") comes back after a wrong answer or "Nie wiem" until the learner gets it right, at most twice per artwork in a session. The browser no longer runs FSRS for it; it sends the answer and keeps the card it has.
4. **The card keeps its last rating.** `review_cards` gets `last_rating smallint` (1, 2 or 3, null before the first answer), written from the scheduling answer only. An artwork is forgotten when `last_rating = 1`. `review_session`, the review start and anything else that needs the state read it from the card instead of the history.
5. **The screen does not change.** The repeated question looks as before; the summary of the round already counts the first answer of each artwork.

Not part of the rule: a free round still saves nothing ([ADR-0103](0103-draw-free-review-rounds-at-random.md)), and a right quiz answer still counts as "Prawie".

### What counts practice

| Reader                                                                                                              | Practice                                         |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| the card: due, stability, lapses, `last_rating`                                                                     | never changes it                                 |
| "W pamięci": share of right quiz answers, reviewed most often, forgotten most often                                 | left out                                         |
| the history behind the question kind ([ADR-0288](0288-choose-the-review-question-from-the-artworks-own-history.md)) | left out                                         |
| exhibits that count memory ("Pamięć", "Powrót z magazynu")                                                          | left out (they read the card)                    |
| exhibits and limits that count activity ("Nocna warta", the 1000 answers a day)                                     | counted                                          |
| the streak and the share of the plan                                                                                | unchanged: they count artworks answered on a day |

### Existing data

The migration fills the new columns from the history: for every artwork and facet, an entry that is not the first of its day is marked practice, and `last_rating` takes the rating of the first entry of the last day the artwork was answered. Days are cut at UTC midnight, since older entries do not keep the learner's time zone; an answer given just around midnight may land on the neighbouring day, which is acceptable. Lapses already counted twice stay as they are. The build checks the result on the production data with a read-only query before the release.

### Consequences

- Good: "Nie wiem" and then "Wiem" brings the artwork back the next day, as the summary says.
- Good: lapses, "Powrót z magazynu" and the statistics stop counting the same miss twice.
- Good: "forgotten" is a stored, readable fact, and `review_session` loses a subquery per artwork.
- Good: the session cannot loop on one artwork the learner keeps not knowing.
- Bad: `record_review` reads `review_log` once more on every answer (by the existing index on `artwork_id, reviewed_at`).
- Bad: the export and import carry two more columns, and an older export needs the same filling as the migration.

## More information

- Linear: ATL-714. Analysis of 0.22: `powtorki-0-22/opis.md` in the project files, section 16, points 1 and 3.
- Requirements R-78, R-83, R-180 and R-298.
- [ADR-0062](0062-schedule-reviews-with-fsrs.md) keeps the history for a later fit of the FSRS weights; practice entries are marked so a fit can leave them out.
