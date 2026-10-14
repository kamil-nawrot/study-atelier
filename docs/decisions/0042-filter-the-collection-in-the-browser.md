# 0042. Filter the collection in the browser, from a panel, with the filter in the URL

- Status: accepted
- Date: 2026-10-14

## Context and problem statement

The wall can be searched by title and ordered by era ([ADR-0033](0033-order-the-wall-by-period-with-a-period-rail.md), [ADR-0038](0038-chain-era-period-and-style.md)). R-19 asks for filtering by several fields at once, and the owner wants version 0.3 to cover filtering and ordering of the collection as a whole: every field of an artwork, multi-select for values and a range for the year. He also asked whether filtering and paging should move into the database.

Today `loadAtelier` loads every artwork in pages of 1000 rows ([ADR-0041](0041-load-the-whole-collection-in-pages-of-1000.md)) and the search, the grouping by era, the counts and the period rail are computed in the browser. Before the wall appears, the Commons thumbnails of all artworks are looked up in batches of 50, one batch after another, and the uploaded images are signed.

The spike ATL-116 proposed an answer; the owner decided the details in ATL-37.

## Decision drivers

- Filtering is part of learning: the learner looks at one era, one artist or one style side by side.
- The wall reacts at once; a filter never shows a half-loaded wall.
- The owner's collection has about 40 artworks and may reach a few thousand; the design must not need a rewrite at that size.
- No database change unless it pays off; migrations run only in CI and CI minutes are scarce.
- One mechanism on a phone and on a larger screen, built from the library ([ADR-0019](0019-encode-ui-standards-in-tokens-and-the-library.md)).

## Considered options

Where filtering runs:

1. In the browser over the whole loaded collection, as the search does today
2. In the database: a function returns one page of the filtered and ordered wall plus a count, another the counts per value, and the wall loads more pages while scrolling
3. In the browser now, with the filter as one serializable object that a database function could take later, and a stated point at which to move

Which fields and how values combine:

1. Every field: era, type, year, authors, period, style, material, location, plus a group of missing data (no image, no year, no era, no period, no type); any of the chosen values within a field, all fields together
2. The same, but a multi-value field can also require all chosen values
3. Only the fields of R-19

How the filters look:

1. A "Filtry" panel: on a larger screen a side panel next to the wall that changes it at once; on a phone the sort button becomes "Widok", a full-screen dialog with the order and the filters, closed with "Pokaż n dzieł"; active filters as tags above the wall
2. A row of drop-down buttons under the heading, one per field
3. A sentence above the wall ("Pokazuję obrazy z nowożytności, wszystkich autorów…") whose underlined words open the choices

Where the filter is kept: only in memory (as the search), on the device (as the order), or in the URL.

New orders: by author (blocks per first author, A to Z), by title, or none.

Other ways into a filter: values in the artwork view as links, a "show artworks" action in the card index ([ADR-0040](0040-manage-category-values-in-a-card-index.md)), saved filter sets.

## Decision outcome

Filtering in the browser with a database-ready filter (option 3), every field with "any of" within a field, the panel, the filter in the URL, a new order by author, links from the artwork view and the card index, and previous and next artwork that follow the filtered wall.

### Where filtering runs

Measured on synthetic collections in Node, with Postgres 18 in PGlite (WebAssembly) for the database side:

| Artworks | Wall data today (JSON) | Filter in the browser | Counts for every value | One page of 60 in Postgres | Counts in Postgres |
| -------- | ---------------------- | --------------------- | ---------------------- | -------------------------- | ------------------ |
| 500      | 383 KB                 | 0.1 ms                | 0.5 ms                 | 4 ms                       | 3 ms               |
| 5,000    | 3.9 MB                 | 1.5 ms                | 5 ms                   | 8 ms                       | 8 ms               |
| 20,000   | 15.6 MB                | 4 ms                  | 17 ms                  | 21 ms                      | 28 ms              |

Each database query also costs a round trip to the hosted project, estimated at 60–150 ms. In the browser every click updates the wall and every count at once; in the database each click waits for two or three queries, the order by era and the period rail need a third query for the bounds of every era, a jump on the rail needs every page before it, and the accent-insensitive search (`normalizeForSearch`) has to be rebuilt in SQL. That cost buys nothing at a few thousand artworks.

- The filter is one object (`eras`, `types`, `years`, `values` per category, `missing`) and one pure function decides whether an artwork matches. The same object can later be passed as `jsonb` to a database function without changing the interface or the URLs.
- The wall query also loads `type_code` and `author_unknown`. No migration is needed.
- Move filtering into the database (a new ADR superseding this one) when the collection passes about 5,000 artworks or the wall data takes more than 2 seconds to load on a phone.
- What slows a large wall today are the images, not the rows: the Commons lookups for every artwork before the wall appears. Looking up thumbnails only for tiles near the screen, and rendering the wall in parts, is a separate issue and is needed by option 2 too.

### Fields

| Field                   | Control                                        | Values                                                                                             |
| ----------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Era                     | the six era tiles of the form, several at once | fixed list                                                                                         |
| Type                    | tags                                           | the types present in the collection                                                                |
| Year                    | "od" and "do", each with "p.n.e."              | an approximate year counts as that year; artworks without a year are left out while a range is set |
| Authors                 | search and the most frequent values as tags    | "unknown author" is one of the values                                                              |
| Period, style, material | tags                                           | values used by artworks on the wall                                                                |
| Location                | search and the most frequent values as tags    | values used by artworks on the wall                                                                |
| Missing data            | check boxes                                    | no image, no year, no era, no period, no type                                                      |

- Within a field an artwork matches when it has any of the chosen values; it is shown when it matches every field that has a choice.
- Next to every value is the number of artworks the wall would show with it, counted with the other fields' filters but not with its own field's. Values with no artworks are hidden; chosen values always stay.
- Choosing an era therefore leaves only the periods and styles of that era, without a separate rule; the counts come from the artworks, not from the links of ADR-0038.
- The title search stays in the top bar and also matches authors ("Szukaj po tytule lub autorze").
- Notes are not filtered in this version: it would need every note in the browser or a new column.
- The search fields of authors and location show the 8 most frequent values with "Pokaż więcej".
- Requiring all chosen values of a field (option 2) is left out: rarely needed, and every control would need a switch.

### The panel

- Larger screen: a "Filtry" button with the number of active filters sits after the order select. It opens a panel at the right edge, under the top bar, that narrows the wall instead of covering it; the wall changes as soon as a value is chosen. The period rail is hidden while the panel is open. The panel ends with "Wyczyść" and the count "3 z 10 dzieł".
- Phone: the order button in the top bar becomes "Widok" (the Lucide icon `sliders-horizontal`, with the number of active filters). It opens a full-screen library `Dialog` with the order first and the filters under it, and "Wyczyść" and "Pokaż 3 dzieła" at the bottom.
- Above the wall, the active filters are tags with a remove button ("Epoka nowożytność ×") followed by "Wyczyść filtry". The count reads "3 z 10 dzieł", as during a search.
- When nothing matches, the message says "Żadne dzieło nie pasuje do tych filtrów." with a "Wyczyść filtry" button. Naming a filter whose removal shows artworks was considered and left out.
- The row of buttons (option 2) shows the filters without a click but takes a row above the wall for good and leaves most fields out of sight on a phone. The sentence (option 3) reads best but becomes hard to read with many values and is hard to make accessible.

### State, order and entries

- The filter is kept in the URL query (`?epoka=early_modern&typ=painting&rok=1400..1700&styl=barok`): it survives the way back from an artwork, a reload and a bookmark, and ends when the learner opens the atelier anew. Eras and types are codes, other values are names (unique per category); a name that no longer exists is ignored without an error.
- The order stays remembered on the device (R-41). Filters apply before the order; "Według epok" shows only the eras with results and the rail takes its bounds from the filtered artworks.
- A new order "Według autorów" groups the wall in blocks per first author, A to Z, by year inside a block, with the period rail showing the authors. An order by title is left out, because the search finds a title.
- In the artwork view, the era, period, styles, materials, location and authors become links to the wall filtered by that value. In the card index every value has "Pokaż dzieła (n)" that opens the wall filtered by it.
- The search in the top bar also matches authors ("Szukaj po tytule lub autorze").
- Previous and next artwork in the artwork view follow the filtered and ordered wall (ATL-65): subtle arrows at the edges of the stage, the arrow keys on a larger screen and a horizontal swipe on a phone; the arrow is dimmed at either end of the list. Saved filter sets are an idea for later.
- The texts are conversational, in the voice of [voice-and-tone](../product/voice-and-tone.md).

### Consequences

- Good: the wall and every count react at once, and the filter can move into the database later without changing what the learner sees.
- Good: the learner finds what is missing in their own data and fixes it, which continues the theme of 0.2.
- Good: no migration and no new database function.
- Bad: the first load still grows with the collection until the image work lands, and the switch to the database is a known later cost.
- Bad: a link with a renamed value loses that value silently.
- Bad: on a laptop the open panel leaves fewer columns for the wall.

## More information

- Spike ATL-116; design ATL-37 (owner's decisions). Proposed split: one build issue for the filters (model, panel, URL, every field, missing data, empty state), one for the entries and the order by author with search by author, and a chore for lazy Commons thumbnails and rendering the wall in parts.
- Requirements R-53 to R-61 replace R-19 and R-18.
- Mockups (rendered on the app with `pnpm screenshot --script`), the measuring script and the full analysis in Polish are in the project files under `filtering-0.3/`.
- Decided one question at a time by the owner in ATL-37 (2026-10-14).
