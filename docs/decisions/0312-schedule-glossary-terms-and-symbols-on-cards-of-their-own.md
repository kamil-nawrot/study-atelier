# 0312. Schedule glossary terms and symbols on cards of their own

- Status: accepted
- Date: 2026-11-16

## Context and problem statement

The glossary definitions ([ADR-0153](0153-add-glossary-definitions-to-the-review-as-extra-questions.md)) and the symbols of the atlas ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)) are asked as extra questions drawn at random, and their answers are not saved. A well-known term comes back as often as a forgotten one, and nothing is remembered about either. The scope of 0.25 (`0.25-zakres.md` in the project files) gives FSRS cards to terms and symbols only; note gaps, confused pairs and relations stay drawn as today. The 365-day cap of [ADR-0311](0311-cap-every-review-interval-at-a-year.md) applies to the new cards.

What is a card of a term and of a symbol, where do their questions stand in a session, which questions schedule them, and what happens when a question can no longer be built?

## Decision drivers

- The questions follow the learner's memory: a forgotten term or symbol comes back sooner than a known one.
- The round of artworks, the menu counter and the review start stay as they are ([ADR-0303](0303-ask-about-artworks-in-the-round-and-side-topics-on-top.md), [ADR-0305](0305-count-the-whole-round-in-the-menu-and-on-the-review-start.md)).
- The rules of the artwork cards hold for the new cards: the first answer of the day schedules ([ADR-0286](0286-let-only-the-first-answer-of-the-day-schedule-an-artwork.md)), a free round saves nothing ([ADR-0103](0103-draw-free-review-rounds-at-random.md)), the kind of question follows the card's own history ([ADR-0288](0288-choose-the-review-question-from-the-artworks-own-history.md)).
- A short edit of a definition or a pin does not throw away what the learner remembers.

## Considered options

1. What a card of a symbol is: one card per symbol; a card of its look and a card of its meaning; a card of its look and one per meaning.
2. Where the questions stand: extra questions as today with due cards first; every due card on top of the round with the count for new ones only; places inside the round like the style.
3. How new cards come in: only into the places left after due cards; always one place for a new card; a daily limit of new cards.
4. Whether "Co to jest?" on an artwork pin schedules the term: no, the artwork only; both cards; the term only.
5. A card whose question cannot be built (a term without a definition, a symbol without a pin): the card waits; the card is deleted.
6. Whether a settled term or symbol gives a point of the museum career: no; yes, once its card reaches 7 days.
7. The count of glossary and symbol questions, checked against the production data (216 terms, all with a definition; 3 symbols with one meaning and one pin each): 1–3 as today; 1–5; 1–10.

## Decision outcome

Chosen by the owner on 2026-11-16: the first option of questions 1–6 and 1–5 for question 7.

1. **Cards.** A glossary term has one card, scheduled by the definition question ("Jakie pojęcie opisuje ta definicja?"). A symbol has one card, scheduled by all three symbol questions ("Co przedstawia ten detal?", "Jakie znaczenie ma tu ten symbol?", "Do kogo należy ten atrybut?"). The browser runs FSRS for them with the same settings as for artworks, an interval of at most 365 days included. A right answer counts as "Prawie" (2) and a wrong one as "Nie wiem" (1), like every quiz.
2. **Extra questions as today.** Glossary and symbol questions stay extra questions on top of the round, with the switch and the count of [ADR-0303](0303-ask-about-artworks-in-the-round-and-side-topics-on-top.md). Instead of a draw, each kind takes its due cards first, the most overdue first, and only then new terms or symbols. The menu counter, the review start and the length of the round do not count them.
3. **New cards in the free places.** A term or symbol without a card gets a place only when fewer due cards than the count can be asked; there is no separate limit of new cards. New ones are drawn at random.
4. **"Co to jest?" schedules the artwork only.** The detail question of an artwork pin ([ADR-0109](0109-pin-details-on-the-artwork-image.md)) stays a recognition question of the artwork and does not touch the card of the term. The note gap with a term ([ADR-0182](0182-ask-for-a-term-from-the-own-note-and-a-title-typed-from-memory.md)) has no card either.
5. **A card waits.** A card is created by its first scheduling answer. When its question cannot be built (a term without a definition, a symbol without a pin with a crop, too few other answers), the card is skipped and stays due; it comes back as overdue once the question can be built again. The card goes only with its term or symbol. Terms without a definition are shown by the list "Do poprawki" (ATL-762).
6. **Points and summary as today.** The lines of the summary for definitions and symbols and the point for a right first answer stay; a settled term or symbol gives no point of its own.
7. **Up to 5 questions.** "Liczba pytań w sesji" of "Pytania ze Słowniczka" and "Pytania z atlasu symboli" offers 1–5; the other extra questions keep 1–3. A quiz answer that is right counts as "Prawie", so a new card comes back after 1–3 days and about five or six times in its first month; with 216 terms and 3 questions a session, due cards would fill the places after two or three weeks and new terms would come in one at a time. This is an estimate from the FSRS defaults, not a measurement.

Further rules, taken from the rules of the artwork cards:

- **The first answer of the day schedules.** Only the first answer of the learner's day of a card runs FSRS; a later one that day is logged as practice and leaves the card as it is. A wrong answer comes back in the same session until right, at most twice, as today.
- **The kind of symbol question** follows the card's own history: among the kinds that can be built for the symbol, the one asked least recently for it; one never asked comes first, ties follow the order symbol, meaning, attribute. The pin is drawn among the pins of the symbol that can build that kind. Practice answers are not part of the history.
- **Free rounds** pick terms and symbols by the same rules and save nothing.
- **Past answers.** No answer to a definition or symbol question was ever saved, so every card starts with its first answer after the update.

### Scenarios

| Situation                                              | What the learner sees                                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 40 terms with a definition, count 2, the first days    | Day 1: two new terms. A right one comes back in a few days, a wrong one the next day; each later day the due ones first, the free places to new terms.                     |
| Count 1, 20 term cards due after two weeks away        | One due term a session, the most overdue first; no new term until fewer than one is due, so the backlog takes about 20 days at one session a day. Raising the count helps. |
| A due term whose definition was removed                | It is skipped; the next due term or a new one takes the place. Once the definition is back, the term comes first as the most overdue.                                      |
| A symbol with one pin and one meaning without a person | Its questions alternate between "Co przedstawia ten detal?" and "Jakie znaczenie ma tu ten symbol?".                                                                       |
| Two sessions on one day                                | The cards answered in the first are no longer due, so the second asks the next due cards or new ones.                                                                      |

Not handled: a symbol without any pin is never asked, so it never gets a card; the count is a session setting, not a daily one, so several sessions a day bring more new cards.

### Data

The cards and their answers live in two new tables, `extra_cards` and `extra_review_log`, beside `review_cards` and `review_log`, which reference an artwork. A card references either a glossary term or a symbol (exactly one, with its owner) and is deleted with it; an answer references its card. `record_extra_review` writes the card and the answer in one transaction with the rule of the first answer of the day. The export and the import carry both tables. The data model is in `docs/data-model` (M13, R14, R30, W34).

### Consequences

- Good: terms and symbols come back at the pace of the learner's memory, and the answers are kept for a later look.
- Good: nothing the learner sees changes besides which terms and symbols are asked and two more counts in the settings.
- Good: the round of artworks, its counters and `record_review` are untouched.
- Bad: with many due cards and a low count, new terms and symbols wait until the backlog clears; going through 216 terms takes months even at 5.
- Bad: the counts of the extra questions are no longer the same for every kind.
- Bad: two more tables in the export, the import and the deletion of an account.
- Bad: a card of a term without a definition stays due until the definition is back.

## More information

- Linear: ATL-789 (design), ATL-790 (build). Requirement R-316; changes R-171, R-248 and R-312.
- Partly supersedes [ADR-0153](0153-add-glossary-definitions-to-the-review-as-extra-questions.md) and [ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md) in what they say about the schedule of definitions and symbols, and [ADR-0303](0303-ask-about-artworks-in-the-round-and-side-topics-on-top.md) in the count of 1–3 for these two kinds.
