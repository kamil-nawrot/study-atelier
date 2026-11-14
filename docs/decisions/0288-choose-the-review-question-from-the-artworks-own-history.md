# 0288. Choose the review question from the artwork's own history

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

`review_session` chose the question for an artwork partly from the place the artwork landed in the session:

| Choice                                       | Up to 0.23                                           |
| -------------------------------------------- | ---------------------------------------------------- |
| quiz for a new or forgotten artwork          | title, image or author rotated by place (`slot % 3`) |
| style quiz for an artwork still being learnt | places 3, 6, 9…                                      |
| detail ("Co to jest?", R-134)                | tried at places 1, 4, 7…                             |
| quiz kind in the form "Quizy"                | rotated by place (`slot % 4`)                        |
| typed title for a settled artwork (R-187)    | every third settled artwork of the session           |

The same artwork in the same state got a different question by chance, and an artwork could get the style quiz three sessions in a row or never.

What should decide the question, and what wins when two questions are due at once?

## Decision drivers

- The same artwork in the same state gets the same question.
- Every kind comes back to every artwork at a steady pace.
- Keep today's proportions: flashcards stay the main question for known artworks.
- The history needed is already in `review_log`.

## Considered options

- How "long ago" is measured: in the artwork's answers, in days, or a full rotation without a threshold.
- What wins when the detail meets the style quiz or the typed title: the one waiting longer, always the detail, or always the other one.

## Decision outcome

Chosen by the owner: count in the artwork's answers, and let the question waiting longer win.

**History.** The history of an artwork is its answers on the recognition facet that set its schedule, newest first, with the mode of each. Practice answers ([ADR-0286](0286-let-only-the-first-answer-of-the-day-schedule-an-artwork.md)) and free rounds, which save nothing, are not part of it. A kind is **due** for an artwork when it was not asked in the artwork's last two answers and the artwork has at least two answers, so it comes at most every third answer. A kind **waits** for as many answers as were given since it was last asked, or for all of them when it never was.

**Form "Mieszane".**

1. A new artwork, or a forgotten one (`last_rating = 1`), gets a quiz about recognition: of title, image and author, among the kinds turned on, the one asked least recently for this artwork; one never asked comes first, and ties follow that order. The detail is not asked here, since it does not test whether the learner knows the artwork.
2. Any other artwork gets a flashcard, unless one of these is due:
   - the detail, when the artwork has a pin with a glossary entry and the kind is on;
   - the style quiz, when the stability is under 7 days, the kind is on and the scope is not a style ([ADR-0070](0070-no-style-quiz-in-a-style-scope.md));
   - the typed title, when the stability is at least 7 days and the kind is on.
3. When two are due (the detail and one of the others; the style quiz and the typed title never meet), the one waiting longer wins, and the detail wins a tie. The other stays due for the next answer.

**Form "Quizy".** The detail and the typed title follow the same rule as in "Mieszane". Otherwise the artwork gets, among title, image, author and style that are on, the kind asked least recently for it, in that order on a tie.

**Form "Fiszki".** Flashcards only, as before.

**Unchanged.** A quiz that cannot be built (fewer than four sensible answers) falls back to the next kind in the same order and finally to a flashcard. A repeated question in the session keeps the kind of the first, with the answers shuffled. Free rounds follow the same rules; since they save nothing, they read the history without moving it. The extra questions (definitions, note gaps, symbols, year and order) keep their own rules.

### Consequences

- Good: the question follows the artwork, so a session is the same whatever the order of its artworks.
- Good: every artwork gets the style quiz, its detail and the typed title at a steady pace instead of by chance.
- Good: the order of artworks in the session (era interleaving) and the choice of question no longer depend on each other, which simplifies the split of `review_session` in ATL-717.
- Bad: `review_session` reads the last answers of up to 40 artworks (by the index on `artwork_id, reviewed_at`).
- Bad: a settled artwork comes back rarely, so its typed title comes every third review of that artwork, which can be months apart; before, it came every third settled artwork of a session.
- Bad: free rounds without saved answers ask the same artwork the same kind until a scheduled review moves its history.

## More information

- Linear: ATL-716. Analysis of 0.22: `powtorki-0-22/opis.md` in the project files, section 6.
- Requirements R-78, R-187 and R-299.
- Builds on [ADR-0065](0065-build-review-sessions-in-the-database.md): the choice stays in `review_session`.
