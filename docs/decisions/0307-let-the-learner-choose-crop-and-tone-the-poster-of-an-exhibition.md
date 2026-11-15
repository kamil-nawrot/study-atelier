# 0307. Let the learner choose, crop and tone the poster of an exhibition

- Status: accepted
- Date: 2026-11-15

## Context and problem statement

The list of exhibitions shows each one as a poster whose image is always the first image of the first artwork of the document, cut to 4:5 ([ADR-0199](0199-tell-stories-in-exhibitions-of-the-learners-artworks.md), [ADR-0200](0200-store-an-exhibition-as-one-document-with-rows-of-its-artworks.md)). An exhibition often opens with an artwork that does not suit the poster, and the cut may miss what matters. How does the learner set the poster, and how is it stored? Designed with the owner in [ATL-772](https://linear.app/kamil-nawrot/issue/ATL-772), one question at a time with mockups.

## Decision drivers

- The poster must stay hard to break: few options, each with a safe range.
- Storage for own files is limited to 1 GB per account.
- The poster appears in three places, all 4:5: the list, Archiwum and "Na N wystawach".
- An artwork leaves an exhibition, goes to Archiwum and comes back.

## Considered options

- Source: any artwork of the exhibition; also a detail from a pin; also an uploaded file.
- Place: one dialog; "Ustaw jako okładkę" in the toolbox of an artwork block; both.
- Cropping: a 4:5 frame moved over the whole image with a small preview; the image dragged inside the poster itself.
- Filters: five sliders with narrow ranges; three sliders; five plus hue and blur; free CSS.
- A missing chosen artwork: the first artwork without crop and filters; clearing the choice on removal; the first artwork with the chosen filters.
- Storage: columns with range checks and references; one `jsonb` column checked by a function.
- Name: "okładka", "plakat", "afisz", "winieta".

## Decision outcome

- **Name:** "afisz". "Zmień afisz" in the top bar of edit mode, next to "Gotowe", opens the dialog "Afisz wystawy", on a computer and a phone.
- **Source:** any artwork of the exhibition, and for an artwork with several images one of them (the strips "Dzieło na afiszu" and "Obraz"). No uploaded file, because of the storage limit.
- **Cropping:** the image is dragged inside the 4:5 poster frame with the title and meta below, and "Przybliżenie" zooms from 1 to 3×. One crop serves all three places.
- **Filters:** "Barwy i światło" has "Szarość" and "Sepia" (0–100%), "Jasność" and "Kontrast" (70–130%) and "Nasycenie" (0–150%). They are stored as numbers, and the app composes the CSS `filter`; no CSS written by the learner reaches the page.
- **Missing artwork:** when the chosen artwork is not in the exhibition or is in Archiwum, the first artwork stands in without the crop but with the chosen filters. The choice is kept and returns with the artwork. A deleted image falls back to the first image of the artwork.
- **Storage:** `exhibitions` gains `cover_artwork_id` and `cover_image_id`, references on `(id, owner_id)` to `artworks` and `artwork_images` with `on delete set null` of the reference only, the crop `cover_x`, `cover_y` (0–1) and `cover_zoom` (1–3), set together or not at all, and the filters `cover_grayscale`, `cover_sepia`, `cover_brightness`, `cover_contrast` and `cover_saturate` with defaults and range checks. `set_exhibition_cover` writes them, refuses an image of another artwork, and leaves the `revision` of the document alone, so it never clashes with the autosave. The summaries read the columns with the rows of `exhibition_artworks` and pick the shown artwork in the browser. The export carries the columns with the row and the import inserts them; an older export has none. The model is M12 in [coverage.yaml](../data-model/coverage.yaml), the write W33 in [access-patterns.yaml](../data-model/access-patterns.yaml).

### Consequences

- Good: the database keeps every value in range and every reference within the account, and deletes clear the references by themselves.
- Good: an exhibition without a chosen poster looks as before.
- Bad: ten columns on `exhibitions` for one feature.
- Bad: a poster cannot come from an image outside the atelier.

## More information

The texts are in [ATL-772](https://linear.app/kamil-nawrot/issue/ATL-772); the dialog and the drawing of the poster are built in [ATL-774](https://linear.app/kamil-nawrot/issue/ATL-774).
