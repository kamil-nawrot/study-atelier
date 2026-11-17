# 0320. Hold the symbol question of a held pin

- Status: accepted
- Date: 2026-11-17

## Context and problem statement

A held flag of a pin holds the question "Co to jest?" of its artwork, and a held flag of the image or the whole artwork holds the artwork ([ADR-0315](0315-skip-a-broken-review-question-and-hold-it-until-fixed.md)). The symbol questions of the atlas are built from the crop of a pin ([ADR-0316](0316-pick-the-glossary-and-symbol-questions-in-the-database.md)), and `extra_round` held them only by a flag of the symbol itself. A pin flagged as pointing at the wrong spot kept showing the same faulty detail in "Co przedstawia ten detal?". The 0.25 review found this gap (ATL-804).

## Decision drivers

- A held flag keeps the faulty detail out of every question built from it.

## Considered options

- Hold only by a flag of the symbol, as before.
- Also hold a symbol question whose pin is held, or whose artwork is held as a whole.

## Decision outcome

Chosen by the owner on 2026-11-17: the second option. `extra_round` leaves out a pin with a held flag of that pin, and every pin of an artwork held as a whole (a held flag with a reason other than a pin or two fitting answers). The symbol is asked from another pin when it has one.

### Consequences

- Good: a faulty crop is not shown again until its flag is gone.
- Bad: a symbol with one pin is not asked while that pin or its artwork is held.

## More information

- Linear: ATL-804. Changes R-317.
- Partly supersedes [ADR-0315](0315-skip-a-broken-review-question-and-hold-it-until-fixed.md) in what holds a symbol question.
