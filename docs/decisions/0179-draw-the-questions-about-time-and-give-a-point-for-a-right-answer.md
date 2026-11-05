# 0179. Draw the questions about time and give a point for a right answer

- Status: accepted
- Date: 2026-11-04

## Context and problem statement

[ADR-0178](0178-ask-for-the-year-and-the-chronological-order-in-the-review.md) settles how the year and order questions look and that 2–4 of them join a session on top of its artworks, the year question with its own `date` schedule and both counting towards the points of the museum career. It leaves open how the session draws them, how the `date` schedule lives next to the recognition schedule that the plan of the day, the menu counter, the streak and the exhibits read, and how an answer without a card enters the ledger of points ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)), which until now gave nothing for the extra glossary questions either ([ADR-0153](0153-add-glossary-definitions-to-the-review-as-extra-questions.md)).

## Decision drivers

- The plan of the day, the menu counter, the review start, the streak, the exhibits and the statistics keep meaning the artworks recognised, so the new schedule does not change them.
- A question about time never gives its answer away and is never asked when the scope cannot support it.
- The tabs of the previous release, and the app until the question cards are built, never receive a question they cannot show ([ADR-0139](0139-ask-the-learner-to-reload-after-a-new-release.md)).
- The points stay small next to the plan of the day and cannot grow without limit.

## Considered options

For the points:

- 1 point for a right answer, also for a glossary definition;
- 1 point for every answer;
- 2 points for a right answer, like an addition;
- counting the questions into the share of the day's plan.

For the `date` schedule: only the recognition counts for the plan, the counter, the streak and the exhibits; or every facet counts like a review.

For splitting the questions: a random 2–4 with one order question; a random 2–4 split in half; always 3.

For the forms: every form; mixed and quizzes; mixed only.

## Decision outcome

Chosen by the owner in ATL-478: 1 point for a right answer, also for a glossary definition; only the recognition counts; a random 2–4 with one order question; every form.

### Drawing

- `review_session` asks about time only when the app asks for it (`time_questions`), and only when the session has an artwork to review. It draws how many questions to ask, 2, 3 or 4, then one order question and the rest year questions; when there are fewer year questions than that, a second order question may take their place.
- A year question asks about an artwork of the session's scope with an image, a year and an era, whose year has a year in common with the era (the rule of [ADR-0176](0176-ask-before-saving-a-year-outside-its-era.md), with prehistory from 40 000 BCE and the contemporary era up to the current year, as on the slider), and which has a recognition card. Its `date` card comes first when it is due, the most overdue first, then artworks without a `date` card at random. An artwork the session already shows is not asked, so its year is not on the screen before.
- An order question shows four artworks with an image and a year from the session's scope, whose years are at least 30 years apart (a span counts from its first to its last year), in an order that is not already the right one. A second order question shows four other artworks.
- The questions stand at random places of the session, never first. A free round draws them too, from any reviewed artwork, and saves nothing ([ADR-0084](0084-free-review-after-the-day-is-done.md)).
- The slider bounds come from `eraYears` in the catalogue, over the same era boundaries as `ERA_START_YEARS`.

### Recording

- A year answer is saved with `record_review` on the artwork's `date` card with the mode `year`; a `date` card is refused for an artwork without a recognition card.
- The plan of the day, the menu counter, the review start, the streak, the exhibits (settled artworks, back from storage, night watch), the settling points and the statistics read only the `recognise` facet, and the app loads only recognition cards.
- A right answer, a year with "Wiem" or "Prawie", a whole order right or a glossary definition right the first time it is asked, adds 1 to the day's `right_answers` entry of the ledger, at most 50 a day. An order answer and a definition answer are not saved otherwise, as before.

### Consequences

- Good: the new schedule leaves every number the learner already knows as it was.
- Good: the extra questions now earn something, at most a few points next to the 10 of a whole plan.
- Bad: due `date` cards beyond the 2–4 questions of a session wait for later sessions, and no counter shows them.
- Bad: an order question takes its artworks only from the scope's years, so a scope whose years span less than 90 years gets none.

## More information

- Issues ATL-478 (this record), ATL-446 and ATL-445 (the question cards), ATL-475 (design).
