# 0224. Let a divider stand beside other blocks

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

A divider ("Odstęp") stands alone in its row ([ADR-0221](0221-space-blocks-apart-with-a-divider.md)). The owner wants to keep an empty place beside a block, for example an artwork on the left half of the page and nothing on the right ([ATL-575](https://linear.app/kamil-nawrot/issue/ATL-575)). An empty paragraph does not do it, because the editor drops blank texts when it opens again. How is an empty place in a row kept?

## Decision drivers

- The editor stays hard to break, with few options ([ADR-0217](0217-show-block-tools-on-hover-over-a-quiet-edit-mode.md)).
- No new kind of block when an existing one can do the job.

## Considered options

- Keep blank texts in rows and show them as empty columns.
- Let a divider stand in a column, where it shows a vertical line or nothing.

## Decision outcome

Chosen: a divider in a column, because a blank text is something the learner has not filled in yet, while a divider says on purpose that the place stays empty.

- **Storage:** `divider` may stand in a `column` as well as in the document. The database takes it there.
- **Rows:** a divider is dragged beside other blocks and other blocks beside it like any other block. It takes an equal share of the row.
- **Look:** in a column, "Linia" draws a hairline from the top to the bottom of the row, in the middle of the column, and the toolbox shows the vertical separator icon. Without the line the column is empty. When the columns stack on a phone, the line lies flat as in a divider of its own row.
- **Unchanged:** a divider on its own row stays 64 px high with a horizontal line, and it still has no "Położenie".

This changes the storage and rows of ADR-0221.

### Consequences

- Good: the learner can leave a column empty or split two blocks with a line, using a block they already know.
- Bad: one migration more, and a row of dividers only is possible, though it looks the same as one divider.

## More information

Issue [ATL-575](https://linear.app/kamil-nawrot/issue/ATL-575), migration `20261108100000_exhibition_dividers_in_columns.sql`. Updates R-231.
