# 0221. Space blocks apart with a divider

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The blocks of an exhibition stand 32 px apart, one under another. The owner wants a way to add more room between them, with or without a horizontal line ([ATL-572](https://linear.app/kamil-nawrot/issue/ATL-572)). How is the room added without giving the learner a spacing option on every block?

## Decision drivers

- The editor stays hard to break, with few options ([ADR-0217](0217-show-block-tools-on-hover-over-a-quiet-edit-mode.md)).
- Every block works the same way and differs only in its toolbox.

## Considered options

- A spacing option on every block (small, medium, large).
- A divider block of one fixed height, empty or with a line.

## Decision outcome

Chosen: a divider block, "Odstęp", because it is added, moved and removed like any other block, and the learner cannot set sizes that break the rhythm of the page.

- **Storage:** a new node `divider` with no content and one optional attribute `line` (a boolean). It stands only in the document, never in a column. The database rejects any other shape.
- **Look:** 64 px high, empty or with a hairline in the line colour across its middle, the same when viewing and editing. With the gaps around it, two blocks stand 128 px apart.
- **Adding:** "Odstęp" in "Tekst" of the panel "Dodaj do wystawy".
- **Toolbox:** "Linia" turns the line on and off. A divider has no "Położenie".
- **Rows:** a divider is always full width. No column is offered beside it, and a dragged divider offers no column beside other blocks.
- **Limits:** a divider counts as a block against the limit of 300.

### Consequences

- Good: the learner can open the page up between sections with one block, and the line can mark a new chapter.
- Bad: one migration more, because the database lists the nodes a document may hold.

## More information

Issue [ATL-572](https://linear.app/kamil-nawrot/issue/ATL-572), migration `20261107160000_exhibition_dividers.sql`. Adds R-231 and updates R-207 and R-208.
