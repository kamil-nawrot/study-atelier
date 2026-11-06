# 0207. Count three places in one day from visits with a full date

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The hidden exhibit "Siedmiomilowe buty" (`seven_league_boots`) is unlocked by three different places of the chronicle visited on the same day ([ADR-0197](0197-show-three-places-in-one-day-as-the-seven-league-boots.md)). A visit's date can be only a month or a year, a place can be visited twice on one day, and places have a type (museum, gallery, private collection, on site) or none. How is it counted and where does it stand?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- The rule should match what the learner sees elsewhere in the app, so that the exhibit is found where it is earned.

## Considered options

For the dates: only visits with a full date; also visits of a month or a year that share a date.

For the places: different places of any type; only museums, after the award "Za trzy muzea odwiedzone jednego dnia."

For the place in the case: at the end, after "Fontanna di Trevi"; next to "Kronika".

## Decision outcome

Chosen by the owner in ATL-546.

- `seven_league_boots` counts, for each day, the different places of the visits with a full date (`date_precision = 'day'`) on that day, and takes the highest. It has one tier, at 3, and gives 50 points once as an easter egg.
- A visit of a month or a year does not say it was the same day, so it does not count. A place visited twice on one day is one place.
- Every place counts, whatever its type: three churches of Rome on one day are the same effort. "muzea" in the award stays a knowing simplification ([ADR-0197](0197-show-three-places-in-one-day-as-the-seven-league-boots.md)).
- Visits before the release count, and deleting a visit later takes nothing back.
- It stands at the end of the display case, after "Fontanna di Trevi". The place only orders the case and is not stored.
- The career is refreshed on the next view change after the save, which already marks it as stale; no extra refresh is needed.

### Consequences

- Good: the count needs no new data and does not depend on the optional place type.
- Bad: the award says museums while galleries and places on site count too.

## More information

Built in ATL-546 together with the four other exhibits of 0.21 in one migration, `20261107090000_five_exhibits_of_0_21.sql`, since each exhibit migration replaces `private.exhibit_values` and `private.unlock_exhibits_for` as a whole.
