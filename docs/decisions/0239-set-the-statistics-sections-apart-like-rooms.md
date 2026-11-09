# 0239. Set the statistics sections apart like rooms

- Status: accepted
- Date: 2026-11-09

## Context and problem statement

The sections of "Statystyki" are each an `h2` over a hairline in `--color-tag` with `--spacing-12` between them ([ADR-0175](0175-design-the-statistics-view.md)). With a small heading over long bars and tables they run into one another. Exhibitions arrived in 0.21, and "Stan zbiorów" does not count them. How are the sections set apart, and how are exhibitions counted?

## Considered options

For the sections, rendered on the same view (`tmp/screenshots/stats-variants.png`): A, each section a card on `--color-surface` in a hairline frame; B, like the rooms of "Ekspozycja" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)), the title larger in the title font and a hairline above the section; C, a heavier rule in `--color-fg` above the section with a larger title.

## Decision outcome

Chosen by the owner in ATL-594, who liked A as well but chose B for consistency with "Ekspozycja" and "Wystawy":

- Each section opens with a hairline in `--color-line` above it and its `h2` in the title font, in italics, at `--font-size-2xl`, like a room name; the hairline under the heading goes. The sections stand `--spacing-16` apart.
- "Stan zbiorów" counts the exhibitions outside Archiwum after the visits, as "wystawa / wystawy / wystaw", so its grid holds two full rows of four.

### Consequences

- Good: the sections read as rooms of one view, and the statistics look like the rest of the museum.
- Bad: the page grows longer by the larger titles and gaps.

## More information

Built in ATL-594; `collection_statistics` gains `exhibitions` in `20261109120000_exhibitions_in_collection_statistics.sql`.
