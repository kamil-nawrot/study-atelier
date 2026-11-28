# 0353. Pick an atelier artwork by hand while adding from an album

- Status: accepted
- Date: 2026-11-28

## Context and problem statement

[ADR-0347](0347-offer-curated-albums-of-artworks-to-take-into-the-atelier.md) finds an album artwork in the atelier by its album entry, the Wikidata id of an image or the same title, and [ADR-0348](0348-open-a-similar-album-artwork-as-a-comparison-while-adding.md) opens a similar one as the comparison with the learner's artwork. The owner knows artworks of the atelier that this matching misses, such as one saved under another title and without a Wikidata image. Such an artwork can only be added again, as a duplicate, because the comparison with an album version opens only for a matched artwork ([ATL-875](https://linear.app/kamil-nawrot/issue/ATL-875)).

## Decision drivers

- An artwork the learner already has should not come in twice because the matching missed it.
- The same steps as for a similar artwork: compare, pick the values, link to the album entry.
- No extra clutter for the many artworks that are new.

## Considered options

1. A link under every unmatched tile of the album gallery, which opens the comparison with an empty own half to pick the artwork in.
2. A button in the walk of adding from an album, next to "Pomiń", which opens a picker of the atelier and then the comparison inside the walk.
3. Both.

## Decision outcome

Chosen by the owner on 2026-11-28 from mockups on the real views: option 2, because every artwork taken from an album goes through the walk, the gallery stays as it is, and the picked artwork counts as completed like a similar one.

- The add form of the walk has "Mam je już w atelier" next to "Pomiń". It asks first when the form has unsaved changes.
- The button opens the picker of the comparison ([ADR-0203](0203-show-the-palette-on-the-stage-and-compare-two-artworks-side-by-side.md)) inside the walk, headed "Które dzieło z atelier to _Wenus z Willendorfu_?": the whole atelier, newest first, with its search. Its bar has "Zakończ", "Pomiń" and "Wróć do formularza".
- A click on an artwork opens the comparison with the album version ([ADR-0349](0349-pick-the-values-to-keep-in-the-comparison-with-an-album-version.md)) under the same strip of thumbnails, with the note "Porównujesz je z dziełem #0001 z Twojego atelier. Zaznacz, co z wersji z albumu ma do niego trafić." and the actions of [ADR-0348](0348-open-a-similar-album-artwork-as-a-comparison-while-adding.md). Saving links the artwork to the album entry and counts it as completed.
- "To inne dzieło, dodaj jako nowe" goes back to the add form, where "Mam je już w atelier" can pick another artwork. This also covers a similar artwork matched to the wrong one.
- The tile of the picker still links to the artwork's page, so it can be opened in a new tab; a plain click picks it.

### Consequences

- Good: an artwork the matching misses can be completed instead of added again, in the same walk.
- Good: a wrong similar match can be corrected without leaving the walk.
- Bad: the picker loads the whole atelier, as the comparison does.

## More information

Requirement R-361 in [requirements](../product/requirements.md). The mockups are in the project files under `atl-875/`.
