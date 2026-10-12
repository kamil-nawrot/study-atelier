# 0033. Order the wall by period, with a period rail that follows the scroll

- Status: accepted
- Date: 2026-10-12

## Context and problem statement

The wall shows artworks from the most recently added ([ADR-0021](0021-collection-view-as-a-wall-of-framed-artworks.md)). The owner wants sorting and filtering of the collection added one mechanism at a time, starting with the date the artwork was made. Learning art history follows the order of periods, so the wall should be able to show the collection that way, and make it visible which period the learner is looking at while scrolling.

An artwork has a year (negative before the common era, optionally approximate, possibly empty) and a period field that takes any number of [category values](../product/glossary.md), from a starting list or the learner's own.

## Decision drivers

- The learner reads the collection as a sequence of periods, the way the subject is taught.
- The current period stays in view while scrolling, without moving the wall or covering artworks.
- Periods are the learner's own values, not boundaries fixed in code.
- The top bar keeps its layout from [ADR-0031](0031-full-width-top-bar-in-every-atelier-view.md).

## Considered options

Orders offered:

1. Recently added, oldest artworks first and newest artworks first
2. Recently added and "by period"

Where each artwork's period comes from:

1. Fixed year ranges per period, defined in code
2. The artwork's period field; each period's bounds come from the artworks that have it

How artworks are placed:

1. Strictly by year, so artworks of overlapping periods interleave
2. In one block per period, by year inside the block

Artworks without a period: a "no period" block at the end, matched to a period by year, or left out of this order.

Where the period is shown when there is no room at the right edge: the rail with lines only and the current label over the wall, or a period strip under the top bar.

## Decision outcome

The owner's choices in ATL-78:

- **Orders.** A select in the top bar, right after the search field, offers "Ostatnio dodane" (the default, as today) and "Według epok". On a phone the select shows only an icon. The owner first chose three orders, then named the new one "by period"; a reverse direction no longer fits that name and was dropped.
- **Period of an artwork.** Its first period value, in the order the learner entered them. An artwork appears once on the wall.
- **Bounds of a period.** The lowest and the highest year among the artworks whose first period it is. Bounds change as the learner adds artworks.
- **Order.** Periods follow each other by their lowest year; a period whose artworks have no year comes last. Inside a period, artworks go by year; an approximate year counts as that year; equal years keep the record number order; artworks without a year end the block.
- **Artworks without a period** are left out of this order. The count above the wall then shows how many of all artworks are shown, as during a search.
- **Period rail.** While the wall is ordered by period, a column of short lines labelled with the periods is fixed to the right edge of the screen, in the margin next to the wall, without moving it. Periods already scrolled past stack at the top, the ones still ahead stack at the bottom, in chronological order. The current period is highlighted and travels from the bottom stack through the middle of the screen while its artworks pass, then joins the top stack. At the top of the wall the first period is highlighted at the top edge.
- **Narrow screens.** When the margin is too narrow for the labels (a laptop at about 1,500 px or less, and a phone), a strip under the top bar shows the current period, its years and a short line per period, the current one longer, instead of the rail.
- **Memory.** The chosen order is remembered on the device, also after the app is closed or the learner signs in again.

### Consequences

- Good: the learner can walk through their collection period by period, and sees which periods hold the most work.
- Good: periods and their bounds are the learner's own; no list of dates has to be kept in code.
- Good: an artwork tagged with several periods is placed by the one the learner put first, so the learner controls it.
- Bad: an artwork whose year falls outside its period's usual dates stretches that period's bounds; the wall shows the learner's data as entered.
- Bad: artworks without a period vanish from the order by period; the count is the only sign of them.
- Bad: in masonry columns the last artworks of one period and the first of the next can sit side by side, so the rail's switch from one period to the next is gradual, not a line across the wall.
- Bad: the order needs the period values of every artwork, so the wall loads them with the artworks.

## More information

- Requested in the project thread "ATL-78 Sortowanie kolekcji po dacie powstania", 2026-10-12. Design: ATL-78; build: ATL-79.
- Mockups and the scrolling prototype were rendered on the wall with the sample artworks; they are in the project files under `atl-78/`.
- Filtering by fields stays in ATL-37 (R-19).
