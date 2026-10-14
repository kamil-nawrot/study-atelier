# 0043. Show the wall first and load its images near the screen

- Status: accepted
- Date: 2026-10-14

## Context and problem statement

[ADR-0023](0023-atelier-routes-and-commons-thumbnails.md) looks up the Commons thumbnails (50 files per request, one request after another) and [ADR-0041](0041-load-the-whole-collection-in-pages-of-1000.md) signs the uploaded images before the wall appears. With a few thousand artworks the wall waits for dozens of requests, although the learner sees a few tiles. Every tile is also in the DOM at once. The filtering planned for 0.3 stays in the browser only if the wall stays fast on a long list. How does the wall show up quickly on a large collection?

## Decision drivers

- The wall appears as soon as the artwork rows are loaded.
- The period rail, the order by era, the search and the counts keep working on the whole list.
- Commons rate limits stay respected: batches of 50, no 429 retry beyond the existing one.
- Expired signed URLs keep refreshing as before ([ADR-0030](0030-loading-states-for-the-first-load-and-images.md)).

## Considered options

1. Keep waiting for every image lookup before showing the wall
2. Show the wall at once with loading tiles, resolve images in batches for tiles near the screen, and render tiles in parts
3. Resolve every image in the background after the wall is shown, without looking at the screen

## Decision outcome

Chosen option: 2, because it makes the first view independent of the collection size and spends no request on tiles the learner never reaches.

- `loadAtelier` returns the artworks from the rows alone. A tile whose image is still unknown has an `image` with the stored (or default) size and no `src`, so `ArtworkImage` shows the primed window ([ADR-0030](0030-loading-states-for-the-first-load-and-images.md)) at the right proportions, and a `pendingImage` that says which Commons file or uploaded path to resolve.
- `resolveImages` looks up the Commons thumbnails and signs the uploads of the artworks it is given. If Commons does not answer, the tile falls back to the redirecting file address as before.
- The wall reports an artwork when its tile comes within 1.5 screens of the viewport. `ImageQueue` collects such artworks for 100 ms and resolves them in batches of 50, one batch after another, each artwork once per load.
- The wall renders the first 60 artworks and another 60 each time its end comes within 1.5 screens. Columns are assigned in order, so tiles already shown never move when more are added. The wall keeps the number of rendered tiles in the page snapshot, so going back from an artwork restores the scroll position.
- The trash keeps loading its thumbnails before it appears: its rows are small 64 px thumbnails in a list that is normally short.

### Consequences

- Good: the wall appears after the row requests only; image requests grow with what is scrolled, not with the collection.
- Good: the DOM holds a few hundred tiles instead of all of them.
- Bad: a tile may show its loading window for a moment when the learner scrolls fast.
- Bad: the period rail measures the tiles that exist, so its progress inside the last rendered period is approximate until the rest is rendered.

## More information

- Implementation: ATL-112.
- Supersedes the timing of the thumbnail lookup in ADR-0023; the rest of ADR-0023 stands.
