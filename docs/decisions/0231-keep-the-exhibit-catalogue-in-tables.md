# 0231. Keep the exhibit catalogue in tables

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

[ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md) groups the exhibits into seven rooms and keeps the rooms and the order in a catalogue in the database. Until now the catalogue was spread over four places: the inline list of `private.exhibit_values` (code, `place`, value, thresholds), the list of hidden exhibits in `private.unlock_exhibits_for` that gives the bonus, a second list of hidden exhibits in the app, and `exhibit_tiers.exhibit` as plain text with no foreign key. How is the catalogue modelled, how does the display case read it, and what happens to tiers of an exhibit missing from it?

## Decision drivers

- The display case makes one call on every visit; the career runs on every start ([access patterns](../data-model/access-patterns.yaml) R15, W14).
- One source for what an exhibit is: its room, its place, its thresholds and whether it is hidden.
- An export of the atelier keeps importing after the catalogue changes.

## Considered options

For reading the rooms: `unlock_exhibits` returns the room and hidden with each exhibit, in order; the app reads the catalogue tables in a separate request.

For a tier of an exhibit missing from the catalogue in an import: skip it; refuse the whole import.

For a catalogue row with no computed value: a SQL test in CI; a value of 0.

## Decision outcome

Chosen by the owner in ATL-583, as change M6 of the [data model](../data-model/coverage.yaml).

- `exhibit_rooms` (code, position) and `exhibits` (code, room, position in the room, thresholds, hidden) are shared by all accounts, read by authenticated and written only by migrations, like `eras`. Names and texts stay in `pl.ts` by code. The rooms are `main_hall`, `era_enfilade`, `reading_room`, `scriptorium`, `map_room`, `pavilion` and `crypt`; the main hall leaves position 3 to the exhibit of ATL-580.
- `exhibit_tiers.exhibit` references `exhibits.code` with no cascade: removing an exhibit deletes its tiers first.
- `private.exhibit_values` only computes (code, value); `place` and the two lists of hidden exhibits are gone. `unlock_exhibits` returns `(exhibit, room, hidden, value, thresholds)` ordered by the room and the position, so the display case still makes one call, and the bonus of a hidden exhibit follows `exhibits.hidden`.
- `import_atelier` skips the tiers of an exhibit that is not in the catalogue and imports the rest.
- A SQL test requires the codes of the catalogue and of `private.exhibit_values` to be the same set, and the thresholds to rise.
- A new exhibit adds its catalogue row and its value in one migration.

### Consequences

- Good: the room, the order and hidden have one source, and a tier can no longer name an unknown exhibit.
- Good: a new exhibit changes one row and one value instead of copying a list of thirty.
- Bad: `private.exhibit_values` still lists every value and is replaced whole by each new exhibit.
- Bad: during a deploy the previous app shows the exhibits in the order of the rooms, still in one grid.

## More information

Built in ATL-583 in `20261108130000_exhibit_catalogue.sql`; the rooms are shown in ATL-582.
