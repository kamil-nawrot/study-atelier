# 0056. Give an author a portrait from a people search, two years of life and a sort name

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

[ADR-0049](0049-give-every-category-value-a-page-of-its-own.md) and [ADR-0050](0050-store-value-pages-in-details-tables.md) give an author a portrait (found in Wikimedia Commons or the learner's own), a year of birth and a year of death, and an optional sort name. Building it (ATL-142) needs answers they leave open: how the image search finds people, how the years and the sort name look in the form and on the page, the texts, and how much of the artwork image code is shared.

## Decision drivers

- The portrait search is the artwork image search with another query ([ADR-0050](0050-store-value-pages-in-details-tables.md)), and the code is shared, not copied (code conventions, "Reuse").
- A search for an image offers only results that have one.
- The years of life use the controls of the date of creation ([ADR-0046](0046-enter-the-date-of-creation-as-a-year-span.md)).

## Decision outcome

Chosen, decided by the owner in ATL-142.

### Search

- The image search takes a query of one of two kinds: an artwork (title and authors, as before) or a person (a name). The dialog, the Commons step and the picked image are the same; the title, the description, the empty text and the caption follow the kind.
- A person query asks Wikidata for humans (`wdt:P31 wd:Q5`, without a subclass path) found by the name that have an image (`P18`), with their dates of birth (`P569`) and death (`P570`). Only people whose file Commons returns are shown, at most eight, each with the name and the years of life, so namesakes can be told apart.
- Texts: "Który to autor?", "Wyniki z Wikidata dla „{nazwa}”. Kliknij portret, który chcesz dodać.", "Wikidata nie zna portretu osoby o takiej nazwie. Sprawdź pisownię albo dodaj własny portret.", "Żaden z tych".
- The artwork search lists only candidates with an image as well ([ADR-0055](0055-list-only-image-candidates-that-have-an-image.md)).

### Form

- The image field of the artwork form becomes one `ImageField` with its texts and search query passed in, used by the artwork form and the author form. The author's texts: "Portret", "Znajdź portret", "Wybierz inny", "Wpisz nazwę, żeby znaleźć portret.", "Własny portret", "Zmień własny", "Dodaj własny portret", "Zmień własny portret", "Usuń portret". The portrait is uploaded when the form is saved and a replaced upload is removed afterwards, as for an artwork ([ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md)).
- The author form has the two columns of the artwork form; on a phone the portrait comes first at full width.
- "Lata życia" is a group with "ok." on the right of its title and two inputs side by side, "Rok urodzenia" and "Rok śmierci", each with its own "p.n.e." under it. Either may be empty; a year of death before the year of birth shows "Rok śmierci nie może być wcześniejszy niż rok urodzenia." under the year of death. "ok." without a year is not saved.
- The sort name is a checkbox "Sortuj inaczej niż po nazwie"; ticked, it shows the field "Sortuj jako" with the placeholder "np. Vinci, Leonardo da" and the hint "Po tej wartości będą sortowani autorzy.". Unticked or empty, no sort name is saved.

### Page

- From 768 px the page has two columns: the portrait in a passe-partout, 320 px wide, with its credit under it, and beside it the kind, the name, the years of life, the summary and the notes. The portrait keeps its width and proportions and is not stretched, so its size does not depend on how much text stands beside it; the row is as tall as the taller column. On a phone the portrait comes first at full width. An author without a portrait has one column and no empty window.
- The years of life read "1452–1519", "ok. 480–430 p.n.e.", "ur. 1760" or "zm. 1519".

### Shared code

- The mapping between an image and its columns (`source_*`, `own_image_*`, `image_width`, `image_height`), the upload on save and the signed preview move from the artwork record to `#lib/collection/image-record.ts`, used by artworks and authors.
- The year input with its "p.n.e." and the titled group with options on the right become `YearInput` and `YearGroup`, used by the date of creation and the years of life.

### Consequences

- Good: one image field, one search dialog and one image mapping for artworks and portraits.
- Good: the people search never offers a result that cannot be picked.
- Bad: an author's own portrait shares the 1 GB of storage with artwork images ([ADR-0050](0050-store-value-pages-in-details-tables.md)).
- Bad: a person known by another name in Wikidata is found only by that name.

## More information

- Issue ATL-142; sorting by the sort name is ATL-127.
- Builds on [ADR-0049](0049-give-every-category-value-a-page-of-its-own.md), [ADR-0050](0050-store-value-pages-in-details-tables.md) and [ADR-0007](0007-images-from-open-sources.md).
