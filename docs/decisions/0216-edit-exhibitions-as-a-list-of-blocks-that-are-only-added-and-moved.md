# 0216. Edit exhibitions as a list of blocks that are only added and moved

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

After [ATL-555](https://linear.app/kamil-nawrot/issue/ATL-555) ([ADR-0215](0215-edit-exhibitions-with-a-pointer-drag-a-sticky-bar-and-close-ups-from-pins.md)) the owner tried the editor on develop and after a minute of use it was broken ([ATL-556](https://linear.app/kamil-nawrot/issue/ATL-556)):

- After an artwork was added, typing replaced the artwork, because the click left the artwork selected.
- An empty paragraph showed a narrow, tall dashed frame.
- During a drag every image became a thumbnail and the layout fell apart.
- Text could still be typed outside any block.

All of it comes from one cause: the whole exhibition was one editable ProseMirror document. Its selection could rest on an artwork, between blocks or inside an empty column, and every new rule only patched one of those places.

The owner asked for an editor that is hard to break: the learner only adds blocks and moves them between each other, with as few options as possible.

## Decision drivers

- The learner likes art, not technology. No action may leave the exhibition in a state that looks broken.
- Fewer options: whatever cannot be done cannot go wrong.
- Storage, the database checks and the finished view stay as they are ([ADR-0200](0200-store-an-exhibition-as-one-document-with-rows-of-its-artworks.md), [ADR-0211](0211-build-exhibitions-over-a-validated-document-and-a-trigger-written-index.md)).

## Considered options

- Patch the single-document editor once more.
- Hide editing in 0.21.
- Edit an exhibition as a list of block cards converted to and from the stored document.

## Decision outcome

Chosen: a list of block cards.

- Edit mode is a list of rows, and a row holds one to three blocks. It is read from the stored document and written back to it after every change, so the stored format does not change. Blank texts left by the old editor are dropped when the exhibition opens.
- The blocks are "Tekst", "Nagłówek", "Cytat", "Dzieło", "Paleta" and "Szczegół". Only a text, a heading and a quote have a field to type in, each its own. A text gets bold, italic and two kinds of lists; a heading and a quote are plain. Artworks, palettes and details are cards that cannot be typed into.
- A palette is a block of its own, stored as an artwork with `paletteOnly`, and shows the band as wide as its column. A detail is a close-up picked from the artwork's pins (ADR-0215), also a block of its own. The panel chooses what an artwork tile adds: "Dodaj jako: Dzieło, Paleta, Szczegół".
- A new block takes the full width. A click in the panel adds it at the end; a drag puts it where the learner drops it.
- Every block has a bar on top: its kind with a handle, the text tools for a text, "W górę", "W dół" and "Usuń z wystawy". The kind of a text and the options of an artwork (palette under the image, note, caption, close-up) are no longer offered. Existing artworks keep what they already show.
- A block is dragged by its handle, and an artwork, palette or detail also by its image. A line between rows shows where it lands, and a vertical mark at the left or right edge of a block shows that it will stand beside it. A row takes at most three blocks, and the edges of a full row offer nothing. Nothing changes size during a drag: the moved block is dimmed and its name follows the pointer. The page scrolls near the edges, and Escape or a release outside the exhibition cancels.
- A row is as tall as its tallest block. On a phone a row stacks, nothing is dragged, and the arrows move a block: out of its row first, then over the next row.

### Consequences

- Good: typing can only change the text it is in, so an artwork cannot be replaced or text left loose.
- Good: the ProseMirror schema, node views, key handling and drop rules of the single-document editor are gone.
- Bad: each text has its own small editor, so a selection cannot span two texts.
- Bad: the learner can no longer write a caption under an artwork or switch on its note or palette band; a text block beside the artwork does that job.

## More information

Issue [ATL-556](https://linear.app/kamil-nawrot/issue/ATL-556). Supersedes the editing parts of [ADR-0215](0215-edit-exhibitions-with-a-pointer-drag-a-sticky-bar-and-close-ups-from-pins.md) (the sticky bar over a ProseMirror document and the shrinking images) and the in-document editing of [ADR-0199](0199-tell-stories-in-exhibitions-of-the-learners-artworks.md). Updates R-202, R-203, R-204, R-206, R-207, R-208, R-209, R-210, R-227 and R-228.
