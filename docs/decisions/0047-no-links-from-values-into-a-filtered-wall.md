# 0047. Leave values in the artwork view and the card index without links into a filtered wall

- Status: accepted
- Date: 2026-10-14

## Context and problem statement

[ADR-0042](0042-filter-the-collection-in-the-browser.md) made the values in the artwork view (era, period, styles, materials, location, authors) links to the wall filtered by that value, and gave every value in the card index ([ADR-0040](0040-manage-category-values-in-a-card-index.md)) a "Pokaż dzieła (n)" action that does the same (R-60). Before building it in ATL-118, the owner asked whether these entries are worth having.

## Decision drivers

- A value in the card index is the natural place for a later page of its own: an author, an era or a style with its description and its artworks.
- The artwork view is for looking at one artwork; a click on a value should not take the learner out of it by accident.
- The "Filtry" panel ([ADR-0042](0042-filter-the-collection-in-the-browser.md)) already filters the wall by any of these values.
- A link built now and changed later teaches the learner one behaviour and then another.

## Considered options

1. Links from the artwork view and the card index into a filtered wall, as in ADR-0042
2. No links for now; values in both places stay plain text, and the card index is kept for later detail pages of its values

## Decision outcome

Chosen option: 2, decided by the owner in ATL-118.

- The values in the artwork view and in the card index stay as they are today, without links into the wall.
- The wall is filtered from the "Filtry" panel only.
- When the values get detail pages, the way from a value to its artworks is decided with them, for example a value leading to its page and the page offering its artworks on the wall.

### Consequences

- Good: ATL-118 is smaller, and the card index keeps its values free for detail pages.
- Good: the artwork view keeps the learner on the artwork.
- Bad: to see the other artworks of an author or a style, the learner opens the wall and chooses the value in the panel, a few clicks instead of one.

## More information

- Supersedes the links from the artwork view and the card index in ADR-0042 and drops R-60; the rest of ADR-0042 stands.
- Owner's decision in ATL-118 (2026-10-14).
- The detail pages came with [ADR-0049](0049-give-every-category-value-a-page-of-its-own.md): a value in the card index leads to its page, which shows its artworks. Values in the artwork view stay without links.
