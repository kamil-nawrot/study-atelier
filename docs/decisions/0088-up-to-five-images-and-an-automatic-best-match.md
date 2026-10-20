# 0088. Up to five images per artwork, and the best match from Wikidata filled in automatically

- Status: accepted
- Date: 2026-10-20

## Context and problem statement

An artwork has one image ([ADR-0014](0014-artwork-collection-data-model.md), R-10). For buildings the learner wants several views: the facade, a plan, the interior, details (ATL-20). Separately, the add form could look the image up in Wikidata on its own once the title and the author are filled in, instead of the learner opening the search dialog (ATL-136). Both change the image field of the form and what the artwork's main image is, so they were designed together (ATL-215).

The owner's collection has 112 artworks, all with an image: 79 from a link, 25 from Wikidata and 8 uploaded; architecture is 29 of them. Many links were chosen because the Wikidata search did not answer for a while (ATL-213) and because the artworks entered lately are ones Wikidata finds poorly, so the share is not taken as a lasting trend.

## Decision drivers

- Extra images serve learning in the artwork's own page; everywhere else the artwork keeps one image, as now.
- Adding a further image works exactly like adding the first one.
- No change to the wall, the review, the card index, the filters or the trash list, and no data to migrate.
- The automatic match must not put a wrong image in front of the learner.

## Considered options

Where the images are stored:

- A: the main image stays in the image columns of `artworks`; the other images go to a new table.
- B: every image in one new table, one of them marked as main; the existing images are moved into it.

How the learner adds more images: slots that each work like the main image field, or a separate gallery section with its own controls and captions.

How many images: five in all, or five besides the main one.

When the automatic match fills in an image: on an author match only, also without an author, or only when the search returns a single result.

## Decision outcome

Chosen by the owner: A, slots, five in all, no captions for now, and the automatic match as below.

### Several images

- An artwork has up to five images: the main image and up to four more. The main image stays in the image columns of `artworks`, so the wall, the review (flashcards, quizzes, `review_session`, `review_counts`), the card index, the "no image" filter, the trash list and the author portraits do not change.
- The other images are rows of a new table `artwork_images` (artwork, owner, position 1 to 4, and the same image fields as `artworks`: Wikidata item, Commons file with licence and attribution, own upload path or own link, width and height), with the same checks, row level security, grants and security tests as the artwork's own columns.
- In the form the image window shows the selected slot. Under it a row of slots: the main one marked "Główne", the others, and "+" ("Dodaj kolejne zdjęcie"), which adds an empty slot and selects it and disappears at five ("Najwyżej 5 zdjęć."). The actions under the window act on the selected slot and are those of today: "Znajdź zdjęcie" (Wikidata), "Dodaj własne" (file, clipboard, link) and "Usuń zdjęcie", plus "Ustaw jako główne" on any slot but the first.
- "Ustaw jako główne" moves the slot to the first place. Removing the main image makes the next one the main image. A slot keeps its own source, licence and Wikidata link, so the link of R-12 moves with the image.
- `save_artwork` takes the ordered images: the first goes to the columns of `artworks`, the others replace the artwork's rows in `artwork_images`. Own files follow [ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md) and [ADR-0063](0063-make-a-small-copy-of-every-own-image.md) for each slot: uploaded on "Zapisz" with a small copy, a replaced or removed upload deleted after the save.
- The artwork page shows the main image on the stage and, when there is more than one image, a strip of thumbnails under it ("Zdjęcie {n} z {m}" for assistive technology). A thumbnail puts its image on the stage; the full-screen viewer steps through all of them with the arrows.
- The trash keeps the images with the artwork; "Usuń na zawsze" removes the files of every image.
- Captions ("plan", "wnętrze") and reordering beyond "Ustaw jako główne" are left for later.

### The automatic best match

- Only in the add form, only for the main slot and only while it is empty. The search starts when the title and an author (or "Autor nieznany") are filled in and nothing has changed for 0.6 s, as the definition of a glossary term. It does not run in the edit form, for the other slots, after an own image was added, or again for the same title and authors.
- It fills in the best candidate whose creator matches an author. With "Autor nieznany" it fills in a candidate only when the search returns exactly one. Otherwise it fills in nothing.
- While it searches, the field says "Szukam zdjęcia w Wikidata…". After a match: "Z Wikidata: {tytuł} · {autor} · {data}" with "Wybierz inne", "Pokaż wszystkie" and "Usuń zdjęcie". "Wybierz inne" steps through the other candidates that match the author, kept from the same search, and is hidden when there is one; after the last it is disabled with "Nie ma więcej pasujących zdjęć.". "Pokaż wszystkie" opens today's dialog with the grid of candidates. With nothing certain: "Nie znalazłem tego dzieła w Wikidata. Poszukaj sam albo dodaj własne zdjęcie."
- The image is saved only with "Zapisz", like any other change of the form.
- Checked against the live service: "Dyskobol" with Myron, "Partenon" with Iktinos and Kallikrates, "Laokoon" with Hagesandros and "Dama z gronostajem" with Leonardo each give one candidate that matches the author and is right; "Słoneczniki" with van Gogh two versions; "Nike z Samotraki" without an author one right result; "Panteon" without an author 34 results led by a painting by Canaletto, which is why a single result is required without an author. The search makes the same two requests as the dialog (one SPARQL query, one Commons `imageinfo`); the change of the query in ATL-213 did not change what it returns.
- Other photos of the same artwork from Wikidata or Commons, for the extra slots, are left for later.

### Unused files

- A file in the images bucket is in use when the main image of an artwork, a row of `artwork_images` or an author's portrait points to it, or when it is the small copy (`-thumb.jpg`) of such a file. This is what the clean-up of ATL-109 checks.

### Consequences

- Good: buildings get their views on the artwork page without touching how the rest of the app shows an artwork.
- Good: no data to migrate; the change is the form, the artwork page, `save_artwork`, permanent delete and the new table.
- Good: in the add form a well-known artwork gets its image without a click.
- Bad: an image's data lives in two places (the columns for the main image, the table for the others), so "Ustaw jako główne" moves data between them on save.
- Bad: without an author the automatic match rarely fills anything in.

## More information

- Spike ATL-215, with ATL-136 (design of the match). Build: ATL-20 (several images) and ATL-137 (automatic match); ATL-109 (clean-up of unused files) uses the definition above.
- Requirement R-10 is replaced by R-109; R-110 describes the automatic match.
