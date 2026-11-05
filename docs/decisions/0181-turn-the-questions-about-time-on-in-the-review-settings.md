# 0181. Turn the questions about time on in the review settings

- Status: accepted
- Date: 2026-11-04

## Context and problem statement

The year and order questions ([ADR-0178](0178-ask-for-the-year-and-the-chronological-order-in-the-review.md), [ADR-0179](0179-draw-the-questions-about-time-and-give-a-point-for-a-right-answer.md)) join every session, and nothing turns them off. A learner whose collection has few years, or who wants to train only recognition, gets them anyway. The same question came up for the gap in the learner's own note (ATL-447), which suits only some ways of keeping notes.

## Decision drivers

- A new kind of extra question can be turned off by a learner it does not suit.
- The list of quiz kinds keeps its rule of at least one recognition quiz.
- The settings stay short.

## Considered options

- a box on the list of quiz kinds;
- a separate switch under the glossary questions, one for both questions about time;
- a switch for the year question only;
- two switches, one for the year and one for the order question.

## Decision outcome

Chosen by the owner in ATL-479: a separate switch under the glossary questions, one for both questions about time, off by default, because they are extra questions like the glossary definitions rather than quiz kinds about an artwork, and the summary of a round already gives them one line.

- "Powtórki" in the settings has a switch "Dołączaj do sesji pytania o rok powstania i kolejność dzieł", without a hint like "Proponuj powtórkę swobodną po skończonym dniu", stored in `profiles.review_time_questions`.
- With the switch off the app asks `review_session` without `time_questions`, so the session draws no year or order question, in a free round too.
- The gap in a note (ATL-447) gets its own switch of the same kind, also off by default.

### Consequences

- Good: a learner chooses whether the session asks about time, on every device.
- Bad: the questions about time stay unknown to a learner who never opens the settings; the review start does not offer them.

## More information

- Issues ATL-479 (design), ATL-483 (the switch), ATL-447 (the gap in a note).
