# 0289. Count two sightings thirty days apart for the Trevi fountain

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

"Fontanna di Trevi" (`trevi_fountain`) is unlocked by an artwork seen in person on entries of two different dates, a date counted with its precision ([ADR-0206](0206-count-an-artwork-seen-twice-on-two-days-of-visits.md), [ADR-0236](0236-count-a-visit-date-with-its-precision-for-the-trevi-fountain.md)). A trip preticks the artworks of its city and of the "Na miejscu" places in that city ([ADR-0275](0275-log-sightseeing-a-city-as-a-trip-in-the-chronicle.md), [ADR-0282](0282-give-a-place-its-city-and-group-the-places-of-kartoteka-by-country-and-city.md)). When one of those places also has its own visit inside the trip, the same artworks are stored on the trip and on the visit with different dates, so a single sightseeing unlocks the exhibit. Production showed it on 2026-11-14: a trip to Ateny and a visit to Akropol within it unlocked the exhibit (ATL-742).

## Decision drivers

- The exhibit stands for coming back to an artwork, as its hint says.
- The rule must hold whatever the order in which trips and visits are added and whether a visit is linked to its trip yet.

## Considered options

- Two sightings of the same artwork at least 30 days apart, each entry counted as a range of dates.
- Prevent the double entry when a trip or a visit is saved.
- Count a trip and its linked visits as one occasion.
- Match unlinked visits to a trip by its dates and city.

## Decision outcome

Chosen by the owner in ATL-742: two sightings of the same artwork outside the trash at least 30 days apart.

- Each entry counts as a range of dates: a visit to the day is that day, to the month the whole month, to the year the whole year, and a trip runs from its start to its end.
- The gap is measured from the end of the earlier entry to the start of the later one. An artwork seen on entries whose ranges overlap or lie less than 30 days apart has not come back yet.
- The exhibit keeps its single tier at 2: the value is 2 for an artwork with such a pair, 1 for an artwork seen in person without one, and 0 with none. It still gives 50 points once.
- This supersedes ADR-0236: "maj 2026" and "1 maja 2026" overlap and are one sighting. It also supersedes the different dates of ADR-0206.

### Consequences

- Good: a trip, its visits and a duplicate of either no longer unlock the exhibit, linked or not.
- Good: the rule needs no knowledge of how a trip and its visits relate.
- Bad: two real visits within 30 days, such as two visits to the Louvre in one week, no longer count.
- Bad: an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)), so an exhibit unlocked by mistake before the fix stays until the owner removes its tier and its easter-egg points by hand.

## More information

Rejected: preventing the double entry at save time works only when the visits exist before the trip; counting a trip and its linked visits as one occasion fails while a visit and a trip are not linked yet; matching unlinked visits by the trip's dates and city adds rules for the same result.

Built in ATL-742 in `20261114150000_trevi_fountain_thirty_days_apart.sql`.
