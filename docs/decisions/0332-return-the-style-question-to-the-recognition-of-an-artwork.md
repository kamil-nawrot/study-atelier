# 0332. Return the style question to the recognition of an artwork

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

Since 0.24 the style of an artwork has had its own review card and up to one place in five of a round ([ADR-0291](0291-give-the-style-of-an-artwork-its-own-review-card.md)), and a round with nothing left to recognise holds only the style cards due that day ([ADR-0310](0310-ask-new-style-year-and-order-questions-only-with-recognition.md)). The style cards built from past quizzes came due together, and since a round of 40 held at most 8 of them, the owner needed over a dozen rounds of 8 style questions to clear the day ([ATL-835](https://linear.app/kamil-nawrot/issue/ATL-835)).

Production data from 2026-11-15 to 2026-11-19: 117 style answers, 87.2% right against 93.7% for recognition; style questions 32.6% of all answers instead of at most a fifth; 15 style misses, 3 of them on artworks with a recognition stability of at least 21 days; 119 style cards with a median interval of 9 days against 19 for recognition.

Should the style keep its own card, or go back into the recognition of an artwork?

## Decision drivers

- A day of reviews ends in a few rounds, not a dozen.
- Fewer rules for a round: the style places, the style cards and the special round without recognition all add to `review_round`.
- A missed style on a well known artwork costs little in the data so far (3 cases in 5 days).

## Considered options

- Keep the style card and let it fill a whole round when nothing is left to recognise.
- Return the style question to recognition, where a wrong style answer counts as "Nie wiem".
- Return it to recognition, where a wrong style answer counts as "Prawie".

## Decision outcome

Chosen by the owner on 2026-11-19: return the style question to recognition, where a wrong style answer counts as "Nie wiem".

1. **Recognition question.** The style quiz is again a question about recognising an artwork: a right answer counts as "Prawie" and a wrong one as "Nie wiem" for the recognition card, like the other quizzes. There is no style card and no place for style in the round; the round holds only artworks to recognise and the extra questions.
2. **Form "Mieszane".** An artwork in review state with a style can get the style quiz as a due kind, under the rule of the detail and the typed title in [ADR-0288](0288-choose-the-review-question-from-the-artworks-own-history.md): at most every third answer of the artwork, and when several kinds are due the one waiting longer wins. On a tie the detail comes first, then the typed title, then the style (this order is arbitrary). A new, learnt or forgotten artwork keeps the quiz of title, image or author. This was the owner's first choice in ADR-0288.
3. **Form "Quizy".** The style joins title, image and author: the artwork gets the kind asked least recently for it, in that order on a tie.
4. **Unchanged.** The form "Fiszki" and a style scope ([ADR-0070](0070-no-style-quiz-in-a-style-scope.md)) ask no style. A style quiz that cannot be built (fewer than three other styles) falls back to the next kind and finally to a flashcard. The year and order questions still join only a round that recognises an artwork (ADR-0310).
5. **Existing data.** The migration deletes the style cards. The style answers stay in the history as they are, with their facet `style`; the recognition cards are not changed for them. Since the rotation reads the recognition answers only, a style answer given between 0.24 and this change does not count as the last time the style was asked. The export no longer has style cards, and the import skips those of an older export.
6. **Summary and points.** The line "Poprawnie dopasowane style:" goes. A style quiz counts in the bar of the summary and gives a point of the career like any right recognition answer.

### Consequences

- Good: a day of reviews ends with the recognition due, without rounds of style questions only.
- Good: `review_round` and `review_session` lose the style places, the style cards and their special round.
- Bad: a missed style sends a known artwork back to the next day again, as before 0.24.
- Bad: style knowledge has no schedule of its own; it is asked at the pace of the artwork.
- Bad: the scheduling history of the 119 style cards is lost; only their answers remain.

## More information

- Replaces [ADR-0291](0291-give-the-style-of-an-artwork-its-own-review-card.md) and the style rule of [ADR-0310](0310-ask-new-style-year-and-order-questions-only-with-recognition.md).
