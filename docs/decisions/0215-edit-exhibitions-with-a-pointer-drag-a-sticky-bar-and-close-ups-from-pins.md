# 0215. Edit exhibitions with a pointer drag, a sticky bar and close-ups from pins

- Status: accepted; the bar, the drag and the editing of the document are superseded by [0216](0216-edit-exhibitions-as-a-list-of-blocks-that-are-only-added-and-moved.md)
- Date: 2026-11-07

## Context and problem statement

The exhibition editor built in [ATL-542](https://linear.app/kamil-nawrot/issue/ATL-542) and [ATL-543](https://linear.app/kamil-nawrot/issue/ATL-543) turned out hard to use when the owner tried it ([ATL-555](https://linear.app/kamil-nawrot/issue/ATL-555)):

- The bar over a block showed up in odd places. It was fixed on the screen from a position measured once and moved only when the whole window scrolled, so it stayed behind after an image loaded, and it covered the text of the block above.
- Moving a block used the browser's own drag and drop. In Chrome it stops the mouse wheel, and an image as tall as the window left no place to drop it. The drag started only from "Przenieś" in the bar.
- A text block with the cursor in it gave no sign that it was the selected one.
- "Tylko paleta" drew an empty 4:5 frame with the band at its bottom.
- A palette that could not be read was hidden without a word and never asked for again in the session.
- A close-up was cut with a picker of its own (a click and a slider) and shown as a square. The owner meant close-ups to be picked from the pins the learner already placed with the loupe, round like the loupe.

The owner chose to rebuild the editing layer over two other options: editing without drag (taps and arrows only), or taking exhibitions out of 0.21. The document, its storage ([ADR-0200](0200-store-an-exhibition-as-one-document-with-rows-of-its-artworks.md), [ADR-0211](0211-build-exhibitions-over-a-validated-document-and-a-trigger-written-index.md)) and the view stay as they are.

## Decision drivers

- The learner likes art, not technology. Dragging must feel safe: the page scrolls, the target is always visible, and a mistake can be undone by letting go outside or pressing Escape.
- The bar must belong to its block visibly and never hide the text the learner is reading.
- A close-up should reuse what the learner already studied with the loupe instead of a second tool for the same thing.

## Considered options

For moving blocks: the browser's drag and drop with a smaller drag image, or a drag of its own on pointer events.

For the bar: fixed on the screen and measured on every scroll and resize, or placed in the document next to its block and kept in view with `position: sticky`.

For close-ups: the picker with a slider, or a list of the artwork's pins.

## Decision outcome

- Blocks are moved with a drag of their own on pointer events (`BlockDrag`). It starts after the pointer travels a few pixels, so a click still selects a block or adds a panel item at the cursor. The page scrolls by itself near the top and bottom edges, the mouse wheel keeps working, and Escape or a release outside the document cancels the move. While dragging, the images of the document shrink to small previews so that the whole exhibition fits on the way, the moved block is dimmed, a label with its name follows the pointer, and the line or slot of R-209 shows where it lands. An artwork or a close-up is picked up by its image, a text by "Przenieś" in its bar, and a panel item by itself. A touch does not start a drag; on a phone the arrows of the bar move a block ([ADR-0199](0199-tell-stories-in-exhibitions-of-the-learners-artworks.md)).
- The bar is placed in the document, above its block, and sticks under the top bar while the block is on screen. Images that load later move it with the block. In edit mode on a wide screen the gap between blocks is as tall as the bar, so the bar never covers the block above; edit mode is otherwise laid out like the finished exhibition. On a phone the bar stands at the bottom of the screen and scrolls sideways.
- The block with the cursor or the selection in it has a dashed frame, texts as well as artworks and close-ups.
- "Tylko paleta" shows only the band of colours, as wide as the image would be. The palette says "Zbieranie kolorów…" while it loads and "Ten obraz nie pozwala odczytać swoich kolorów." when the image does not let its colours be read, and a failed reading is tried again the next time the palette is shown.
- "Dodaj zbliżenie" lists the pins of the artwork's images as round lenses with their text ("Pinezka 2" for a pin without text) and adds the one picked beside the artwork. A pin without a saved view gets a quarter of the image width. An artwork without pins says "To dzieło nie ma jeszcze pinezek. Wbij je lupą w widoku dzieła, a potem wróć tutaj." with "Otwórz dzieło" in a new tab. A close-up is drawn like a pin's view: a round lens of the loupe ([ADR-0110](0110-look-at-details-through-a-loupe.md)). The stored geometry (`imageId`, `x`, `y`, `viewWidth`) does not change, so existing close-ups keep working.

### Consequences

- Good: a block can be moved anywhere in a long exhibition, the bar cannot drift, and close-ups come from what the learner already marked.
- Good: the native drag payload and its parsing are gone; the editor receives typed blocks.
- Bad: edit mode on a wide screen has larger gaps between blocks than the finished exhibition.
- Bad: a close-up can only be made from a pin, so an artwork needs a pin first.

## More information

Issue [ATL-555](https://linear.app/kamil-nawrot/issue/ATL-555). Amends [ADR-0199](0199-tell-stories-in-exhibitions-of-the-learners-artworks.md) (the bar "above the block, or below it when there is no room") and the close-up picker of ATL-543. Updates R-202, R-208, R-209 and R-228.
