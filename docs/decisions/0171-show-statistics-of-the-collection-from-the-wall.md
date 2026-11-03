# 0171. Show statistics of the collection from the wall

- Status: accepted
- Date: 2026-11-03

## Context and problem statement

The views show totals (the wall's count, the counts of the filter values, the card index sorted by the number of artworks), but nothing shows how the collection is spread across eras, types, styles or authors, nor how they relate. In a collection of a thousand artworks the learner cannot know that ancient sculpture is thin, so they cannot know which filters to try. The owner wants a view of the collection in numbers: charts, rankings and records of its current state. How much of it is worth building, what does it show, where does it live and where do its numbers come from?

## Decision drivers

- The view describes; the learner judges. It shows proportions without a reference canon, and neither praises nor urges: motivation stays in the career ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- A number leads to the artworks behind it on the wall, and the two always agree.
- A small collection sees a plain sentence, not empty or misleading charts.
- One narrow database call per view, within the data model plan of ATL-403 ([ADR-0165](0165-model-the-database-from-the-app-access-patterns.md), [ADR-0167](0167-load-the-whole-collection-only-in-views-that-show-it.md)).
- Readable for a learner with no technical background: nothing that reminds of a spreadsheet tool.

## Considered options

- Adjusting the view: a dashboard builder with tiles; a fixed set of sections with one adjustable cross-section.
- Narrowing: a filter for the whole view, the wall's panel, passed on from the wall; no filter.
- The cross-section: dropdowns and a cross table; tags and stacked bars; tags and a cross table.
- The way in: an item in the menu; the artwork count on the wall.
- The numbers: everything from the database; the counts about artworks in the browser from the collection the wall loads, the rest from one database function.
- Charts: a library (Chart.js, LayerChart); own components.

## Decision outcome

Chosen by the owner, in the spike ATL-434, on an interactive prototype with the owner's local collection (292 artworks).

**Sections.** The view "Statystyki" has a fixed set of sections; there is no builder.

| Section             | Shows                                                                                                                                                                                      | Shown                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Podsumowanie        | artworks, authors, places, artworks seen in person, glossary terms, timeline events, visits                                                                                                | always                                                                                    |
| Rozkład             | artworks by one dimension as bars ("pozostałe", "bez …" at the end), by two as a table with shaded cells and totals, 12 most frequent rows and 6 most frequent columns                     | from 20 artworks                                                                          |
| Na pierwszym planie | the top 10 authors, places, styles or materials, with the number of values that have one artwork                                                                                           | per tab, from 3 values with at least 2 artworks                                           |
| Powtórki            | the review start's groups (Utrwalone, W trakcie nauki, Nowe), correct quiz answers, the artworks reviewed most often and forgotten most often (FSRS lapses), the most stable artwork       | groups from 1 card, the share from 20 answers, a list from its first entry                |
| Do uzupełnienia     | the five gaps of the wall's "Do uzupełnienia" filter: image, year, era, period, type                                                                                                       | when something is missing                                                                 |
| Rekordy             | oldest, newest and longest-built artwork, longest-lived author, most versatile author (artwork types), most materials of one author, most pins on an artwork, most artworks from one visit | each record with its own condition; a tie shows the first by record number and "i n inne" |
| Jak rośnie atelier  | artworks added per day up to 30 days from the first, per week up to 26 weeks, per month after                                                                                              | from the first artwork                                                                    |

Below a threshold a section or a part says in one sentence when it will appear. Records repeat nothing a chart shows; an artwork links to its page and an author to the value page.

**Cross-section.** Two rows of tags, "Grupuj dzieła według" (Typ, Epoka, Okres, Styl, Materiał, Autor, Miejsce and the own list fields) and "Dodatkowy wymiar grupowania" ("brak" and the other dimensions, so one dimension cannot be picked twice). A number opens the wall with the matching filter. Dropdowns read as a spreadsheet; stacked bars were tried and the owner preferred the table.

**No filter.** The view always describes the whole collection. A filter over every section needed exceptions per section (terms, events and visits are not artworks) and, for the reviews, either the wall's filter repeated in SQL or the review history loaded into the browser; the cross-section already shows the gaps that motivated the view, and the wall, one click away, has the filters.

**Way in.** No item in the menu, which keeps its seven modules. The artwork count in the wall header ("292 dzieła", "63 z 292 dzieł") and a Lucide `chart-column` icon after it become one button, "Statystyki, 292 dzieła", that opens the view for the whole collection; neither the wall's filter nor its search is carried. An empty wall has no count and no way in.

**Numbers.** A mixed model:

- The distribution, the rankings, "Do uzupełnienia" and the records about artworks and authors are counted in the browser from the collection `loadAtelier` gives the wall (the cached `atelier` key of [ADR-0157](0157-keep-the-collection-and-card-index-in-memory-between-views.md) and [ADR-0166](0166-forget-only-the-cache-keys-a-write-changes.md)); like the wall, the timeline, the review and the chronicle, the view loads the whole collection when the cache is empty, after a reload or a direct visit. The counts follow the wall's own data and rules, so a number matches the wall it opens, and the cross-section reacts at once.
- One database function, `collection_statistics`, called once per visit, returns aggregates only: the review groups, answers, lists and the most stable artwork; the additions per day, week or month; the counts of terms, events and visits; the records read from other tables (authors' years, pins, visits).
- Everything from the database was set aside: the counting rules would live twice, in SQL and in the wall's TypeScript, kept in step by an end-to-end test over every cell, and every change of the cross-section would be a request.

**Charts.** Own components in the `statistics` module, without a library: `BarList`, `CrossTable` (an HTML table) and `ColumnChart` (SVG). A library pays off for line, pie or interactive time charts, none of which the view has; Chart.js draws on a canvas a screen reader cannot read.

### Consequences

- Good: the gaps of a large collection show at once, and every number leads to its artworks.
- Good: one small request per visit; arriving from the wall needs no request for the collection.
- Good: the reviews section reuses the review start's groups and hints, so a term has one meaning.
- Bad: two artworks of different authors with the same name count as one author, as on the wall, because `WallArtwork.authors` holds names.
- Bad: the statistics depend on the collection's columns; a dimension the wall does not load (the country of a place) is not offered.
- Bad: a new section or record needs a change of the database function or of the browser counts, with its own threshold and texts.

## More information

- Spike ATL-434 with every decision and the accepted UI texts in its comments; the prototype is linked there.
- Built in ATL-436 (the database function), ATL-437 (the view, the summary and the way in from the wall), ATL-438 (the distribution and the rankings), ATL-439 (the reviews and how the atelier grows) and ATL-440 (what is left to fill in and the records).
- The tests name the boundary cases: an artwork with several styles, without an era or a type, in the trash, with "Autor nieznany", with an own multi-value list field.
