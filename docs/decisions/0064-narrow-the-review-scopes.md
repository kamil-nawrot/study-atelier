# 0064. Narrow the review scopes to the collection, eras, periods and styles

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

The start of a review ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md)) let the learner choose the whole collection, favourites, a period, a style or the wall's filters. With a larger card index the row grew long, and the wall's filters depended on what the wall showed last in the tab, which a session built on the server cannot know. Which scopes should the start offer?

## Decision drivers

- Every offered scope can start a session (at least 20 artworks with an image, R-83).
- The row stays short when the card index grows.
- The scope is something the database can resolve on its own.

## Considered options

- Keep all five kinds of scope and hide those under 20 artworks.
- Offer the whole collection, every era, and the periods and styles with at least 20 artworks with an image.

## Decision outcome

Chosen option: the second one, as the owner decided. "Cała kolekcja" is always offered. Every era of the collection is offered even with fewer than 20 artworks, and choosing one that has too few says how many are missing. A period or a style is offered only when at least 20 live artworks with an image have it. Favourites and the wall's filters are no longer scopes.

### Consequences

- Good: the row is short, and every scope is a value the database can filter by.
- Bad: reviewing only favourites or an ad hoc filter is no longer possible.

## More information

Narrows the scope choice of [ADR-0061](0061-review-the-collection-in-one-mixed-session.md); requirement R-77.
