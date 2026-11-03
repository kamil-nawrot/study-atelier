# 0173. Preload only the core of the next artwork

- Status: accepted
- Date: 2026-11-03

## Context and problem statement

[ADR-0048](0048-flip-through-the-wall-from-the-artwork-view.md) preloads the data of the next artwork so that flipping forward does not wait for the database. The preload ran the whole page load of the next artwork: the record, the pins, the value summaries, the visits, the mentions and the link labels. The measurement after 0.16 (ATL-430) counted 13 requests for a cold opening without the preload and 18 with it, so the preload made every opening cost about five requests more, also when the learner never flips. Which part of the next artwork is worth reading in advance?

## Decision drivers

- Flipping forward shows the next artwork without waiting for its record and image.
- An opening that is never followed by a flip costs as few requests as possible.
- A preloaded artwork never shows data older than a write the learner made.

## Considered options

- Preload the whole page load, as before
- Preload only the artwork record
- No preload

## Decision outcome

Chosen by the owner in ATL-430: preload only the artwork record, and leave the wall payload as it is (T13 dropped).

- The artwork view asks `preloadArtwork(next)` for the next artwork of the wall. It starts `loadArtwork` for that record number and keeps one such read for a minute.
- The page load of an artwork takes the preloaded read when its number matches and it is younger than a minute; the read is used once. The pins, the value summaries, the visits, the mentions and the link labels are read when the artwork opens, in parallel as before.
- Every write the data cache notes, in this tab or another one, forgets the preloaded read.

### Consequences

- Good: an opening costs one request more (two when the next artwork has own images, whose URLs are signed) instead of about five, and a flip still finds the record and the URLs of its own images ready.
- Bad: after a flip the pins, the notes' links and the side panel wait for their own requests.

## More information

- Issue ATL-430, step T4 of the data model plan (ATL-403); amends the last bullet of ADR-0048.
