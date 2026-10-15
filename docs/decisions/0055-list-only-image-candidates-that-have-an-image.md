# 0055. List only image candidates that have an image

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

[ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md) decided that a candidate in the image search without a free image stays in the list, greyed out, and says "W Wikimedia nie ma wolnego zdjęcia tego dzieła". The learner opens "Znajdź zdjęcie" to find an image, so a candidate that cannot be picked offers nothing and takes the place of one that can. Should such candidates stay in the list?

## Decision drivers

- A search for an image has nothing to offer without an image.
- The portrait search for authors already lists only people with an image.
- Fewer states in the dialog.

## Considered options

1. Keep candidates without an image, greyed out (ADR-0022)
2. List only candidates that have an image

## Decision outcome

Chosen option: 2, because a candidate that cannot be picked is noise in a list made for picking.

- The Wikidata query requires an image (`P18`). Items that only have a creator or an architect are no longer returned.
- An item whose file Commons does not return is left out as well, as the dialog has no way to show it.
- The dialog has no state for a candidate without an image, and the text "W Wikimedia nie ma wolnego zdjęcia tego dzieła" is removed.
- When nothing is left, the dialog shows the existing text for an empty result, which already points to the learner's own image ([R-14](../product/requirements.md#images)).
- This supersedes the last sentence of the image search point in ADR-0022 ("A candidate without a free image says so"). The rest of ADR-0022 stands.

### Consequences

- Good: every card in the dialog can be picked.
- Good: the search and the portrait search behave the same.
- Bad: an artwork that Wikidata knows but has no image for no longer shows up, so the learner cannot tell it from an artwork Wikidata does not know. The empty text covers both.
