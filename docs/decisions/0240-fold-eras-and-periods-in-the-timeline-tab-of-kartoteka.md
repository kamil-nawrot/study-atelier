# 0240. Fold eras and periods in the timeline tab of Kartoteka

- Status: accepted
- Date: 2026-11-10

## Context and problem statement

The tab "Okresy i style" of Kartoteka shows the six eras along a vertical line, each period as a large name with its number of artworks and the styles of a period as filled tags under it ([ADR-0040](0040-manage-category-values-in-a-card-index.md)). Nothing folds, so a collection with many periods and styles makes a long page, and the tab looks unlike the other tabs, whose records are rows with the name in bold, "N dzieł" at the right and hairlines between them ([ADR-0188](0188-redesign-the-card-index-lists.md)). The counts also sit unevenly: after the name of a period, inside a tag, and far below the header of an era. How does the tab fold, and how do its records look?

## Considered options

For the tab, drawn on mockups at desktop and phone width:

- A: the axis with records. The square era markers with their icons stay on the vertical line, with the era name in the title font and the outlined years badge; an era folds with a chevron at the right of its header; periods are record rows with a chevron at the left that unfolds their styles as lighter, indented rows.
- B: the eras as rooms of "Ekspozycja" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)): an overline with the years over the era name, a hairline between eras, periods as rows with the number of styles beside the number of artworks, and the styles of a period in two columns.

For "Okresy bez epoki" and "Style bez okresu" at the end of the tab:

- An outlined marker at the end of the axis titled "poza epokami", holding both groups.
- A separate section after the axis, under a hairline.

## Decision outcome

Chosen by the owner in ATL-609: A, with the groups in a separate section.

- The axis stays: the era markers joined by the line, the era name in the title font in italics as a link to the era page, the years in an outlined badge after it, and under it on a phone instead of wrapping inside the badge.
- An era folds with a chevron button at the right of its header (`aria-expanded`, named by the era). An unfolded era without periods still says "W tej epoce nie ma jeszcze okresów.".
- A period is a record row like those of the other tabs: the name in bold as a link to the period page, "N dzieł" at the right and a hairline between rows. A chevron button at the left unfolds its styles; a period without styles keeps the room of the chevron empty. A period linked to several eras appears under each of them.
- The styles of an unfolded period are lighter, indented rows: regular weight, a smaller size and hairlines in `--color-tag`, each a link to the style page with its "N dzieł".
- At first every era is unfolded and every period folded. The folding is remembered in the browser of the device, as the rooms of "Ekspozycja" are: the folded eras and the unfolded periods, each a list of codes or ids in local storage. A period is remembered by its id, so it is unfolded under every era it belongs to.
- While the learner searches, every era shown and every period with a matching style is unfolded, so the results are visible. A chevron still works during a search, but what it changes lasts only for that search and does not touch the remembered folding.
- "Okresy bez epoki" and "Style bez okresu" stand after the axis under a hairline, with their existing headings in small capitals and the same rows: periods with their chevron and styles, styles as rows. No text is new.
- Every count stands at the right edge of its row, so the counts of periods and styles line up.

### Consequences

- Good: a long collection folds to the eras and periods the learner is studying, and the tab reads like the other tabs of Kartoteka.
- Good: the axis keeps the eras in time, and the counts line up at the right on every level.
- Bad: styles are hidden until their period is unfolded, so the tab no longer shows the whole map at once.
- Bad: option B and the marker "poza epokami" were dropped because they lose the axis or need new texts, and the marker would pretend to be an era.

## More information

Designed and built in ATL-609, on mockups in `tmp/mockups/` (`periods-desktop`, `periods-phone`, `periods-tail`). The folding lives in `card-index/timeline-folding/timeline-folding.svelte.ts`.
