# 0291. Give the style of an artwork its own review card

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

The style quiz ("W jakim stylu powstało to dzieło?") was one of the questions about recognising an artwork: a right answer counted as "Prawie" and a wrong one as "Nie wiem" for the artwork's recognition card. The production history of the first month (`powtorki-0-24/analiza-parametrow.md` in the project files) shows the style quiz right in 88.9% of reviews against 94.5% for flashcards. Knowing a style is a different skill from knowing the artwork: a learner can know a painting well and still miss its style, and that miss sent the artwork's recognition back to the next day.

The year of an artwork already has its own card (facet `date`, [ADR-0178](0178-ask-for-the-year-and-the-chronological-order-in-the-review.md)). How should the style be reviewed, and where does it fit in a session that already carries extra questions (definitions, symbols, note gaps, year and order)?

## Decision drivers

- A wrong style does not move the recognition of the artwork, and the other way round.
- A session does not grow: the owner found the extra questions over the round already too many.
- Recognition stays the core of a round.
- No new setting.

## Considered options

- Where the style question goes: an extra question over the round like the year; inside the round, at most every fifth place; or instead of the artwork's flashcard when both cards are due.
- When an artwork gets the style: after its first recognition answer, only once settled, or from the start.
- Where the style cards of existing artworks start: from the past style quizzes, or from nothing.
- How the summary shows it: an own line and a point of the career, an own line without a point, or inside the bar with recognition.

## Decision outcome

Chosen by the owner: inside the round at most every fifth place, after the first recognition answer, from the past style quizzes, with an own line and a point.

1. **Own card.** The style of an artwork is reviewed on its own card, facet `style` in `review_cards`, scheduled by FSRS like recognition. A right answer counts as "Prawie" and a wrong one as "Nie wiem" for the style card only. The recognition card never changes from a style answer, and the style card never changes from a recognition answer. The first answer of the day rule and practice ([ADR-0286](0286-let-only-the-first-answer-of-the-day-schedule-an-artwork.md)) hold per facet, so a wrong style comes back as a repeated question in the session like any quiz.
2. **Who gets it.** An artwork with an image and at least one style gets style questions once it has a recognition card (its first recognition answer), while the quiz kind "Dopasowywanie stylu do dzieła" is on, in the forms "Mieszane" and "Quizy". The form "Fiszki" and a style scope ([ADR-0070](0070-no-style-quiz-in-a-style-scope.md)) ask none.
3. **Place in the round.** A round of N holds N questions. Style questions take at most one place in five (`floor(N / 5)`: 2 of 10, 4 of 20, 6 of 30, 8 of 40); recognition takes the rest, and when fewer style questions are due, recognition fills their places. The style cards due first, the most overdue first, then new style cards drawn at random fill the free style places; there is no daily limit of new style cards. A style question never stands right before or after the same artwork's recognition question. The plan of the review start and the menu counter ([ADR-0287](0287-cap-the-review-counter-in-the-menu-at-one-round.md)) count the artworks to recognise in the next round, after the style places are taken.
4. **No style in the recognition rotation.** The recognition questions of [ADR-0288](0288-choose-the-review-question-from-the-artworks-own-history.md) no longer include the style quiz: in "Mieszane" an artwork being learnt gets a flashcard unless its detail is due, and in "Quizy" the rotation is title, image and author.
5. **Summary and points.** The bar of the summary counts recognition only. A new line "Poprawnie dopasowane style:" with "x/y" counts the first style answer of each artwork in the round, like the year and symbols, and a right first answer gives 1 point of the museum career (within the 50 a day of `right_answers`). The streak still counts recognition answers only.
6. **Existing data.** The migration builds a style card for every artwork with past style quizzes (171 answers on 117 artworks in production) by running FSRS over the first style answer of each day, in order. The past entries keep their facet `recognise` in the history, and their effect on the recognition cards stays as it is. Other artworks start their style card with the first style question.

Free rounds ask style questions in the same share and save nothing ([ADR-0103](0103-draw-free-review-rounds-at-random.md)). The question screen does not change.

### Consequences

- Good: a missed style no longer brings a known artwork back the next day, and style knowledge has a schedule of its own.
- Good: every artwork with a style gets style questions at the pace of its own memory, not every third answer.
- Good: the length of a session stays the same.
- Bad: with a large backlog of recognition, a fifth of the round goes to style and the backlog clears a little slower.
- Bad: the plan of the review start, the menu counter and `review_session` must all account for the style places, until ATL-717 counts the whole plan in one place.
- Bad: one more facet in the export, the import and `record_review`.

## More information

- Decided in the 0.24 design thread on 2026-11-14 after the analysis of the parameters. Requirements R-299 and R-302.
- Partly replaces the style rule of [ADR-0288](0288-choose-the-review-question-from-the-artworks-own-history.md), which is still in the same pull request.
