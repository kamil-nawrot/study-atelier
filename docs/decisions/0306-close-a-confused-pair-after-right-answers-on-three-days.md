# 0306. Close a confused pair after right answers on three days

- Status: accepted
- Date: 2026-11-15

## Context and problem statement

A confused pair is asked in every session and went away after 3 right answers since its last confusion ([ADR-0300](0300-ask-about-pairs-the-learner-confuses.md)). Three sessions on one day could close it, which tests short-term memory rather than whether the learner keeps the two values apart.

## Decision drivers

- A pair should close only when the difference has held over time, as artwork cards do.
- The pair should still be asked in every session while it is open.

## Considered options

- Count every right answer, as before.
- Count at most one right answer a day.

## Decision outcome

Chosen by the owner during the walkthrough of 0.24: count at most one right answer a day.

- `confused_pairs(time_zone)` counts the days with a right pair answer since the last confusion, in the learner's time zone, and drops the pair at 3 such days. A wrong answer still starts the count again.
- The browser passes its time zone, as it does for the streak.

### Consequences

- Good: a pair stays for at least three days, so the learner meets it again after a break.
- Bad: a learner who reviews once a week keeps a pair for three weeks.
