# 0021. Show the atelier as a wall of framed artworks

- Status: accepted
- Date: 2026-10-11

## Context and problem statement

The atelier at `/atelier` is the main view of the app: the learner returns to it to browse and find artworks and to start adding a new one ([requirements](../product/requirements.md#browsing-and-search)). The artwork is meant to be the central element of most views. How should the collection look and behave, on a phone and on a larger screen?

## Decision drivers

- Artworks are seen as images first, in their own proportions, never as small thumbnails at the side.
- Adding an artwork takes no more than 2-3 minutes, so the way in is always at hand.
- The MVP stays small: richer search and filters can come later.
- One breakpoint, 768 px ([ui-patterns.md](../guidelines/ui-patterns.md#layout)).

## Considered options

1. A text catalogue: rows with a narrow thumbnail and several fields
2. A wall of images in justified rows: equal height per row, both edges straight
3. A wall of images in masonry columns: equal width, height from the image proportions

## Decision outcome

Chosen option: 3, a masonry wall, because each image keeps its proportions at the same width and the owner prefers it to rows.

- Layout: one column on a phone (a feed), masonry columns from 768 px. Artworks are ordered from the most recently added; each goes into the shortest column.
- Tile (`ArtworkTile` in `packages/ui`): the image on a solid paper passe-partout, 8 px on the top and sides, with a wider bottom edge holding the title (artwork title role), then the authors and the date. The record number sits in the top-right corner of the image on a small translucent dark badge, so it stays readable on light images. An artwork without an image shows an empty 4:5 window. The passe-partout tokens `color.mat.*` are the same in both themes. Everything else about an artwork is in its detail view.
- Top bar, sticky while scrolling: a large search field that filters by title only, and the primary button "Dodaj dzieło" (icon only on a phone).
- Menu: on a larger screen a side menu that is a narrow icon strip when collapsed and shows labels when expanded. At its top a chevron expands it; when expanded the top shows the logo and a chevron that collapses it. Below it the avatar (a static placeholder for now) and the atelier. Trash and sign out are at the bottom. On a phone the same items open from a menu icon in the top bar.
- Empty atelier: a short text and a secondary button to add the first artwork. No results: a text naming the search and a button that clears it.

### Consequences

- Good: the wall shows the collection as images, which suits learning to recognise artworks.
- Good: the tile is a library component, so the trash and later views can reuse it.
- Bad: masonry order runs across columns, so neighbours in the order are not always side by side.
- Bad: the paper passe-partout disappears on the paper background of the light theme until that case is designed.
- Bad: `Frame` still draws the older outlined passe-partout used on the start and sign-in screens, so two passe-partout styles exist for now.

## More information

- Mockup: https://claude.ai/artifact/4S74ikSST7DhYzDhUCs9g1
- Filters by type, authors, period, style, material and location are designed in ATL-37; the add-artwork flow in ATL-36.
- Open: how the wall looks in the light theme (for example on the always dark stage) and whether `Frame` switches to the solid passe-partout.
