# 0310. Ask new style, year and order questions only with recognition

- Status: accepted
- Date: 2026-11-16

## Context and problem statement

[ADR-0305](0305-count-the-whole-round-in-the-menu-and-on-the-review-start.md) counts the whole round in the menu, and R-312 says a day with nothing else left counts 0. `review_round` kept the year and order questions only in a round that recognises or asks the style of an artwork. A new style question, of an artwork recognised once whose style was never asked, has no due date and no daily limit, so every round found up to one place in five for new styles, and the year and order questions joined them. Right after 0.24.0 the owner saw the menu counter stay at 10 (6 style, 3 year and 1 order of a round of 30) after every finished round, and the free round was never offered (ATL-786).

## Decision drivers

- A day of reviews has to end at 0.
- A style card with a due date should still be asked on time.

## Considered options

- Without any artwork to recognise, the round holds only the style cards due today.
- Without any artwork to recognise, the round is empty.
- A daily limit on new style questions.

## Decision outcome

Chosen by the owner on 2026-11-16: without any artwork to recognise, the round holds only the style cards due today.

- New style questions, the year questions and the order question join only a round that recognises an artwork.
- A round with nothing to recognise keeps the style picks that have a card, so the menu counter and the review start show the number of style cards due today, and 0 once they are answered.
- A daily limit on new style questions was not chosen: it needs a new arbitrary value and alone it would not end the day at 0.

### Consequences

- Good: the counter reaches 0 when the day is done, and due style cards keep their schedule.
- Bad: on a day with no recognition left, a short round of only style questions can remain.

## More information

- The style rule is replaced by [ADR-0336](0336-return-the-style-question-to-the-recognition-of-an-artwork.md): the style quiz is again a recognition question, so a round has no style questions of its own. The rule of the year and order questions stays.
