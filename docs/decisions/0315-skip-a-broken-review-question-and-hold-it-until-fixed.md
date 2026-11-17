# 0315. Skip a broken review question and hold it until it is fixed

- Status: accepted; what holds a symbol question is superseded by [0320](0320-hold-the-symbol-question-of-a-held-pin.md)
- Date: 2026-11-16

## Context and problem statement

Some flags ([ADR-0313](0313-collect-flagged-weak-items-and-missing-data-in-zaplecze.md)) mean that the question itself is broken: a pin on the wrong spot, the answer visible in the question, two answers that both fit. The learner still had to answer it, and it kept coming back until it was fixed ([ATL-795](https://linear.app/kamil-nawrot/issue/ATL-795)). The round of artworks is built by the database (`review_round`, [ADR-0302](0302-keep-the-whole-review-plan-in-the-database.md)) and the kind of question of an artwork by `review_session`, while the extra questions are picked in the browser ([ADR-0312](0312-schedule-glossary-terms-and-symbols-on-cards-of-their-own.md)).

## Decision drivers

- A broken question can be skipped without counting, and does not come back until it is fixed.
- Only what is broken is held, so an artwork with one bad pin is still reviewed.
- The round keeps its length where that is cheap.

## Considered options

1. When to skip: a checkbox in "Co poprawić?", ticked by default for the reasons that break a question; always for those reasons; a separate button.
2. What to hold: only the broken kind of question; the whole item.
3. What takes the place of the skipped question: a flashcard of the same artwork, the next extra question of the kind, nothing, or the next artwork of a fresh round.
4. An answered question: keep the answer and hold it from then on; undo the answer.
5. Outside the review: the same checkbox in the views; the review only.

## Decision outcome

Chosen by the owner on 2026-11-16: the first option of 1, 2, 4 and 5, and for 3 a combination.

1. **The checkbox.** In a review, "Co poprawić?" has "Pomiń to pytanie i wstrzymaj je do poprawki", ticked by default for the image, the pin, "Odpowiedź widać w pytaniu", the definition, the meaning and "Pasuje więcej niż jedna odpowiedź", unticked for the data, the note and "Coś innego"; under it "Wróci do powtórek, gdy poprawisz to na Zapleczu.". A flag that holds keeps `learner_flags.holds`.
2. **What is held.** A held flag of an artwork's pin holds its "Co to jest?", and "Pasuje więcej niż jedna odpowiedź" the kind of question it was set on (the title, author or style quiz, a confused pair, a relation); any other held flag of an artwork holds the whole artwork, which `review_round` leaves out, so the menu counter and the review start do not count it. A held flag of a term holds its definition question and the note gaps with it; of a symbol, its questions.
3. **The replacement.** A held kind of an artwork question becomes a flashcard of the same artwork; a wholly held artwork is replaced by the first artwork of a fresh round that the session does not hold yet (`review_session` called again); a definition or symbol question by the next one of a reserve of two picked with the session; a note gap, a pair or a relation by nothing. Later questions of the session about what is now held leave the session. The toast says "Pominięto pytanie. Wróci po poprawce na Zapleczu.".
4. **An answered question** keeps its answer; the checkbox reads "Wstrzymaj w powtórkach do poprawki" and only holds it from then on.
5. **The views** offer "Wstrzymaj w powtórkach do poprawki", unticked.

A hold ends when its flag is gone, after a fix from Zaplecze or "Wycofaj flagę"; the card comes back as overdue. A held flag's row in Zaplecze says "wstrzymane w powtórkach".

### Consequences

- Good: a broken question costs one click and does not come back until it is fixed, while the rest of the item keeps being reviewed.
- Good: the counters and the plan follow the holds of whole artworks.
- Bad: kinds held on an artwork are applied in the browser, so the round may still count an artwork whose only question becomes a flashcard.
- Bad: replacing a wholly held artwork costs one more `review_session` call.

## More information

- Linear: [ATL-795](https://linear.app/kamil-nawrot/issue/ATL-795). Builds on [ADR-0313](0313-collect-flagged-weak-items-and-missing-data-in-zaplecze.md) and [ADR-0314](0314-show-the-flags-already-set-and-let-them-be-withdrawn.md). Moving the picking of glossary and symbol questions into the database is [ATL-796](https://linear.app/kamil-nawrot/issue/ATL-796).
