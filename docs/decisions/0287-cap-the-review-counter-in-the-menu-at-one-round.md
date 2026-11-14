# 0287. Cap the review counter in the menu at one round

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

The number beside "Powtórki" in the menu (R-76) counted every artwork due today plus the new artworks still allowed today. The plan on the review start ([ADR-0071](0071-put-the-plan-first-on-the-review-start.md)) counts one round: the due artworks up to the session size and the new ones in the room left. With 35 artworks due and rounds of 20 the menu said 35 and the review start "20 dzieł", so the learner saw two numbers for the same thing.

What should the menu count?

## Decision drivers

- One number for one thing across the app.
- The counter says what the next click starts.

## Considered options

- The artworks of one round, as on the review start.
- The round size with a plus when more waits ("20+").
- A dot instead of a number.

## Decision outcome

Chosen by the owner: "the artworks of one round". The menu shows the plan of the review start for the whole collection: the due artworks up to the session size, plus the new artworks that fit the daily limit and the rest of the round. It shows no number when nothing waits and stays empty under 20 artworks with an image, as before. After a round it shows the next one.

The share of the plan behind the daily career points (`plan_day`) still compares the artworks answered today with everything that waits today, since it measures the whole day and not the next round.

### Consequences

- Good: the menu and the review start always agree.
- Good: a large backlog after a break no longer shows as one daunting number.
- Bad: the menu no longer tells how many rounds are left today; the summary of a round still offers "Następna runda (n)".

## More information

- Linear: ATL-715. Analysis of 0.22: `powtorki-0-22/opis.md` in the project files, point 4 of section 16.
- Requirement R-76.
- ATL-717 later moves the whole plan of the review start into the database; until then the counter and the review start use the same rule in their own places.
