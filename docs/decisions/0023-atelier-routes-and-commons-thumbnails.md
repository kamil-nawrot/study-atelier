# 0023. Address artworks by record number and load Commons thumbnails through the API

- Status: accepted
- Date: 2026-10-11

## Context and problem statement

Building the wall ([ADR-0021](0021-collection-view-as-a-wall-of-framed-artworks.md)) raised two questions the earlier decisions left open:

- Which URL opens one artwork? [ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md) puts adding at `/atelier/new` and leaves the detail route to ATL-40.
- How does the wall load Wikimedia Commons images? `Special:FilePath` URLs redirect once per image, and the wall needs image proportions before the images load. Commons limits requests per address, and much more strictly for clients that do not identify themselves.

## Decision drivers

- A URL the learner can read and share with themselves.
- Few requests to Commons, so a wall of a few hundred artworks stays well under its rate limits.
- No personal data in requests to other services.
- The MVP stays small.

## Considered options

For the artwork URL:

1. The record number, `/atelier/42`
2. The internal id, `/atelier/<uuid>`

For Commons images:

1. `Special:FilePath` URLs at the fixed thumbnail widths, proportions from the Commons API
2. Thumbnail URLs and proportions from one Commons API request, `Special:FilePath` only as a fallback
3. Option 2 with the answers cached for the browser session

## Decision outcome

Chosen options: the record number, and Commons thumbnails from the API without a cache.

- Routes: the wall is `/atelier`, one artwork is `/atelier/<record number>` (for example `/atelier/42`), adding is `/atelier/new` and the trash is `/atelier/trash`. Record numbers are never reused ([R-2](../product/requirements.md#artworks)), so a URL keeps pointing at the same artwork.
- The wall asks the Commons API (`prop=imageinfo`) for the size and a 500 px thumbnail URL of every Commons image, up to 50 files per request. The `srcset` comes from that URL with the other fixed Commons widths, up to the original width.
- Every request to Commons sends an `Api-User-Agent` header naming the app and the repository URL. It never carries personal data.
- After a 429 or a network error the request is retried once, after `Retry-After` (at most 5 seconds). If Commons still does not answer, the wall uses `Special:FilePath` URLs and a 4:5 size, so every image still shows.
- There is no cache between page loads.
- Once ATL-40 stores image sizes with each artwork, the wall keeps the Commons request for the thumbnail URLs only, so this decision narrows the image size point in ADR-0022: the wall no longer needs Commons for proportions, but still asks it for URLs.

### Consequences

- Good: one request per 50 images, and images load without a redirect.
- Good: the record number in the URL matches the number on the tile.
- Bad: each visit to the wall asks Commons again.
- Bad: a record number is per learner, so the URL only makes sense when signed in.
- Bad: without an answer from Commons, proportions are guessed and the columns may jump once real sizes are known later.

## More information

- Implementation: ATL-38 (`apps/web/src/lib/images/commons.ts`, `apps/web/src/lib/collection/artworks.ts`).
- Supabase returns at most 1000 rows per request; paging the wall is left for later.
