# 0225. Add headings to the text of an exhibition

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

A text block of an exhibition offers bold, italic and two kinds of list. The owner wants headings inside it, as in the notes editor ([ATL-576](https://linear.app/kamil-nawrot/issue/ATL-576)). A separate "Nagłówek" block already exists. How does a text get its own headings without a second way of building the page?

## Decision drivers

- The editor stays hard to break, with few options ([ADR-0217](0217-show-block-tools-on-hover-over-a-quiet-edit-mode.md)).
- The text of an exhibition is written the same way as a note.

## Considered options

- Levels of heading to choose from (H2, H3, H4) in the toolbox of a text.
- One "Nagłówek" toggle, as in the notes editor, for a heading of one level.

## Decision outcome

Chosen: one toggle, because it is what the notes editor does, and one level cannot collide with the "Nagłówek" block.

- **Toolbox:** "Nagłówek" sits after "Kursywa" and turns the line under the cursor into a heading of the text and back.
- **Storage:** a `heading` of level 3 inside `textBlock`. The database takes level 3 only inside a text and level 2 only outside it, and a heading inside a text does not count as a block against the limit of 300.
- **Look:** like a heading in a note: body size, medium weight. The "Nagłówek" block keeps level 2 in the title typeface, so a section title and a heading inside a text stay apart.

### Consequences

- Good: a longer text can be divided without breaking it into several blocks.
- Bad: one migration more, because the database lists the nodes a text may hold.

## More information

Issue [ATL-576](https://linear.app/kamil-nawrot/issue/ATL-576), migration `20261108110000_exhibition_text_headings.sql`. Updates R-208.
