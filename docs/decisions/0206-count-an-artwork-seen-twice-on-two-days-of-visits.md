# 0206. Count an artwork seen twice on two days of visits

- Status: accepted; the two different dates are superseded by [0289](0289-count-two-sightings-thirty-days-apart-for-the-trevi-fountain.md)
- Date: 2026-11-07

## Context and problem statement

The hidden exhibit "Fontanna di Trevi" (`trevi_fountain`) is unlocked by an artwork the learner has seen in person on two different visits ([ADR-0196](0196-show-an-artwork-seen-twice-as-the-trevi-fountain.md)). A visit of the chronicle has a date to the day, the month or the year (`date_precision`), nothing stops two visits on the same date, and an artwork can go to the trash. How is it counted and where does it stand in the display case?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- The rule should match what the learner sees elsewhere in the app, so that the exhibit is found where it is earned.

## Considered options

For two visits: two visits with different dates of any precision; two visit rows; two visits with full dates on different days.

For the trash: count only artworks outside the trash, like "Pinakoteka motyli"; count every artwork, like "Na żywo".

For the place: at the end of the display case, after "Pinakoteka motyli"; next to "Na żywo".

## Decision outcome

Chosen by the owner in ATL-545.

- `trevi_fountain` counts, for each artwork outside the trash, the different dates of the visits it was seen on, and takes the highest. It has one tier, at 2, and gives 50 points once as an easter egg, like the other hidden exhibits.
- The precision of a date does not matter: "maj 2026" and "2027" are two visits. Two visits on the same date, morning and afternoon or a duplicate, are one: the admirer comes back on another day, as the hint says.
- An artwork in the trash does not count; it counts again once restored. Visits before the release count, and deleting a visit later takes nothing back.
- It stands at the end of the display case, after "Pinakoteka motyli". The place only orders the case and is not stored.
- The career is refreshed on the next view change after the save, which already marks it as stale; no extra refresh is needed.

### Consequences

- Good: no new column or table; the exhibit counts the visits as they are.
- Bad: a visit of "May 2026" and another on 1 May 2026 share a date and count as one; the case is rare and errs on the side of a real return.

## More information

Built in ATL-545 together with the four other exhibits of 0.21 in one migration, `20261107090000_five_exhibits_of_0_21.sql`, since each exhibit migration replaces `private.exhibit_values` and `private.unlock_exhibits_for` as a whole.
