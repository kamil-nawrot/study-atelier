# 0045. Enter the date of creation as a period, as an alternative to a single year

- Status: proposed
- Date: 2026-10-14

## Context and problem statement

An artwork has one `year` (a signed integer, negative before the common era, no year 0) with an "approximate" flag ([ADR-0014](0014-artwork-collection-data-model.md), [ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md)). Ranges were left out of the MVP. Many artworks are dated by a period ("1503–1519", "ok. 100 p.n.e. – 100 n.e."), and a single year cannot record that. How does the learner enter, store and read such a date without breaking the existing records, the wall order and the year filter ([ADR-0042](0042-filter-the-collection-in-the-browser.md))?

## Decision drivers

- Existing records stay valid without a data migration.
- A period can cross the turn of the eras.
- The single year stays the quick default; a period is an alternative, not a replacement.
- The wall order, the period rail and the year filter keep working.

## Considered options

Storage:

1. A new nullable `year_from` next to the existing column, which becomes the end of the period (renamed `year_to`)
2. Two new columns, `year_from` and `year_to`, with the old `year` kept for single years
3. A text field parsed on save

Era of the years: one shared "p.n.e." checkbox, or one per end.

Form: a checkbox under the inputs, a switch above them, or two tiles "Rok" and "Okres" (`ChoiceTiles`, no new component).

## Decision outcome

Chosen: option 1, a "p.n.e." checkbox per end, and a switch above the inputs.

- **Storage.** `year` is renamed to `year_to`: the end of the period, or the single year when `year_from` is empty. `year_from` is a new nullable integer. Checks: `year_from` requires `year_to`, `year_from <= year_to`, and `year_approximate` still requires `year_to`. One migration renames the column, adds the new one and recreates `save_artwork`; existing records keep `year_from` empty, so they stay valid single years. Years stay signed integers, so ordering and the checks need no special case.
- **Form.** The "ok." checkbox and a switch "Okres" stand on the right of the label row, above the inputs, because both apply to the whole date in either mode: the switch sets the mode and "ok." marks the date as approximate. Only "p.n.e.", which belongs to one value, stays under its input. The label reads "Rok powstania" and, in period mode, "Okres powstania". The switch is a new library component, `Switch`: a native checkbox with `role="switch"`, square like the other controls, with stories for each state. In period mode two inputs stand side by side, also on a phone, each with its own "p.n.e."; they have no visible labels, the placeholders "Od" and "Do" show while an input is empty, and the group title "Okres powstania" and the accessible names "Od" and "Do" (as `SearchField` does) name them for assistive technology. Turning the checkbox off keeps what was typed in "Od" in the form but saves only the single year.
- **Validation.** Both ends are converted to signed years first. "Od" later than "Do" shows "Koniec okresu nie może być wcześniejszy niż początek." under the fields. "Od" equal to "Do" is saved as a single year.
- **Display.** Compact when both ends are on the same side of the turn of the eras (`1503–1519`, `450–420 p.n.e.`, `ok. 1503–1519`), with "n.e." when the period crosses it (`50 p.n.e. – 20 n.e.`). It is used in the wall tile caption and in the line under the title in the artwork view.
- **Wall order.** By `year_to`, which keeps the order of existing records unchanged.
- **Period rail and strip.** Bounds come from the full extent: the lowest `year_from ?? year_to` and the highest `year_to`.
- **Year filter.** A period matches when it overlaps the filtered range; "no year" checks `year_to`.

### Consequences

- Good: no data migration beyond the rename, and the single year stays the default path.
- Good: a period can cross the turn of the eras, in the form and in the filter, which already has a "p.n.e." per end.
- Good: the sort order and the existing queries keep their meaning, because `year_to` is the old `year`.
- Bad: the column rename touches the RPC, the read paths, the types, the tests and the docs, and the migration and the app deploy are not atomic, so a short window exists where the previous app version still reads `year`.
- Bad: one "ok." for the whole period cannot say that only one end is uncertain.
- Bad: ordering by the end places a long period late; a period starting early and ending late sits among works dated at its end.

## More information

- Issue: ATL-123, milestone 0.3.
- Updates [ADR-0014](0014-artwork-collection-data-model.md) (the date columns) and [ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md) (the date field), and R-53 in `docs/product/requirements.md` (the filter treats a period as an overlap).
- Mockups of the form states, the wall tile and the artwork view were rendered on the app with `pnpm screenshot --script` in the design session.
