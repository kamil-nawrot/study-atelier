# 0346. Show more images of the same artwork in the candidate dialog

- Status: accepted
- Date: 2026-11-25

## Context and problem statement

A Wikidata match brings one image of an artwork (P18), and for architecture and sculpture that one image is often a poor choice. The item's Commons category usually holds many more photos under free licences. Of the 90 artworks of the owner's production collection with an accepted match, 84 have a Commons category, with a median of 21 files for paintings, 15 for sculptures and 90 for architecture (at most 901), and 55 of the categories have subcategories ([ATL-853](https://linear.app/kamil-nawrot/issue/ATL-853/more-images-of-an-artwork-from-its-commons-category)).

How does the learner reach those images?

## Decision drivers

- The image stage of the artwork form gets no new button or link; it is to be tidied up, not filled ([ATL-862](https://linear.app/kamil-nawrot/issue/ATL-862/tidy-up-the-image-stage-of-the-artwork-form)).
- One way of picking in the dialog, the same as for candidates.
- Large categories must not load at once.

## Considered options

1. A link "Więcej obrazów z Commons" under the main image, opening its own dialog where several images are ticked at once.
2. A third button "Z Commons" in an empty further slot.
3. The images of the same artwork as a first section of the existing dialog "Które to dzieło?".

## Decision outcome

Chosen option: 3, by the owner on 2026-11-25 after mockups of option 1, because the link did not fit the other buttons and it was unclear when it shows.

- When the main image comes from a Wikidata match, the dialog opened by "Znajdź obraz" of a further slot or by "Wybierz inny" of the main image shows "Obrazy tego dzieła" first: the image files (JPEG, PNG, TIFF, WebP) of the item's Commons category, without the main image, 24 at a time with "Pokaż więcej". Below, "Inne dzieła o tym tytule" lists the other candidates as before, without the item itself.
- One click picks one image into the slot the dialog was opened from, with its licence and author, as for a candidate.
- Without a main image from a match, without a category, or when the category cannot be read, the dialog is as before, without headings.
- Only the files of the category itself are shown, no subcategories.
- The dialog texts no longer name Wikidata or Commons: "Obrazy pasujące do „{tytuł}”, {autorzy}. Kliknij ten, który chcesz dodać.", "Wyszukiwanie obrazów…" and the two texts for no result. Error messages keep the name of the service, since it tells the learner the problem is outside the app.

### Consequences

- Good: no new control on the stage; "Wybierz inny" can also swap the main image for a better photo of the same artwork.
- Good: the category name comes from one light request (`wbgetclaims`, P373), and each page of files with their licences from one Commons request; on live Commons the first page took 0.6 to 2.8 s and the next ones 0.2 to 0.5 s.
- Bad: several images of one artwork need the dialog opened once per image; ticking several at once can be added later.
- Bad: images that sit only in subcategories (interiors, details) are not offered.

## More information

- Mockups were taken from the real form with `pnpm screenshot` and kept outside the repository.
