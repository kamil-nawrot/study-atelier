# 0279. Edit symbol meanings one at a time and create symbols from a pin

- Status: accepted
- Date: 2026-11-13

## Context and problem statement

The form of a symbol ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)) edited the name and every meaning at once: each meaning had a heading, move and remove buttons with borders and a context field. The owner found it unreadable and did not want to edit everything at once; he wanted to add meanings one by one and edit them one by one. A symbol could also only be created in the atlas, so noticing a new motif on an artwork meant leaving the pin. How should meanings be added and changed, and where can a symbol be created?

## Decision drivers

- Adding or changing one meaning should not show the others.
- Few controls with a border on a page that is mostly read.
- Creating a symbol should not interrupt marking a detail.
- No change to the data: `save_symbol` already takes the whole list of meanings.

## Considered options

Meanings:

- A dialog on the symbol's page for one meaning, actions in a menu on each meaning
- Links under each meaning instead of a menu
- Editing in place, or a page per meaning
- One form for everything, in rows, with one menu or two columns

New symbol from a pin:

- A last item in the list of the pin's symbol field
- A step in the pin dialog
- A trip to the symbol form

## Decision outcome

- **Meanings:** on the symbol's page "Dodaj znaczenie" and the menu "Więcej działań" of each meaning ("Edytuj znaczenie", "Przesuń wyżej", "Przesuń niżej", "Usuń znaczenie") open a dialog with one meaning (the text and the optional contexts behind "Dodaj kontekst"). Removing asks "Usunąć znaczenie?"; its pins stay with the symbol without a meaning. Each change sends the whole list through `save_symbol` and reloads the page.
- **The form of a symbol** has the name and, for a new symbol, an optional first meaning.
- **New symbol from a pin:** a name typed in the field "Symbol" of the pin dialog that no symbol has adds the item "Dodaj symbol „…”", which creates a symbol with only the name and points the pin at it; meanings are added later on the symbol's page. The pin card links to the form with "Edytuj symbol".
- The word "(opcjonalnie)" leaves the labels of the pin dialog, since the symbol field never had it.

### Consequences

- Good: the page is the single place to work on meanings; the form is short; a symbol appears without leaving the pin.
- Bad: a meaning reorder or removal is one request for the whole list; a symbol made from a pin has no meaning until the learner adds one.

## More information

- Follows [ADR-0277](0277-let-the-learner-choose-the-main-detail-of-a-symbol-and-keep-its-contexts-optional.md); issue [ATL-708](https://linear.app/kamil-nawrot/issue/ATL-708).
