# 0324. Clear the whole Archiwum after a ticked confirmation

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

Archiwum lets the learner delete its artworks and exhibitions for good only one at a time ([ADR-0028](0028-trash-as-a-list-with-confirmed-deletes.md), which left out "Opróżnij kosz"). After using 0.25 the owner asked for one action that deletes everything in Archiwum ([ATL-809](https://linear.app/kamil-nawrot/issue/ATL-809)). Where does it stand, how much does it ask before it deletes, and how are the database rows and the uploaded image files removed?

## Decision drivers

- Nothing is lost by a slip: the action deletes many records at once and cannot be undone.
- One action for both tabs, as the owner decided when planning 0.26.
- It follows the delete patterns already in the app.
- No new database code unless needed.

## Considered options

Place:

1. A `danger` button in the top bar, on a phone an item of "Więcej działań".
2. A `danger` button in the top bar, on a phone its icon in the bar.
3. Always behind "…" in the top bar.

Confirmation:

1. A small dialog with the counts and a confirm button.
2. The same, with a checkbox "Rozumiem, że tego nie da się cofnąć" that enables the confirm button.
3. The same, with a word to type.

Deleting:

1. A database function that deletes both kinds in one transaction and returns the files to remove.
2. Two deletes through the row level security already in place, `deleted_at is not null` as the filter.

## Decision outcome

Chosen by the owner on 2026-11-19: place 1 and confirmation 2. Deleting 2 was chosen in the build.

- "Wyczyść Archiwum" with the Lucide `brush-cleaning` icon stands at the right of the top bar of Archiwum, the same on both tabs, like "Usuń" of a value page (`MoreActions`). It is shown only while Archiwum holds an artwork or an exhibition.
- The dialog "Wyczyścić Archiwum?" counts what goes ("3 dzieła razem z Twoimi obrazami i 2 wystawy znikną bezpowrotnie.", a kind with nothing in it is left out), and "Wyczyść Archiwum" works only after "Rozumiem, że tego nie da się cofnąć" is ticked. The box is unticked every time the dialog opens.
- The archived exhibitions are deleted first, then the artworks of the trash. The artworks' uploaded image files are read before the delete and removed only for the artworks the delete returned, so an artwork restored in another tab meanwhile keeps its files. A part that succeeded leaves its tab empty even when the other part fails; the error stays in the dialog with "Nie udało się wyczyścić Archiwum".

### Consequences

- Good: one action empties Archiwum, and the ticked box makes a slip unlikely without typing on a phone.
- Good: no migration; row level security already limits the deletes to the learner's own rows.
- Bad: the two deletes are not one transaction, so a failure between them leaves one tab cleared. Both are irreversible anyway and the dialog says what failed.
- Bad: a file whose removal fails stays in Storage, as with deleting one artwork.

## More information

- Linear: ATL-809. Adds R-321, changes R-36. Changes [ADR-0028](0028-trash-as-a-list-with-confirmed-deletes.md): Archiwum now has a way to delete everything at once.
- Mockups and texts: `atl-809/` in the project files.
