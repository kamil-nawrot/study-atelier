# 0072. Give the museum its own icon

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

The era "starożytność" and the type of place "Muzeum" both used the Lucide colonnade (`landmark`), set by [ADR-0038](0038-chain-era-period-and-style.md) and [ADR-0057](0057-location-country-and-type-of-place.md). [ADR-0066](0066-icons-for-artwork-types-shown-like-eras.md) made it a rule that an icon means one thing in the whole app. Which of the two should change, and to what?

## Decision drivers

- No icon is shared by an era, a type of place, an artwork type and an action.
- The colonnade of a Greek temple stands for antiquity better than for a museum.
- The new icon must not look like the other types of place (`frame`, `house`, `map-pin`).

## Considered options

- `ticket` for the museum: the entry ticket of a visit
- `building-2` for the museum: a plain building
- `library-big` for the museum: a shelf of volumes, closer to a library

## Decision outcome

Chosen option: "`ticket` for the museum", because it says "a place you visit" and is unlike any other icon in the app. The era keeps the colonnade.

### Consequences

- Good: every era and type of place has its own icon, and a test checks that eras and types of place share none.
- Bad: a ticket is about the visit rather than the building, so it reads as a museum only next to its name.

## More information

- [ADR-0057](0057-location-country-and-type-of-place.md) chose the colonnade for "Muzeum"; this decision replaces only that icon.
