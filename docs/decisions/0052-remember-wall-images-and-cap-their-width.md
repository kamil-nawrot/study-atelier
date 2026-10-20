# 0052. Remember the wall images for the session and cap their width

- Status: accepted
- Date: 2026-10-14

## Context and problem statement

[ADR-0023](0023-atelier-routes-and-commons-thumbnails.md) keeps no cache between page loads, and [ADR-0044](0044-load-wall-images-near-the-screen.md) resolves the images of tiles near the screen once per load. Measured on 2026-10-14 (ATL-126):

- Going from the wall to an artwork and back asks the Commons API again for every tile near the screen, and signs the uploaded images again.
- The Commons API answers the app's `imageinfo` request with `cache-control: private, must-revalidate, max-age=0`, so the browser never reuses it. With `maxage` and `smaxage` it answers `public, max-age=<seconds>`.
- Commons thumbnails have no `Cache-Control`, only `Last-Modified` and `ETag`, so the browser keeps them for a heuristic time and then revalidates.
- On a phone (DPR 3) a wall tile of 342 px picks the 1280 px thumbnail (about 980 KB for one sample image) where 960 px (about 517 KB) is already sharp, because the `srcset` goes up to the stored width.
- Commons answers 429 after a few quick requests.

How does the wall spend fewer requests and less data when the learner returns to it?

## Decision drivers

- No request to Commons for an image the app already resolved.
- Fresh artwork data after an edit, a move to the trash or a restore.
- Sharp tiles on high-density screens.
- No new service and no proxy ([ADR-0005](0005-no-custom-backend.md), [ADR-0006](0006-zero-cost-hosting.md)).

## Considered options

For returning to the wall:

1. Remember the resolved images in memory until the page is reloaded, and read the artwork rows on every visit
2. Option 1, and also keep the artwork rows until an artwork is saved, moved to the trash or restored
3. Only let the browser cache the Commons API answer

For the largest wall thumbnail: 960 px, 500 px, or no limit.

For how long the browser keeps the Commons API answer: 1 hour, 1 day or 7 days.

## Decision outcome

Chosen options: 1, 960 px and 1 day. The owner chose them from the measurements in ATL-126.

- `ResolvedImages` (`#lib/collection/resolved-images.ts`) keeps the Commons thumbnail URL of each file and the signed URL of each uploaded path with the time it was signed, for as long as the page is open.
- `loadAtelier` gives an artwork whose image is remembered its image at once, so the tile has a `src` without waiting for `ImageQueue`. A signed URL is remembered only until it expires (`SIGNED_URL_SECONDS`); after that the tile resolves it again.
- `resolveImages` looks up only the files and paths it does not remember and remembers what it gets. A file Commons did not answer is not remembered, so the next visit asks again. `refreshExpiredImages` remembers the new URLs.
- The artwork rows are read on every visit, as before.
- The Commons `imageinfo` request sends `maxage=86400` and `smaxage=86400`, so the browser reuses the answer for a day. The same request serves the image search dialog, so its licences and attributions may also be a day old. A file replaced on Commons shows at the latest a day later.
- The wall offers Commons thumbnails up to 960 px, and never wider than the stored width.

### Consequences

- Good: going back to the wall sends no request to Commons for images already shown, and uploaded images are not signed again within their hour.
- Good: a phone loads about half the data per Commons tile.
- Bad: the memory grows with the number of resolved images until the page is reloaded; a few thousand short strings are acceptable.
- Bad: the memory is not cleared on sign-out. It holds public Commons URLs and signed URLs of paths under the learner's own folder, which another learner's rows never name.
- Bad: on a phone a 960 px thumbnail is slightly softer than 1280 px at DPR 3.

## More information

- Implementation: ATL-126.
- Numbering: accepted as 0046 (#119) and later filed as a second 0047; it got the next free number, 0052, in ATL-128 so that every ADR has its own number. The decision is unchanged.
- Supersedes the "no cache between page loads" point of ADR-0023; the rest of ADR-0023 and ADR-0044 stands. `ImageQueue` still resolves each artwork once per load, and a remembered image simply needs no resolving.
- The Commons API now returns thumbnail URLs on `thumb.wikimedia.org` with `utm_*` query parameters; the `srcset` replaces only the width segment, so it works with both hosts.
