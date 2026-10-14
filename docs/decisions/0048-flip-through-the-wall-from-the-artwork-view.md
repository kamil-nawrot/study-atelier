# 0048. Flip through the wall from the artwork view in place of the history entry

- Status: accepted
- Date: 2026-10-14

## Context and problem statement

[ADR-0042](0042-filter-the-collection-in-the-browser.md) decided that the artwork view goes to the previous and next artwork of the filtered and ordered wall, with subtle arrows at the edges of the stage, the arrow keys and a horizontal swipe on a phone, and that the arrow is dimmed at either end of the list (R-61). It did not decide how flipping uses the browser history, how the back arrow of the top bar returns to the wall with its filters, where the artwork view gets the list from, or what it shows when it was not opened from the wall.

## Decision drivers

- The back arrow of the top bar returns to the wall as it was: the filters, the search, the order and the scroll position ([ADR-0026](0026-artwork-view-as-a-stage-with-an-information-panel.md)).
- The list is exactly what the learner saw on the wall, search included, although the search is not in the URL.
- No extra query for the whole collection when an artwork opens.

## Considered options

History while flipping:

1. Each artwork replaces the current history entry
2. Each artwork is a new history entry, and the back arrow of the top bar jumps over all of them

Where the wall returns after flipping: at the position it had, or at the tile of the last artwork viewed.

The artwork view without a wall in the same tab (a bookmark, a new tab, an address typed by hand): no arrows, or the whole collection in the remembered order.

## Decision outcome

Option 1, the wall where it was, and no arrows without a wall, as the owner decided in ATL-65.

- Flipping replaces the current history entry. After wall → #0012 → #0013 → #0014 the history holds the wall and #0014, so both the back arrow of the top bar and the browser's back button return to the wall at once, with its filters, search and scroll position.
- The wall reopens where it was, not at the last artwork viewed: the simpler way, and the learner chose the first artwork there.
- Whenever the wall changes what it shows, it remembers the record numbers of the shown artworks in their order, together with its filter query, in `sessionStorage` (one tab, kept through a reload).
- The artwork view shows the arrows only when its artwork is in that list. Otherwise there are no arrows and no keys or swipe, because the view would invent an order the learner did not choose.
- When the view was not reached through history from the wall (after a reload or an edit), its back arrow links to the wall with the remembered filter query, so the filters are not lost.
- The arrows are links that replace the history entry and keep the focus, so a keyboard learner can press Enter again. The arrow keys work when the focus is not in a field or a dialog; a swipe counts when the finger moves at least 48 px and more than twice as far sideways as up or down, and the stage leaves vertical scrolling and pinch zoom to the browser.
- The data of the next artwork is preloaded, so flipping forward does not wait for the database.

### Consequences

- Good: going back is one step from any artwork, and the wall is exactly as the learner left it.
- Good: no new query and no change to the URL of an artwork.
- Bad: the browser's back button cannot step back through the artworks the learner flipped through.
- Bad: an artwork opened in a new tab without the wall, or from a bookmark, has no arrows.
- Bad: after many artworks the wall opens at the first one, which may be far from the last one viewed.

## More information

- Decided by the owner in the ATL-65 session, 2026-10-14. Builds on ADR-0042 and R-61.
