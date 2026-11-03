# 0167. Load the whole collection only in views that show it

- Status: accepted
- Date: 2026-11-02

## Context and problem statement

[ADR-0042](0042-filter-the-collection-in-the-browser.md) loads the whole collection and filters it in the browser, which suits the wall: it shows every artwork and filters at once. Other views reused the same load to show a few artworks: a value page shows the artworks of one value, a glossary entry the artworks with its pins, a visit the artworks seen on it. On a cold start each of them waits for every page of the collection, with its values, images and visits, to show a handful of tiles. The data model plan of ATL-403 states the rule that a view takes its narrowing parameter to the database. How do these views get their artworks?

## Decision drivers

- A view that shows a few artworks does not wait for the whole collection.
- The tiles look the same everywhere: the same columns, images and order as the wall.
- No new database function where a filter of PostgREST does.

## Considered options

- Keep reading the whole collection, kept in memory after the first load ([ADR-0157](0157-keep-the-collection-and-card-index-in-memory-between-views.md))
- Read only the artworks the view shows, in the columns of the wall, filtered by PostgREST
- A database function per view

## Decision outcome

Chosen by the owner as steps Z4 and Z5 of the data model plan of ATL-403: read only the artworks the view shows, in the columns of the wall.

- `wall-data.ts` builds the query of the wall once and adds a filter: `loadArtworksById(ids)` for a glossary entry (the artworks of its pins) and a visit (its artworks), `loadArtworksOfValue` for a value page, by the era code for an era and by the value id for every other kind (an inner embed of `artwork_values`). Artworks in the trash stay out, as on the wall.
- These answers are not kept in the cache; the whole collection still is, for the wall, the timeline, the review and the chronicle.
- A value page loads the note links only when its notes contain a link; until note links come from the database (M1 of the plan), that load still reads the collection's numbers and titles.
- A database function per view was set aside: the filters of PostgREST do the same with no migration.

### Consequences

- Good: a value page, a glossary entry and a visit show their artworks after one small request instead of every page of the collection.
- Bad: moving from the wall to one of these views reads its artworks again even when the whole collection is already in memory.
- Bad: the count of a value comes from the card index and its artworks from their own request, so after a write in another tab they can differ until the next load.

## More information

- Amends [ADR-0042](0042-filter-the-collection-in-the-browser.md): the whole collection is loaded only by the views that show all of it; filtering the wall stays as it is.
- Steps Z4 and Z5 of the data model plan, issue ATL-403.
