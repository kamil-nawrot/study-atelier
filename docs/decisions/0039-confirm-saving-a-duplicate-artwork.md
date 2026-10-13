# 0039. Confirm saving an artwork whose title and authors match another one

- Status: accepted
- Date: 2026-10-13

## Context and problem statement

A learner who adds artworks while reading or watching a lecture can add one they already have. Two records of the same artwork split notes and images between them. Still, the same title and authors do not always mean the same artwork: an artist can have many works called "Bez tytułu", and a painter can paint the same subject several times ("Słoneczniki"). Should the app notice such a match, and what should it do?

## Decision drivers

- Saving is never blocked: the learner decides whether it is the same artwork ([R-6](../product/requirements.md#artworks)).
- Typical slips while typing (letter case, Polish letters, extra spaces) still count as a match.
- One question, only when it is likely to be needed, and in the same form for adding and editing ([ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md)).
- A small feature: no new view, no new library component.

## Considered options

What counts as a match:

1. Exactly the same title and the same authors in the same order
2. The same title ignoring letter case, diacritics and whitespace, and the same set of authors in any order
3. The title as in 2, and at least one shared author

Where the check runs:

1. Only when adding
2. When adding and when editing

How the dialog shows the matching artwork:

1. Only its record number, in the description
2. A row with the thumbnail, title, authors, year and record number
3. The row, plus a link that opens the artwork in a new tab

## Decision outcome

Chosen options: the same title ignoring small differences with the same set of authors, adding and editing, and only the record number. The owner chose them in the project thread "ATL-87 Wykrywanie duplikatów" on 2026-10-13, with the mockups in the project files (`atl-87/`).

What counts as a match:

- Two titles match when they are equal after the normalisation used for category values (`valueKey`): lower case, without diacritics (also "ł"), trimmed, with runs of whitespace as one space. "Słoneczniki", "słoneczniki " and "Sloneczniki" match.
- Two artworks have the same authors when the sets of their author names, normalised the same way, are equal; the order does not matter. "Vincent van Gogh" alone does not match "Vincent van Gogh" with "Paul Gauguin".
- Two artworks marked "Autor nieznany" have the same authors.
- Only artworks outside the trash count, as the trash is hidden from the collection and from suggestions ([R-23](../product/requirements.md#artworks)).

When the app asks:

- After the form passes validation and before it saves, both with "Zapisz" and with "Zapisz i dodaj kolejne".
- When editing, the artwork being edited never matches itself, and the app asks only when the title or the authors differ from what was saved. Saving other changes to an artwork that already matched never asks.
- One question per save: after "Zapisz mimo to" the artwork is saved without a second check.

The dialog:

- The library small `Dialog`, like "Odrzucić zmiany?" ([ui-patterns.md](../guidelines/ui-patterns.md#dialogs)).
- Title "Masz już takie dzieło", a statement rather than the usual question, because the owner found the question form unnatural here; the buttons carry the choice.
- Description "W atelier jest już #0005 o tym samym tytule i autorach. Jeśli to inne dzieło, po prostu je zapisz.". With several matches the numbers are listed in record order: "#0005 i #0017", "#0005, #0017 i #0021".
- Buttons "Wróć do formularza" (the safe choice, first) and "Zapisz mimo to" (`primary`). Escape answers "Wróć do formularza", which closes the dialog and leaves the form as it was.

### Consequences

- Good: the slips that create most duplicates are caught, while a different set of authors, which usually means a different artwork, saves without a question.
- Good: the dialog reuses an existing pattern and needs no new component.
- Good: adding and editing behave the same, and an unchanged artwork never asks.
- Bad: the learner compares by record number only; to see the other artwork they go back and open it from the wall.
- Bad: the check needs the titles and authors of every artwork outside the trash before saving, one more read of the collection per save.
- Bad: a duplicate kept in the trash is not reported, so restoring it can bring back a second record.

## More information

- Requirement: [R-43](../product/requirements.md#artworks).
- Near-duplicate category values, which this decision does not change: [R-25](../product/requirements.md#category-values).
- Implementation: ATL-88.
