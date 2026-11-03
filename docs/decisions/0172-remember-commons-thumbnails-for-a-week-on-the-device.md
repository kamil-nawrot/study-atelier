# 0172. Remember Commons thumbnails for a week on the device

- Status: accepted
- Date: 2026-11-03

## Context and problem statement

The wall shows a Commons image through a thumbnail URL that it asks the Commons API for, in batches of file names. `ResolvedImages` kept these URLs only while the page was open, so every visit asked Commons again for every tile, and a large collection risks the API's 429 answers. Signed URLs of own images are already kept on the device ([ADR-0141](0141-cache-own-images-for-a-day-on-the-device.md)). Where are the thumbnail URLs kept, and for how long?

## Decision drivers

- A return visit to the wall does not ask Commons again.
- The stored file names tell which artworks a learner keeps; another learner on the same device must not get them.
- A thumbnail URL of a file rarely changes, but it can when the file is uploaded again on Commons.

## Considered options

- Keep the URLs in `localStorage` with the learner's id, for a week
- Keep them in `sessionStorage`
- Keep them only in memory, as before

## Decision outcome

Chosen as step T7 of the data model plan of ATL-403: `localStorage` with the learner's id, for a week.

- `ResolvedImages` stores the thumbnail URLs under `study-atelier:commons-thumbnails` the same way as the signed URLs: with the learner's id, merged with what another tab stored meanwhile, dropping the ones older than seven days when it loads or saves them. Signing out, or another learner signing in, clears them.
- Both stores share one shape, `{ learner, urls: { name: { url, at } } }`: the signed URLs stored before 0.17 under `signedAt` are dropped once and signed again.
- A tile whose stored URL no longer loads falls back as before; after a week the URL is asked for again.

### Consequences

- Good: a device asks Commons for each thumbnail about once a week instead of on every visit.
- Bad: a file uploaded again on Commons may show its old thumbnail for up to a week.
- Bad: `localStorage` holds about 150 bytes per Commons artwork of the collection.

## More information

- Issue ATL-428, step T7 of the data model plan (ATL-403).
