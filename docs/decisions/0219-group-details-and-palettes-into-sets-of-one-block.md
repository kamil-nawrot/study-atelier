# 0219. Group details and palettes into sets of one block

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

A column of a row holds one block ([ADR-0218](0218-place-blocks-and-show-notes-from-the-block-toolbox.md)). The owner asked how hard it would be to hold several blocks in one column ([ATL-565](https://linear.app/kamil-nawrot/issue/ATL-565)). He then noted that the image of an artwork is almost always the largest block. The blocks a learner wants to stack beside it are small: details, palettes and paragraphs. A text block already holds any number of paragraphs and lists.

## Decision drivers

- The editor stays hard to break, with few options ([ADR-0217](0217-show-block-tools-on-hover-over-a-quiet-edit-mode.md)).
- Dragging gets no new kind of drop.

## Considered options

- Columns of several blocks of any kind, each dragged on its own.
- "Dodaj kolejny" on a detail or a palette, which turns it into a set of up to five items of the same kind.

## Decision outcome

Chosen: "Dodaj kolejny", because a set is still one block. It moves, is placed and is removed like any other block, so rows and drop marks stay as they are.

- **Storage:** a new node `set` holds two to five items. They are either all `closeUp` or all palettes (`artwork` with `paletteOnly`). The set carries `align` and `valign`; its items do not. A set may stand in the document or in a column. The database rejects any other shape.
- **Adding:** a detail adds another pin of the same artwork. A palette opens "Paleta kolejnego dzieła" with the search of the panel for adding. New items go to the end, and at five the button is disabled.
- **Removing:** each item has its own remove button over its corner, shown on hover (always on a touch screen). A set left with one item becomes an ordinary block again, and that block keeps the position of the set.
- **Order:** the order inside a set cannot be changed yet.
- **Limits:** each item counts as a block against the limit of 300.

### Consequences

- Good: a column can show a few details or palettes beside a large image, with no new way of dragging.
- Bad: the order inside a set is fixed, and changing it takes removing and adding again.
- Bad: one migration more, because the database lists the nodes a document may hold.

## More information

Issue [ATL-565](https://linear.app/kamil-nawrot/issue/ATL-565), migration `20261107150000_exhibition_block_sets.sql`. Adds R-230 and updates R-208.
