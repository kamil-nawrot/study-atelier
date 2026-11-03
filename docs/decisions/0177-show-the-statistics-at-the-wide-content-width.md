# 0177. Show the statistics at the wide content width

- Status: accepted
- Date: 2026-11-03

## Context and problem statement

[ADR-0175](0175-design-the-statistics-view.md) laid the statistics view out in one column at `--size-content-default` (720 px), like forms and lists. On a large screen this left half of the screen empty, while the atelier, the timeline and the display case use the wide width. In the table, row names of long values (places beside eras) broke into one letter per line. How wide is the view, and how do long names behave?

## Decision drivers

- The view uses the screen like the other views that show the whole collection.
- A long name never breaks the table or the bars.

## Considered options

- Keep 720 px
- `--size-content-wide` (1280 px), with long names clipped

## Decision outcome

Chosen by the owner after the first look at the built view: `--size-content-wide`.

- The view, its sections still in one column, is at most `--size-content-wide` wide, like the wall.
- In the table a row name stays on one line between 8 and 16 rem and is cut with an ellipsis; a column header wraps between 5 and 10 rem. In the bars a name stays on one line and is cut with an ellipsis. The full name shows on hover (`title`).

### Consequences

- Good: the table and the bars use the room of a large screen; long names keep the table readable.
- Bad: a cut name needs a hover to be read whole, which a phone does not offer; the wall it opens names it in full.

## More information

- Amends [ADR-0175](0175-design-the-statistics-view.md): the width of the layout; the rest stands.
