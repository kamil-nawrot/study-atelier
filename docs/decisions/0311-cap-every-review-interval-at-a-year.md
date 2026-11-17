# 0311. Cap every review interval at a year

- Status: accepted
- Date: 2026-11-16

## Context and problem statement

[ADR-0062](0062-schedule-reviews-with-fsrs.md) runs FSRS with the library's defaults, so an artwork the learner always knows can wait up to 36500 days for its next review. A learner who builds a personal database of artworks to study should meet every card at least once a year, and the future cards of terms and symbols (0.25) must follow the same rule. Does a longest wait apply, and what happens to cards already scheduled further ahead?

## Decision drivers

- Nothing the learner has put into the atelier should go unseen for years.
- One rule for every kind of card: recognition, style, date and the later term and symbol cards.
- Existing data stays as it is.

## Considered options

- A maximum interval of 365 days from the next answer, existing cards untouched.
- A maximum interval of 365 days, and a migration that pulls every card due later than a year back.
- A longer limit, such as two years.

## Decision outcome

Chosen by the owner on 2026-11-16: a maximum interval of 365 days for every card, from the card's next answer, with no change to existing cards.

- The browser passes `maximum_interval: 365` to `ts-fsrs`, which also limits the fuzz, and `private.next_style_card` limits its intervals to 365 days.
- The stability of a card is not limited by this, so the algorithm keeps its own memory estimate.
- A card already due later than a year from now keeps its date until it is answered, and its next interval is then at most a year.

### Consequences

- Good: no card waits longer than a year, whatever its kind.
- Good: no data migration and no surprise on the review start after the update.
- Bad: a settled artwork returns once a year, a few more reviews than with the library's default.

## More information

R-315. ATL-788.
