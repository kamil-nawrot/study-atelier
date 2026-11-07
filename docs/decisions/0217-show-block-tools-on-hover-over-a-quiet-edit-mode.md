# 0217. Show block tools on hover over a quiet edit mode

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The block list of [ADR-0216](0216-edit-exhibitions-as-a-list-of-blocks-that-are-only-added-and-moved.md) cannot be broken. On develop, though, the owner found it visually chaotic ([ATL-557](https://linear.app/kamil-nawrot/issue/ATL-557)):

- Every block had a bar on top with a hairline under it, so ten blocks looked like a form, and the hairlines looked like drop lines.
- During a drag, the dashed outline of the hovered block, the drop line and the dragged name overlapped.
- The mark for a new column sat at the edge of the card, far from a narrow image.

The owner asked for consistency: every block works the same and differs only in the options of its toolbox. Edit mode should look like the finished exhibition, and every action should happen in an overlay that does not move the content.

## Decision drivers

- Edit mode should read like the exhibition the learner is building.
- Nothing may move or be covered when the tools appear.
- During a drag, only one thing should say where the block lands.

## Considered options

- A handle in the left gutter with a "⋯" menu, and one shared text toolbar.
- A floating pill with the tools in the corner of a block.
- Tools in an overlay on the top edge of the hovered block, as agreed on mockups.

## Decision outcome

Chosen: tools in an overlay on the top edge of the hovered block.

- **At rest:** each block has only a subtle background (`--color-surface`) and the spacing of the finished view. There are no bars, frames or hairlines.
- **On hover or focus:** the block shows a thin outline. Two parts sit on its top edge and stick out into the gap above:
  - the handle with the kind of block, on the left;
  - the toolbox, on the right.
- **Toolbox:** every block has "W górę", "W dół" and "Usuń z wystawy". A text adds bold, italic and the two kinds of lists. The toolbox stays visible while the learner types in the block.
- **During a drag:** outlines and tools are hidden. The drop spot shows the thick line and a dashed placeholder:
  - between rows, a dashed band across the gap;
  - beside a block, a dashed block as wide as the new column would be.
- **Row height:** the columns of a row stretch to the tallest block, so blocks side by side end at the same line.
- **Phone:** a tap on a block shows its toolbox. There is no handle, because a phone does not drag.

### Consequences

- Good: edit mode looks like the finished exhibition, and the tools never push content.
- Good: the placeholder shows the width of the new column before the drop.
- Bad: the tools are not visible until the pointer is over a block, so a first-time learner has to find them by hovering.

## More information

Issue [ATL-557](https://linear.app/kamil-nawrot/issue/ATL-557). Supersedes the block bar and the drop marks of [ADR-0216](0216-edit-exhibitions-as-a-list-of-blocks-that-are-only-added-and-moved.md). Updates R-208 and R-209.
