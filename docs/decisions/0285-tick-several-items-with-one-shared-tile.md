# 0285. Tick several items with one shared tile

- Status: accepted
- Date: 2026-11-13

## Context and problem statement

The dialog "Przypisz detale" of a symbol meaning ([ADR-0281](0281-assign-details-to-a-meaning-and-align-the-symbol-page-with-the-app.md)) ticked each detail with a checkbox beside its lens. The app already ticks several items in the visit form of Kronika (R-153): a tile on the passe-partout with a mark in its corner, the unticked tile dimmed. The owner asked for one way of ticking items. How should a round detail lens take that tile?

## Decision drivers

- One look and one behaviour for ticking several items.
- A detail of a symbol stays a round lens, as everywhere in the atlas.

## Considered options

- A. The lens stands on the passe-partout of the tile, the mark in the corner of the tile.
- B. The mark sits on the edge of the lens.
- C. A square crop of the detail in a framed window, exactly as an artwork of a visit.

## Decision outcome

Chosen option: A, after the owner compared mockups of the three. The tile and its mark are those of a visit, and the detail keeps its lens. B covers part of the detail and departs further from the visit; C would show a symbol's details square in this dialog alone.

The tile is one app component, `TickTile`, used by the visit form and the dialog: the passe-partout, the mark filled with ✓ when ticked, the text under the picture, the unticked tile dimmed in place, and a click anywhere on it toggling a visually hidden checkbox named by its text. A visit frames its image in a square window; the dialog passes `framed={false}` and its lens stands on the passe-partout.

### Consequences

- Good: ticking looks and works the same wherever several items are chosen, and a new place reuses the tile.
- Bad: on a round lens the mark stands in the corner of the tile, a little away from the picture.

## More information

[ATL-736](https://linear.app/kamil-nawrot/issue/ATL-736/tick-details-in-przypisz-detale-like-artworks-in-the-visit-form).
