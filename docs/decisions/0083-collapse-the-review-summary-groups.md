# 0083. Collapse the groups of the review summary and show their counts in a box

- Status: accepted
- Date: 2026-10-18

## Context and problem statement

The review summary lists the artworks of a session in three groups by their first rating: "Do poprawki", "Prawie" and "Opanowane". Since ATL-206 each group is an artwork wall with the collection's columns, so a long session fills several screens, most of them with artworks the learner already knows. The count of each group was a muted caption next to its heading and easy to miss. How should the summary keep the groups short and their sizes visible (ATL-207)?

## Decision drivers

- After a session the learner should see at a glance how many artworks went well and how many did not.
- The artworks worth another look should be on screen without a click.
- The summary should reuse what the app already has rather than a new pattern.

## Considered options

- Groups collapsed at first:
  - "Do poprawki" open, the others collapsed;
  - every group collapsed;
  - every group collapsed unless there is only one.
- The count of a group:
  - the small filled box of the number of reviews next to "Powtórki" in the menu;
  - a larger number in the text colour;
  - a library `Tag`.

## Decision outcome

Chosen options: "'Do poprawki' open, the others collapsed" and "the small filled box", by the owner.

- Each group is a native `details` under its section, with the heading and a `chevron-down` that turns when the group opens, like "Zmień zakres lub formę" on the review start.
- "Do poprawki" is open when the summary appears; "Prawie" and "Opanowane" are collapsed. Without "Do poprawki" every group is collapsed.
- The count stands in the heading in the menu's filled box (`--color-fg` on `--color-bg`, extra small and bold), so it is part of the heading's name for assistive technology.

### Consequences

- Good: the summary of a long session fits on one screen, with the counts of all three groups and the artworks to improve.
- Good: no new component; the disclosure and the box are the ones the review start and the menu already use.
- Bad: the artworks of the other groups take a click to see.

## More information

- [ADR-0061](0061-review-the-collection-in-one-mixed-session.md): the review session and its summary.
- The summary's groups are artwork walls since ATL-206.
