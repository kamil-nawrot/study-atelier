# 0157. Keep the collection and the card index in memory between views

- Status: accepted
- Date: 2026-10-29

## Context and problem statement

Every visit to the wall, the timeline, the review, the chronicle, a value page and a glossary entry with pins loads the whole collection again ([ADR-0041](0041-load-the-whole-collection-in-pages-of-1000.md)), and the card index costs four requests each time. [ADR-0052](0052-remember-wall-images-and-cap-their-width.md) kept the images in memory but read the artwork rows on every visit. With a few thousand artworks every move between views waits for several pages of rows. Can the app keep what it loaded while nothing has changed?

## Decision drivers

- A move between views does not load the collection again when nothing changed.
- A change made in this tab, or in another tab of the same browser, is seen at the next move.
- No new dependency and no server of our own ([ADR-0005](0005-no-custom-backend.md)).

## Considered options

- Keep loading on every visit
- A small cache of our own in the data layer
- TanStack Query
- A cache in Cloudflare in front of Supabase

## Decision outcome

Chosen by the owner: a small cache of our own, with the condition below.

- `lib/shared/data/data-cache/data-cache.ts` keeps the answers of `loadAtelier` and `loadCardIndex` in the memory of the tab, for the signed-in learner only; a failed answer is not kept, and a reload of the page empties it.
- Every write in a data file that changes artworks, values, own fields, visits or the whole atelier calls `forgetCached()`, which also tells the other tabs of the browser through a `BroadcastChannel`.
- A tab hidden for more than 10 minutes forgets the cache when it is shown again, so a change made on another device is seen after a longer break.
- TanStack Query was set aside as a new dependency touching about three times as many files; a Cloudflare cache does not see the requests to Supabase and would have to keep private, per-learner answers apart.

### Consequences

- Good: the second visit to any of these views needs no request for the collection or the card index.
- Bad: a change made on another device while this tab stays visible is seen only after a write here, a reload or a longer break.
- Bad: a new write that forgets to call `forgetCached()` leaves an old collection on screen.

### Condition

The owner accepted the cache on trial. If it brings no measurable gain in loading, or it makes the code or the behaviour harder (stale data, missed `forgetCached()` calls), it is removed and the loaders read on every visit again.

## More information

- Issue ATL-154. Replaces the point of ADR-0052 that the artwork rows are read on every visit; the rest of ADR-0052 stands.
