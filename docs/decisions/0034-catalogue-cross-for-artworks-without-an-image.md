# 0034. Show an artwork without an image as a catalogue cross in a hairline frame

- Status: accepted
- Date: 2026-10-13

## Context and problem statement

An artwork without an image shows an empty 4:5 window in its passe-partout: on the wall ([ADR-0021](0021-collection-view-as-a-wall-of-framed-artworks.md)), on the stage of the artwork view ([ADR-0026](0026-artwork-view-as-a-stage-with-an-information-panel.md)) and in the image field of the form before an image is picked ([R-14](../product/requirements.md#images)). Today the window holds a centred Lucide `image` icon in the muted colour. It reads like a stock "missing image" state and does not fit the two-tone, artwork-first look of the app. How should the empty window look?

## Decision drivers

- Only the two inks and the passe-partout colours; no new hue, radius 0, no shadows ([ADR-0010](0010-design-tokens-figma-sync.md)).
- Readable at tile size and at the size of the artwork view, in both themes.
- Clearly different from the image loading state ("canvas priming", [ADR-0030](0030-loading-states-for-the-first-load-and-images.md)).
- The tile keeps its 4:5 window, so the masonry layout and the record number badge stay as they are.

## Considered options

Direction:

1. Primed canvas: a fine weave texture over the window
2. Initial: the first letter of the title, large, in the artwork title typeface
3. Catalogue cross: hairline diagonals, as catalogues and exhibition plans mark a picture without a photograph
4. Trace on the wall: a lighter rectangle and a nail, where a picture was taken down

Layout of the cross:

1. Diagonals from corner to corner of the window
2. Diagonals inside a hairline frame inset from the window's edges
3. Diagonals from corner to corner with a short label where they cross

## Decision outcome

The owner's choices in ATL-62:

- **Direction: catalogue cross.** The primed canvas came too close to the loading state; the initial and the trace on the wall were the alternatives shown.
- **Layout: cross in a hairline frame.** Inside the window, a hairline (`border.width.hairline`) rectangle inset by `spacing.6` from each edge, with both of its diagonals, in the passe-partout's muted text colour (`color.mat.fg-muted`) at reduced opacity. The window keeps its background (`color.mat.window`) and its 4:5 ratio. There is no visible text.
- **Label.** The window is an image with the accessible name "Brak zdjęcia", which replaces "Brak obrazu" so the app uses one word for the image everywhere ("Dodaj zdjęcie", "Usuń zdjęcie").
- **Where.** The same placeholder is used on the wall tile, on the stage of the artwork view (above "Dodaj zdjęcie") and in the form's image field before an image is picked. It is one component in `packages/ui`.

### Consequences

- Good: the empty window reads as a deliberate catalogue entry waiting for its photograph, not as a broken image.
- Good: no new tokens; the inset and the line come from the existing spacing and border width scales.
- Good: the 4:5 window and `NO_IMAGE_RATIO` are unchanged, so nothing on the wall moves.
- Bad: every artwork without an image looks the same on the wall; only the caption tells them apart.
- Bad: the cross is a convention the learner may not know; the caption and "Dodaj zdjęcie" in the artwork view carry the meaning.

## More information

- Requested in the project thread "ATL-62 Placeholder dla dzieł bez zdjęcia", 2026-10-12. Design: ATL-62; build: ATL-86.
- Mockups were rendered on the wall and the artwork view with sample artworks; they are in the project files under `atl-62/`.
