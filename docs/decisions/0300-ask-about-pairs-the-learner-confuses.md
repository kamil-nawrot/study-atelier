# 0300. Ask about pairs the learner confuses

- Status: accepted
- Date: 2026-11-15

## Context and problem statement

A learner who picks Manet in the author quiz of a Monet, or Baroque for a Rococo painting, confuses two values more than they forget one artwork. The review schedules artworks, so the confusion itself never comes back as a question. ATL-449 asks for an action on such weak spots: a question that shows two artworks side by side and asks which one is by Manet. Settled with the owner on 2026-11-03: mixed into the normal session, 2–4 such questions per session, no schedule, and a pair goes away after 3 right answers. Open: where the pairs come from, how a pair is named, and whether the list shows anywhere outside the session.

## Decision drivers

- No new screen and no new setting.
- The pairs come from answers already logged, so existing history counts from the first day.
- A session grows by a few extra questions only, like the other extra questions.

## Considered options

- Source of a pair: the wrong option of the author and style quizzes already kept in `review_log.wrong_answer`; or a new table of pairs.
- Place: extra questions after the round like the year and symbols; or places inside the round.
- End of a pair: 3 right pair answers since the last confusion; or 3 right pair answers in total.
- List outside the session: none; or a list in the statistics.

## Decision outcome

Chosen by Claude without the owner, to be reviewed with the scope of 0.24 (assumptions in `0.24-zalozenia.md` in the project files):

1. **Pairs from the log.** A pair is born when an author or style quiz (`quiz_author`, `quiz_style`) was answered wrong with a kept `wrong_answer`: the right value and the chosen one, in either order, are one pair. `confused_pairs()` returns the active pairs of the learner, the most recent first; no new table holds them.
2. **The question.** "Które z tych dzieł pasuje?" with "Autor: …" or "Styl: …" shows one artwork of each value as two image tiles. The artworks are drawn from the atelier at random among those with an image; an artwork holding both values is never drawn. Authors are compared by the joined author names of an artwork, styles by any of its styles. A pair without an artwork for each side is skipped.
3. **In the session.** One pair question per 10 places of a round, at least 2 and at most 4, among the extra questions, in every form and scope, while pairs exist. A wrong answer brings the question back later in the session like the other extra questions, and only the first answer is saved.
4. **Saving.** `record_pair_answer` logs the first answer in `review_log` with the facet `pair`, the mode `pair_author` or `pair_style` and the two values in the new column `pair`. It does not touch any review card or the streak. A right first answer gives 1 point of the museum career like the other extra questions. Free rounds ask pair questions and save nothing.
5. **End of a pair.** A pair stays active until it has 3 right pair answers after its last confusion; a new wrong quiz answer or a wrong pair answer starts the count again.
6. **Summary.** A line "Poprawnie rozróżnione pary:" with "x/y" counts the first answer of each pair in the round.
7. **No list outside the session** in this version.

### Consequences

- Good: a confusion the learner made comes back as a direct comparison, from the history already in production.
- Good: no schedule and no card to keep in sync.
- Bad: the pair list is computed from the whole log on each session start; fine at the current size, a table later if the log grows.

## More information

- ATL-449, requirement R-310.
