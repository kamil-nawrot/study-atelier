# 0022. Add and edit an artwork in one full form on its own page

- Status: accepted
- Date: 2026-10-11

## Context and problem statement

The learner adds an artwork from the "Dodaj dzieło" button on the wall ([ADR-0021](0021-collection-view-as-a-wall-of-framed-artworks.md)). Adding should take no more than 2-3 minutes, and over the following weeks the learner comes back to the entry to add more ([main scenario](../product/requirements.md#main-scenario)). How does adding an artwork look and behave, including the image search, category values and leaving the form?

## Decision drivers

- Adding and editing should feel the same, so the learner can fill in everything, or only the two required fields, at any stage.
- Entering the data in one's own words is part of learning ([R-6](../product/requirements.md#artworks)).
- The artwork is the central element of the view.
- The MVP stays small.

## Considered options

1. A short start with only title, author and image; everything else later in the artwork view
2. One full form with every field, used both for adding and for editing

For where the form opens: its own page, a side panel over the wall, or a dialog.

## Decision outcome

Chosen option: 2, one full form on its own page, because it keeps adding and editing consistent and a long form needs the room.

- Route: adding is the page `/atelier/new`, editing uses the same form for an existing artwork. Only the title and the authors (or "Autor nieznany") are required.
- Layout: from 768 px two columns. On the left the image window on a paper passe-partout, as on the wall, with the image actions below it; it stays in place while the fields scroll. On the right the fields in this order: title, authors, date, type, period, style, material, location, notes. On a phone one column, with the image and its buttons at full width like the other fields.
- Actions: a bar fixed to the bottom with "Anuluj", "Zapisz i dodaj kolejne" (secondary) and "Zapisz" (primary). Field errors show under the fields after "Zapisz", as in [ui-patterns.md](../guidelines/ui-patterns.md#forms).
- After "Zapisz" the wall opens at the top, where the new artwork is, and the new tile is briefly highlighted. "Zapisz i dodaj kolejne" saves and opens an empty form. "Anuluj" returns to the wall at the scroll position it had before.
- Leaving with unsaved changes ("Anuluj", back, the menu) asks "Odrzucić zmiany?" with "Wróć do formularza" and "Odrzuć". There are no drafts. Without changes the form closes without asking.
- Image search: "Znajdź zdjęcie" is enabled once the title and an author (or "Autor nieznany") are filled in. It opens a dialog (full screen on a phone) with a grid of candidates from the image source, each with an image, title, authors and date. Clicking one picks it and closes the dialog; "Żadne z tych" closes it without an image. A candidate without a free image says so.
- After a candidate is picked, the app does not fill in or compare any field: the learner writes everything by hand. Only the licence and attribution show under the image ([R-16](../product/requirements.md#images)).
- Image size: when an image is picked or added, the form stores its width and height with the artwork, so the wall knows each image's proportions before it loads and does not ask the image source for them.
- Own image: "Dodaj własne" takes a file from the device or an image URL. There is no field for where the image comes from. An own image is visible only to the learner.
- Date: one year with "p.n.e." and "ok." checkboxes, as in the data model ([ADR-0014](0014-artwork-collection-data-model.md)). Version 0.3 adds a period as an alternative ([ADR-0045](0045-enter-the-date-of-creation-as-a-period.md)); centuries are still not covered.
- Type: a single-choice dropdown.
- Category values (authors, period, style, material, location): the chosen values are tags with a remove button inside the field. While typing, a list shows values the learner already used, then the starting list (R-24), then "+ Dodaj „…”" for a new value. Location takes one value.
- Near-duplicates (R-25): a new value that differs from an existing one only in letter case or diacritics cannot be created; the list offers the existing value. A value that looks like a typo of an existing one puts "Masz już „…”" first, and creating the new value stays possible below it.
- "Autor nieznany" is a checkbox under the authors field that clears and disables it.

### Consequences

- Good: one form serves both adding and editing, so there is one place to build and test.
- Good: the learner writes every value, which keeps entering data part of learning.
- Good: the case and diacritics rule matches the database, which already treats such values as the same.
- Bad: a full form looks longer than a quick start, even though only two fields are required.
- Bad: data the image source already knows (date, location, material) is typed by hand.
- Bad: `artworks.own_image_source_url` stays unused for now.
- Bad: storing the image size needs a migration that adds two columns to `artworks`.

## More information

- Mockup: https://claude.ai/artifact/JUynL7GJmoEHJCb1XFGXGn
- R-13 (comparing title and author with the image source) moves to a later version.
- Implementation: ATL-40. The artwork view is decided in [ADR-0026](0026-artwork-view-as-a-stage-with-an-information-panel.md).
