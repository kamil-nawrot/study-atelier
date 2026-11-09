# 0236. Count a visit date with its precision for the Trevi fountain

- Status: accepted
- Date: 2026-11-09

## Context and problem statement

"Fontanna di Trevi" (`trevi_fountain`) is unlocked by an artwork seen in person on two visits with different dates; the precision of a date does not matter, and two visits on the same date are one ([ADR-0206](0206-count-an-artwork-seen-twice-on-two-days-of-visits.md)). A visit to the month or the year is stored on the first day of its month or year, so "maj 2026" and "1 maja 2026", or "2026" and "styczeń 2026", have the same `visited_on` and counted as one visit. The code review of 0.21 found it (ATL-588).

## Considered options

- Two different dates are a date together with its precision.
- Keep `visited_on` alone; the case is rare.

## Decision outcome

Chosen by the owner in ATL-588: a date counts together with its precision, so "maj 2026" and "1 maja 2026" are two visits. Two visits with the same date and the same precision are still one.

### Consequences

- Good: the rule reads as ADR-0206 says, that the precision does not matter, for every pair of dates.
- Bad: a learner who records one visit twice, once to the month and once to the day, finds the exhibit with a single visit.

## More information

Built in ATL-588 in `20261109110000_fix_the_review_of_0_21.sql`.
