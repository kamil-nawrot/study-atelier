# 0218. Place blocks and show notes from the block toolbox

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

After [ADR-0217](0217-show-block-tools-on-hover-over-a-quiet-edit-mode.md) the owner tested the editor on develop ([ATL-564](https://linear.app/kamil-nawrot/issue/ATL-564)) and found these problems:

- In a row of three, the handle label and the text tools did not fit.
- A drop that changed nothing still showed a line and a placeholder.
- Between two blocks, two lines showed.
- The note of an artwork could no longer be shown.
- After the panel was collapsed, "Dodaj" was out of sight.
- A heading looked too plain.

He also asked for a way to place the content of a block: left, centre or right, and top, middle or bottom of a row.

## Decision drivers

- Every block works the same and differs only in the options of its toolbox ([ADR-0217](0217-show-block-tools-on-hover-over-a-quiet-edit-mode.md)).
- The toolbox must fit a column of a row of three.

## Considered options

- Six buttons for the position, three for each direction.
- One "Położenie" button that opens a 3×3 grid of places.

## Decision outcome

Chosen: one "Położenie" button with a 3×3 grid, because it costs one place in the toolbox for nine positions.

- **Position:** every block gets "Położenie".
  - It is stored as `align` (`left`, `center`, `right`) and `valign` (`top`, `middle`, `bottom`).
  - Only a position other than the top left is stored, and the database accepts only these values.
  - The same position applies in edit mode and in the finished exhibition. The columns of a row stretch to the tallest one, so the vertical place matters there.
- **Note:** an artwork gets "Notatka", which switches its `note` on and off.
- **Narrow blocks:** a narrow block shows only the grip of its handle, and the kind stays in the tooltip. A very narrow block hides "W górę" and "W dół", which a drag replaces on a desktop, and uses smaller buttons.
- **Drop marks:**
  - Between two blocks of a row, one line stands in the middle of the gap.
  - A drop that would leave the block where it is offers nothing: over the block itself, at its own edges, or next to its own row when it stands alone.
- **"Dodaj":** it sits in the top bar, which stays in sight.
- **Heading:** a heading uses the title typeface in a larger size.

### Consequences

- Good: the learner places a block without the toolbox growing.
- Bad: one migration more, because the database lists the attributes a block may have.

## More information

Issue [ATL-564](https://linear.app/kamil-nawrot/issue/ATL-564), migration `20261107140000_exhibition_block_positions.sql`. Updates R-205, R-208 and R-209.
