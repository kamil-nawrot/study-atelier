# 0321. Flag the date of a Kalendarium event

- Status: accepted
- Date: 2026-11-17

## Context and problem statement

The question about the date of a Kalendarium event had no "Do poprawki" ([ADR-0318](0318-ask-for-the-dates-of-kalendarium-events-on-cards-of-their-own.md), point 8), so a wrong date could not be flagged from the review, and the question kept coming back with it. The owner asked for the flag in 0.25 ([ATL-806](https://linear.app/kamil-nawrot/issue/ATL-806)).

## Decision drivers

- Every review question can be flagged and held, as R-317 says.
- The same flags, holds and Zaplecze as for terms and symbols.

## Considered options

- Keep the event question without a flag.
- Flag the event as an item of its own.

## Decision outcome

Chosen by the owner on 2026-11-17: the second option.

1. **The item.** "Co poprawić?" shows the event as "Wydarzenie „…”" with the reasons "Data jest błędna" and "Coś innego". A flag references the event (`learner_flags.event_id`) and goes with it.
2. **The hold.** A held flag leaves the event out of `extra_round`. A skipped event question leaves the session without a replacement, because a round has no reserve of events.
3. **Zaplecze.** The flag opens the event form, with the note above the dates for "Data jest błędna" and at the top for "Coś innego". The form takes part in "Poprawiaj po kolei" like the other forms. An event flag shows no origin tag when it comes without a question.

### Consequences

- Good: a wrong date is flagged where it shows, and its question waits until it is fixed.
- Bad: the event view and its popover have no "Do poprawki"; a flag comes only from the review.

## More information

- Linear: ATL-806. Changes R-317 and R-319.
- Partly supersedes [ADR-0318](0318-ask-for-the-dates-of-kalendarium-events-on-cards-of-their-own.md) in point 8.
