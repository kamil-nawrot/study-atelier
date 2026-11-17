# 0303. Ask about artworks in the round and about side topics on top of it

- Status: accepted; what the menu counter and the review start count is superseded by [0305](0305-count-the-whole-round-in-the-menu-and-on-the-review-start.md), the count of glossary and symbol questions by [0312](0312-schedule-glossary-terms-and-symbols-on-cards-of-their-own.md), leaving the questions about events for later by [0318](0318-ask-for-the-dates-of-kalendarium-events-on-cards-of-their-own.md)
- Date: 2026-11-15

## Context and problem statement

After 0.24 a round mixed two rules the learner could not see. Recognition and, since [ADR-0291](0291-give-the-style-of-an-artwork-its-own-review-card.md), the style shared the N places of a round, while the year and the order ([ADR-0178](0178-ask-for-the-year-and-the-chronological-order-in-the-review.md)) came on top of it with the definitions, symbols, note gaps, confused pairs and relations. The settings showed the style among the matching quizzes, the year and the order as one switch among the extra questions, and each extra question with its own control: a switch with a count, a count with 0, a bare switch, or nothing at all for pairs and relations ([ATL-768](https://linear.app/kamil-nawrot/issue/ATL-768)).

## Decision drivers

- One split the learner sees the same way in the session and in the settings.
- A round of N keeps N questions about artworks; the extra questions are the only ones that make it longer.
- The same control for every kind of extra question.

## Considered options

- Where the year and the order go: on top of the round as before, or in its places like the style.
- How the extra questions are set: as today, or each with a switch and a count of 1–3.

## Decision outcome

Chosen by the owner during the walkthrough of 0.24: the questions about artworks fill the round, and every extra question has a switch and a count.

1. **The round.** `review_round` plans N places: the style takes up to one in five (unchanged), the year up to one in ten, the order one place, and recognition the rest, also the places the others leave empty. Year questions take the due date cards first and then new ones, of artworks recognised whose recognition is not due today, so that the same artwork is not asked twice in a round and new date cards can still start. The order needs four dated artworks 30 years apart; a draw at random falls back to the earliest-ending artworks, so the place is kept whenever an order can be built. The menu counter and the review start count the recognition places, as before ([ADR-0302](0302-keep-the-whole-review-plan-in-the-database.md)).
2. **Two switches for time.** `review_time_questions` becomes `review_year_questions` and `review_order_questions`, both taken from the old value. `review_session` reads them from the profile and loses its `time_questions` argument.
3. **Extra questions.** Glossary, symbols, notes, confused pairs and relations each have a switch (`review_*_on`) and a count of 1–3 (`review_*_questions`). The old symbol count 0 becomes the switch off, the note switch keeps its value with a count of 1, and pairs and relations start on with 1 question instead of a count from the size of the round.
4. **Settings.** "Quizy", with "Wliczają się do podstawowej puli powtórki.", lists the matching kinds, which keep the first word "Dopasowywanie", and the others with a word of their own: "Określanie stylu dzieła", "Wpisywanie tytułu dzieła z pamięci", "Szacowanie daty powstania dzieła" and "Ustawianie dzieł w kolejności chronologicznej". "Zostaw zaznaczony przynajmniej jeden rodzaj dopasowywania." counts only the matching kinds. "Pytania dodatkowe", with "Nie wliczają się do podstawowej puli powtórki, zwiększają liczbę pytań w sesji.", shows each kind as a switch named after the overline of its question ("Pytania ze Słowniczka", "Pytania z atlasu symboli", "Pytania z notatek", "Pytania z mylonych par", "Pytania z powiązań") with "Liczba pytań w sesji" in a lighter label under it.
5. **Summary.** The lines of the questions about artworks (style, year, order) come before the lines of the extra questions.

### Consequences

- Good: the settings say which questions make a session longer, and a session of 30 is 30 questions about artworks plus the extras the learner chose.
- Good: one control for every kind of extra question.
- Bad: with the year and the order on, a round of 20 has up to three places fewer for recognition, so a backlog clears a little slower.
- Bad: the settings of pairs and relations no longer follow the size of the round.

## More information

- Requirement R-312. Questions about the events of Kalendarium are left for later.
