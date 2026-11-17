# 0318. Ask for the dates of Kalendarium events on cards of their own

- Status: accepted; the event question without a flag (point 8) is superseded by [0321](0321-flag-the-date-of-a-kalendarium-event.md)
- Date: 2026-11-17

## Context and problem statement

The learner adds historical events and periods to Kalendarium (R-111, R-120), but the review never asks about them: questions about events were left for later in [ADR-0303](0303-ask-about-artworks-in-the-round-and-side-topics-on-top.md), and the idea of a separate review of them waited in [ATL-222](https://linear.app/kamil-nawrot/issue/ATL-222) since the timeline spike. In 0.25 glossary terms and symbols got FSRS cards of their own as extra questions ([ADR-0312](0312-schedule-glossary-terms-and-symbols-on-cards-of-their-own.md)), picked by `extra_round` in the database ([ADR-0316](0316-pick-the-glossary-and-symbol-questions-in-the-database.md)). Production holds about fifteen events beside more than 300 artworks and 200 terms.

What does the review ask about an event, how does it rate the answer, is it scheduled, and where does it stand in a session?

## Decision drivers

- The learner remembers when an event happened, and for a period when it began and when it ended, not just a year somewhere inside it.
- The review reuses what it has: the year slider of the artwork date question ([ADR-0178](0178-ask-for-the-year-and-the-chronological-order-in-the-review.md)) and the extra cards of terms and symbols.
- A few events must not come back every session while the forgotten ones wait.

## Considered options

1. The question: "which came first?" between an event and an artwork, as in ATL-222; the year slider; four dates to choose from, like the quizzes.
2. A period that lasts for centuries: any year of the period counts as a hit; two handles for the beginning and the end in one question; one question about one end of the period.
3. The schedule: drawn at random without saving; one FSRS card per event among the extra cards.
4. The place in a session: places in the round; an extra question on top of the round.
5. The tolerance: bands of their own for events; the bands of the artwork date question.

## Decision outcome

Chosen by the owner on 2026-11-17: the year slider, one end of a period per question, one card per event, an extra question with its switch and count, and the bands of the artwork date question.

1. **The question.** The card is the artwork date question without the image: the overline "Pytanie dodatkowe z Kalendarium", the name of the event as the heading, and one of three questions, worded without the grammatical gender of the name: "Kiedy miało miejsce to wydarzenie historyczne?" for an event of a single year, "Kiedy zaczęło się to wydarzenie historyczne?" and "Kiedy skończyło się to wydarzenie historyczne?" for a period. The description of the event stays hidden until the answer, because descriptions from Wikipedia often give the dates away.
2. **The slider and its bounds.** The slider spans the era of the asked year by the learner's era bounds, the later era when the year is a junction of two, with the hint "Wydarzenie miało miejsce w granicach nowożytności. Gdzie na osi czasu tej epoki powinno się ono znaleźć?". The asked end of a period has its own era, so a period that crosses the turn of two eras needs no cut.
3. **The rating.** The bands of the artwork date question: "Wiem" within 5% of the era's length, "Prawie" within 15%, "Nie wiem" further, with the same answer axis and result text ("Świetne wyczucie. To wydarzenie zaczęło się w roku 1618.", "Blisko. …", "Tym razem daleko. …", then the distance). An event marked as approximate is asked like any other. Unlike the quizzes of terms and symbols, which save "Prawie" or "Nie wiem", the answer saves all three ratings, as the date card of an artwork does.
4. **One card per event.** An event has one card among the extra cards, beside the cards of terms and symbols, scheduled by FSRS with the 365-day cap of [ADR-0311](0311-cap-every-review-interval-at-a-year.md). For a period, the end asked is the one asked least recently in the card's non-practice answers, the beginning first when neither was asked or on a tie, so a period alternates between its beginning and its end. An event of a single year (no start year, or a start year equal to the end year) is always asked for its year.
5. **An extra question.** "Pytania z Kalendarium" in "Pytania dodatkowe" of the settings has a switch, on by default, and "Liczba pytań w sesji" of 1–3, 1 by default. `extra_round` picks the events as it picks terms and symbols: due cards first, the most overdue first, then new events at random in the places left, plus the reserve for skipped questions. The menu counter, the review start and the length of the round do not count them.
6. **The rules of the extra cards.** The first answer of the learner's day schedules the card and a later one is practice; a "Nie wiem" comes back in the same session at most twice; a free round picks events by the same rules and saves nothing; a card goes with its event.
7. **Summary and points.** The summary of a round adds "Trafione daty z Kalendarium:" with the score after the lines of the glossary and symbols, where a hit is "Wiem" or "Prawie", as for the year of an artwork. A hit the first time an event is asked gives a point of the museum career, like a definition; a settled event gives no point of its own.
8. **No flag yet.** An event has no item in "Co poprawić?" ([ADR-0313](0313-collect-flagged-weak-items-and-missing-data-in-zaplecze.md)), so the event question has no "Do poprawki" in this version; a wrong date is corrected in Kalendarium.

### Scenarios

| Situation                                                     | What the learner sees                                                                                                                                             |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 15 events, count 1, the first days                            | One new event a session; after about two weeks every event has a card, and from then on the due ones come first and the rest only when nothing is due.            |
| "Wojna trzydziestoletnia" (1618–1648), asked twice            | First "Kiedy zaczęło się to wydarzenie historyczne?", the next time "Kiedy skończyło się to wydarzenie historyczne?", each on the slider of the early modern era. |
| "Cesarstwo zachodniorzymskie" (27 BCE–476), asked for its end | The slider spans the Middle Ages, the era of 476, and its bands are 5% and 15% of that era's length.                                                              |
| Guess 1625 for the beginning of the Thirty Years' War         | "Prawie" or "Wiem" by the length of the era, "To wydarzenie zaczęło się w roku 1618.", "Strzał w rok 1625 to o 7 lat za późno."                                   |
| The event is deleted in Kalendarium                           | Its card and answers go with it.                                                                                                                                  |

### Data

`extra_cards` gets a third reference, `timeline_event_id`, unique where not null and deleted with the event, and the check becomes exactly one of the glossary entry, the symbol and the event. `extra_review_log.mode` adds `event_year`, `event_start` and `event_end`. `record_extra_review` takes the event as a third target. `extra_round` reads `review_events_on` and `review_event_questions` from the profile and returns for each picked event its card and the asked end. The export and the import carry the new column. The data model is in `docs/data-model` (M14, R14, W34).

### Consequences

- Good: the learner's events come back at the pace of the learner's memory, with the beginning and the end of a period asked apart.
- Good: no new component and no new table; the slider, the answer axis and the extra cards are reused.
- Bad: a long period asked by its two ends needs about twice as many answers to settle as a single year.
- Bad: on the slider of a long era the bands are wide, so a hit within 15% of prehistory says little; the rule is the same as for artworks on purpose.
- Bad: a wrong date of an event cannot be flagged from the question.

## More information

- Linear: ATL-222 (design), ATL-801 (build). Requirement R-319; changes R-312.
- Partly supersedes [ADR-0303](0303-ask-about-artworks-in-the-round-and-side-topics-on-top.md) in leaving the questions about events for later.
