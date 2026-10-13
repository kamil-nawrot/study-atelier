# 0035. Let wide artworks span two wall columns, with a fixed-height tile caption

- Status: accepted
- Date: 2026-10-13

## Context and problem statement

The wall places every artwork in one masonry column ([ADR-0021](0021-collection-view-as-a-wall-of-framed-artworks.md)). A panorama or a frieze, such as the cave paintings of Lascaux at 4:1, then becomes a strip less than 100 px high in which nothing can be seen. The owner asked whether such artworks can take two columns, in a way that keeps working when the wall is ordered differently ([ADR-0033](0033-order-the-wall-by-period-with-a-period-rail.md)) or filtered later.

Today each column is its own list, so the browser stacks the tiles and the code only picks a column, using an estimate of the caption height. Tile positions are computed from the stored image sizes, without measuring, so the wall can restore the scroll position when the learner comes back from an artwork ([ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md), [ADR-0023](0023-atelier-routes-and-commons-thumbnails.md)). A tile across two columns belongs to neither list: it must start at an exact height, below the taller of the two columns, which is unknown while captions wrap freely.

## Decision drivers

- Very wide artworks are readable on the wall.
- The layout stays computed from stored data, so the scroll position is restored and nothing jumps after the page is drawn.
- The result does not depend on the order or on a filter: the same artwork is wide in every list.
- Nothing is cropped or stretched; artworks keep their proportions.

## Considered options

How the wall knows where a tile ends:

1. A caption of fixed height, so the height of a tile follows from the image proportions and the column width
2. Measuring the tiles after they are drawn and moving them

Which artworks span two columns: from 2:1, or from 1.75:1.

How the full title is shown when the caption cuts it: the browser's native `title`, a `Tooltip` component in the library, or a caption that grows over the image on hover.

Where the fixed caption applies: everywhere, or only where wide artworks can span.

How many title lines the caption holds: up to 2, or 1.

## Decision outcome

The owner's choices in ATL-83:

- **Wide artworks.** An artwork whose image is at least twice as wide as it is high spans two adjacent columns when the wall has three columns or more. At 1.75:1 triptychs and wide paintings also span, and in the mockup they stacked into a lane through the middle of the wall.
- **Placement.** An ordinary artwork goes to the shortest column, as today. A wide artwork goes to the pair of adjacent columns whose top is lowest and most even. When the two columns differ a lot, up to three of the following artworks may be placed first to level the pair, never across a period block. When that does not level them, a gap stays above the shorter column.
- **Layout.** The wall becomes one list whose tile positions are computed from the stored image sizes, the column width and the fixed caption height, before the page is drawn. Every change of the list (order, search, filter) lays the wall out again from the start, as today.
- **Caption.** From three columns up, the tile caption has a fixed height: the title takes up to two lines and ends with an ellipsis when it is longer; authors and date take one line, in which the authors are cut and the date stays visible. A short title leaves the second line empty, so the bottom edge of the passe-partout is the same on every tile.
- **Phone.** In one column nothing spans, so the caption stays full, as today.
- **Full text.** When the caption is cut, a new library `Tooltip` shows the full title, authors and date: a dark panel above the caption in the stage colours, with a hairline outline. It appears after a short delay on hover and on keyboard focus, and only when the text is really cut.

### Consequences

- Good: panoramas, friezes and predellas are readable on the wall.
- Good: the scroll position is still restored and the wall does not move after it is drawn.
- Good: being wide is a property of the image, so sorting, searching and filtering never change it.
- Good: keyboard and screen reader order follow the list order instead of going down one column after another.
- Good: the library gains a `Tooltip` that other components can use instead of the native `title`.
- Bad: long titles are cut on the wall; the full title needs the tooltip or the artwork view.
- Bad: tiles with short titles carry an empty line under the title.
- Bad: a wide artwork can sit a few places later than its position in the order, and a gap can stay above it.
- Bad: the wall component and the tile caption are rewritten; the change waits for the build of the period order (ATL-79), which changes the same component.

## More information

- Requested in the project thread "ATL-83 Szerokie obrazy na dwie kolumny", 2026-10-12. Design: ATL-83; build: ATL-84.
- Analysis and mockups rendered with the real tokens and sample artworks are in the project files under `szerokie-obrazy/` and `atl-83/`.
