# 0281. Assign details to a meaning and align the symbol page with the app

- Status: accepted
- Date: 2026-11-13

## Context and problem statement

[ADR-0280](0280-polish-the-atlas-of-symbols-after-its-first-try.md) put a round "⋯" button on each lens of the symbol page to move a detail to another meaning. On develop its menu was cut off by the row of lenses, which scrolls sideways, and the owner noted that a round button on an item is a pattern found nowhere else in the app. A consistency scan of the module then found more places where the symbol page departs from the rest of the app: three heading styles for its sections, upper-case labels where overlines are small caps, a meaning menu unlike "Więcej działań", meanings reordered from a menu, and a delete that does not name what it deletes. How should details be sorted into meanings, and how should the page follow the app?

## Decision drivers

- No pattern that exists only on this page.
- Sorting details must work the same with a mouse, a keyboard and on a phone.
- Sections, overlines, menus, reordering and deletes look and behave as elsewhere ([ui-patterns](../guidelines/ui-patterns.md)).

## Considered options

For sorting details:

- "Przypisz detale" in the menu of a meaning, opening a dialog with every detail of the symbol and a checkbox each;
- dragging a detail between the meaning sections;
- a meaning select in the pin card of the artwork view;
- a "Porządkuj detale" mode with a select on every lens.

## Decision outcome

Chosen option: "Przypisz detale" in the menu of a meaning. It is built from a menu, a dialog and checkboxes, which the app already has, and works the same on every device. Dragging was set aside because it fights the sideways scroll of the row on a phone and needs its own keyboard path. The pin card would send the learner from artwork to artwork, and a mode with a select per lens is a new pattern again.

The lens keeps only the star of the main detail. Saving the dialog moves the ticked details to the meaning and the unticked ones that had it to none.

The page follows the app:

- The top reads like a glossary term: the overline "Symbol" with its icon, the name, and the description in the title font, in italics, behind a vertical line.
- Each meaning is a section with the spacing of a room and the count of its details. "Bez wskazanego znaczenia" and "Przez wieki" are folding rooms with a count, and every row of lenses starts at the same line.
- "Kontekst" and "znaczenie ogólne" are overlines in small caps, and the labels are library tags.
- The menu of a meaning is the shared action menu of "Więcej działań" (now `ActionMenu`, used by `MoreActions` too), named "Działania znaczenia „…”".
- Meanings are reordered in a "Zmień kolejność" mode from the top bar with arrows and "Gotowe", like own fields.
- Removing a meaning is a danger button, and its question names the meaning.

### Consequences

- Good: no pattern on the page is its own, and many details are sorted at once.
- Bad: moving one detail takes a dialog instead of a single menu choice.

## More information

Decided with the owner on 2026-11-13 in [ATL-720](https://linear.app/kamil-nawrot/issue/ATL-720/fix-the-symbol-page-after-atl-710-and-bring-it-in-line-with-the-app). Supersedes the "⋯" on a lens of ADR-0280; the rest of ADR-0280 stands.
