# 0041. Load the whole collection in pages of 1000 rows

- Status: accepted
- Date: 2026-10-13

## Context and problem statement

The wall and the trash fetch every artwork in one request. Supabase returns at most 1000 rows per request (`max_rows` in `supabase/config.toml`), so a collection above 1000 artworks would lose its oldest ones from the wall without any message. [ADR-0023](0023-atelier-routes-and-commons-thumbnails.md) left paging "for later". The owner expects a few thousand artworks in the long run. How does the app load a collection larger than one response?

## Decision drivers

- No artwork disappears from the wall without a message.
- The order by period, the period rail, the counts and the search by title keep working on the whole list in the browser ([ADR-0033](0033-order-the-wall-by-period-with-a-period-rail.md)).
- A small change now; the larger work waits until the collection really needs it.
- Images are already loaded lazily, so the number of artworks is not the number of image downloads.

## Considered options

1. Fetch every row in pages of 1000 with `range()` in a loop, and keep ordering, grouping and search in the browser
2. Real paging with loading on scroll, with the order, the search and the counts computed in the database
3. Keep one request and only warn when exactly 1000 rows come back

## Decision outcome

Chosen option: 1, because it removes the cut-off with the smallest change and keeps every view as it is.

- `loadAtelier` and `loadTrash` in `#lib/collection/artworks.ts` ask for `range(from, from + 999)` until a page has fewer than 1000 rows. The rows are ordered by `created_at` (or `deleted_at` in the trash) and then by `id`, both descending, so pages never overlap or skip a row.
- If any page fails, the load fails as a whole with the usual message, so the wall never shows a partial collection as the full one.
- The page size is the same as the server's `max_rows`; lowering `max_rows` in the project settings below 1000 would stop the loop early.
- Option 2 is revisited when the load becomes visibly slow. Before that, loading Commons thumbnails and signing uploaded images in parts, only for what is near the screen, is the cheaper improvement (see the follow-up ideas in Linear).

### Consequences

- Good: a collection of any size is shown completely; the wall, the rail, the search and the counts do not change.
- Good: no database change and no new dependency.
- Bad: the first load grows with the collection. The Commons thumbnail lookups (50 files per request, one after another) and one signing request for uploaded images still run before the wall appears, so a few thousand artworks may show the loading state for several seconds.
- Bad: the whole list sits in memory and every tile is in the DOM, which is acceptable for a few thousand artworks.

## More information

- Implementation: ATL-105.
- The 1000-row note in ADR-0023 is superseded by this decision; the rest of ADR-0023 stands.
