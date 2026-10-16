# 0062. Schedule reviews with FSRS and store them per artwork

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

A review session ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md)) needs to know, for every artwork, when it is due and how well the learner knows it, and it must keep that across devices. Which algorithm sets the next review, how do flashcard ratings and quiz answers feed it, where is the state stored, and how are the session's images loaded?

## Decision drivers

- As few reviews as possible for the same memory: the learner's time is the scarce part.
- No own scheduler code to get wrong: a maintained library with a small footprint.
- The state lives in the database with the artwork, so it follows the learner to any device and is removed with the artwork.
- A history of answers, so the scheduler can be tuned later and the summary can show progress.
- A session of up to 20 artworks, each with up to three distractors, must not slow down the image source or the phone.

## Considered options

1. FSRS through the `ts-fsrs` library
2. SM-2, the classic algorithm of the old Anki
3. Leitner boxes with fixed intervals

## Decision outcome

Chosen option: 1, because FSRS needs about 20 to 30 per cent fewer reviews than SM-2 for the same retention, adapts to each artwork's difficulty instead of keeping hard ones in short loops, and `ts-fsrs` (MIT, about 13 KB gzipped) does the maths.

- Ratings: the flashcard's three ratings map to FSRS Again ("Nie wiem"), Hard ("Prawie") and Good ("Wiem"); Easy is not offered. A quiz always counts as a review, in every form of session: a right answer is Hard, because picking one of four is easier than recalling, and a wrong answer is Again.
- Parameters: the library's defaults, a desired retention of 0.9, short-term steps on and fuzz on. The interval shown under each rating comes from the library's preview.
- Data, in a migration with row level security and grants like the other tables:
  - `review_cards`: one row per artwork and facet (`facet` defaults to `recognise`, so later facets such as chronology can schedule separately), with the FSRS state (`due`, `stability`, `difficulty`, `state`, `reps`, `lapses`, `scheduled_days`, `learning_steps`, `last_review`), keyed by `(artwork_id, facet)` and referencing the artwork with its owner so it is deleted with the artwork. An artwork without a row is new.
  - `review_log`: one row per answer, with the artwork, facet, mode (`flashcard`, `quiz_image`, `quiz_title`, `quiz_style`), rating, whether a quiz answer was right, the time to answer and when.
  - A function `record_review` writes the new card state and the log row in one transaction; the browser computes the state with `ts-fsrs` and sends it.
  - An artwork in the trash is left out of sessions and keeps its state, which it has again when restored.
- Due counter: a function `review_counts(day_start)` returns, for the learner's artworks with an image and outside the trash, the cards due before the end of the day, the artworks without a card, the cards started since `day_start` and the number of artworks with an image. The menu shows the due cards plus new artworks up to the daily limit, and nothing below 20 artworks with an image. It is asked when the atelier opens and after a session.
- Session building: in the browser, from the loaded collection ([ADR-0041](0041-load-the-whole-collection-in-pages-of-1000.md)) and the learner's `review_cards`; new artworks are counted against the daily limit of 10 by the day their card was created (`review_cards.created_at`), with the day starting at the learner's local midnight.
- Images: when a session starts, the app resolves the images of all its artworks and distractors at once, which is at most 80 files and two calls to the image source in batches of 50 ([ADR-0044](0044-load-wall-images-near-the-screen.md)), and keeps them in the session memory of [ADR-0052](0052-remember-wall-images-and-cap-their-width.md). The next two questions are preloaded with `Image.decode()`. A flashcard uses up to 960 px, a quiz tile up to 500 px. Own images use the smaller copies of ATL-113.

### Consequences

- Good: fewer reviews, per-artwork difficulty, and a log to tune the scheduler from the learner's own history later.
- Good: state per facet lets chronology or other questions schedule on their own without a new table.
- Good: a session needs two calls to the image source, and the next question is already decoded.
- Bad: a new dependency, and FSRS is harder to explain than boxes; the app shows only when an artwork comes back, not why.
- Bad: two new tables and a function, with their own tests and grants.
- Bad: counting a right quiz answer as Hard is a judgement call; the log keeps the quiz answers apart so it can be revisited.

## More information

Spike ATL-157 and `nauka/analiza.md` in the project files (comparison of Leitner, SM-2 and FSRS). `ts-fsrs`: https://github.com/open-spaced-repetition/ts-fsrs. Requirement R-83. Session building moved to the database in [ADR-0065](0065-build-review-sessions-in-the-database.md).
