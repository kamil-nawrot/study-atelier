# 0316. Pick the glossary and symbol questions in the database

- Status: accepted
- Date: 2026-11-16

## Context and problem statement

Glossary terms and atlas symbols have FSRS cards of their own ([ADR-0312](0312-schedule-glossary-terms-and-symbols-on-cards-of-their-own.md)), but the browser picked their questions: it loaded every card and the whole history of symbol answers at the start of a session, then took the due cards first, drew the new ones, chose the kind of symbol question and its pin. The round of artworks is picked by the database (`review_round`, [ADR-0302](0302-keep-the-whole-review-plan-in-the-database.md)), and held flags were applied there for artworks and in the browser for terms and symbols ([ADR-0315](0315-skip-a-broken-review-question-and-hold-it-until-fixed.md)). The owner asked for the rules of a round to live in one place ([ATL-796](https://linear.app/kamil-nawrot/issue/ATL-796)).

## Decision drivers

- The rules of a round in one place, next to `review_round`.
- The browser loads only what it asks, not every card and answer.
- No change the learner sees.

## Considered options

1. What the database picks: the terms and symbols only; also the kind of symbol question and its pin; the whole question with its wrong answers.
2. Whether note gaps, confused pairs and relations move too: no; yes.
3. Whether the plan of the review start and the menu counter count these questions: no, as in [ADR-0312](0312-schedule-glossary-terms-and-symbols-on-cards-of-their-own.md); as a separate number; inside the number of the round.
4. Where held flags of terms and symbols apply: in the database; in the browser as before.

## Decision outcome

Chosen by the owner on 2026-11-16: the second option of question 1 and the first of questions 2–4.

1. **`extra_round(day_start, reserve)`** picks the glossary definition and symbol questions of a session with the rules of [ADR-0312](0312-schedule-glossary-terms-and-symbols-on-cards-of-their-own.md): it reads the switches and counts from the profile, takes the due cards first (the most overdue first) and new terms or symbols at random in the places left, and adds `reserve` more of each kind for skipped questions. A term needs a definition and four different terms with a definition in the glossary; a symbol needs a pin with a crop on an artwork not deleted that can build a question with three other answers. For each symbol it returns the kind asked least recently in its non-practice answers (a kind never asked first, ties in the order symbol, meaning, attribute) and a pin of that kind drawn at random, with the card of each term and symbol.
2. **The browser builds the questions.** It loads the definitions of the picked terms and the picked pins only, and draws the wrong answers as before.
3. **Only glossary and symbol questions move.** Note gaps, confused pairs and relations have no cards and stay as they are.
4. **The counts stay as they are.** The menu counter, the review start and the length of the round do not count glossary and symbol questions.
5. **Held flags in the database.** `extra_round` leaves out a term or symbol with a held flag, like `review_round` leaves out a held artwork; the browser still takes out a question skipped during a session.

### Consequences

- Good: the browser no longer loads every card and the whole log of symbol answers at the start of a session.
- Good: held artworks, terms and symbols are all left out by the database.
- Bad: the check that a symbol question can be built is written twice, in SQL to pick and in the browser to build the answers; a pin whose question the browser cannot build is left out of the session.
- Bad: when `extra_round` fails, the session runs without glossary and symbol questions; before, every term and symbol counted as new.
