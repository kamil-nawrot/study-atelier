# 0176. Ask before saving a year outside its era

- Status: accepted
- Date: 2026-11-03

## Context and problem statement

The era and the year of creation are independent fields of the artwork form, so an artwork can be saved as "średniowiecze" with the year 1650. Should the form check them against each other, and how hard?

## Decision drivers

- A slip is caught before it reaches the wall, the timeline and the statistics.
- Nothing is blocked: the learner may know better, as with a duplicate title ([ADR-0039](0039-confirm-saving-a-duplicate-artwork.md)).
- The rule is plain enough to predict.

## Considered options

- No check
- A field error that blocks saving
- A question on save, like the duplicate dialog

## Decision outcome

Chosen by the owner, in ATL-442: a question on save.

- On saving the artwork form (new and edit), with an era and a year, a small `Dialog` "Rok nie pasuje do epoki" asks when the year has no year in common with the era: "Rok powstania 1650 nie mieści się w epoce „średniowiecze” (476–1492). Jeśli tak ma być, po prostu zapisz dzieło." ("Lata powstania 1650–1700 nie mieszczą się…" for a range), with "Wróć do formularza" and "Zapisz mimo to".
- An era spans the years of its text, closed at both ends, so a boundary year (476, 1492, 1789, 1945) belongs to both eras; prehistory has no lower bound and the contemporary era no upper bound. A range that shares a year with the era passes; "ok." gives no tolerance.
- With a year outside the era and a duplicate title, the era is asked first; "Zapisz mimo to" leads on to the duplicate question, "Wróć do formularza" ends there.
- Restoring from Archiwum and importing do not ask.

### Consequences

- Good: a mistyped year or a wrong era tile is caught at once, without blocking a deliberate choice.
- Bad: a learner who dates by a different convention is asked each time the artwork is saved.

## More information

- Issue ATL-442; the rules and texts are in its description.
