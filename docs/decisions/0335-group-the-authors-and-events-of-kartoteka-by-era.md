# 0335. Group the authors and events of Kartoteka by era

- Status: accepted
- Date: 2026-11-20

## Context and problem statement

The tab "Okresy i style" of Kartoteka stands on the axis of the six eras, which fold ([ADR-0240](0240-fold-eras-and-periods-in-the-timeline-tab-of-kartoteka.md)), but "Autorzy" and "Wydarzenia" are flat lists. The owner asked whether these two tabs could be grouped by era as well, what happens to an author who worked in two eras and to an event that crosses an era bound, and what it costs the database.

Neither an author nor an event stores an era. An author has optional years of life (`author_details`) and is linked to artworks, each with an `era_code` and a year span. An event has `year_to` and an optional `year_from`. The era bounds are the learner's ([ADR-0191](0191-let-the-learner-change-the-era-bounds.md)) and are already loaded in the browser.

A read-only query on the owner's data on 2026-11-19 found 96 authors, each with artworks in exactly one era and none without artworks, 77 of them without any year of life, and 14 events (11 single years, 3 spans), none crossing a bound.

## Decision drivers

- One look for every tab of Kartoteka that orders values in time.
- No author or event disappears from an era it belongs to.
- No new query, and nothing a learner has to fill in.

## Considered options

The source of an author's era:

- the eras of the author's artworks;
- the years of life against the era bounds.

An author with artworks in several eras: under each of those eras; only in the era with most of their artworks; only in the era of their oldest artwork.

An event over an era bound: under every era it covers; in the era of its start; in the era of its end.

The grouping: always, with folding; a switch "Według epok" beside the sort.

The key of "Od najstarszych" and "Od najnowszych" for authors: the oldest artwork of the author in the era; the year of birth; the year of birth, else the oldest artwork.

## Decision outcome

Chosen by the owner in ATL-827.

- An author's era comes from the `era_code` of their artworks, since most authors have no years of life.
- An author with artworks in several eras stands under each of them, with the number of their artworks of that era, as a period linked to several eras does ([ADR-0240](0240-fold-eras-and-periods-in-the-timeline-tab-of-kartoteka.md)).
- An event stands under every era its years cover, as in Kalendarium ([ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md)). A year on a junction is the start of the later era, and an end year on it the end of the earlier one: an event of 1492 stands in nowożytność, an event of 1939–1945 only in nowoczesność.
- Both tabs are always grouped, with no switch, and look and fold like "Okresy i style": the era markers on the vertical line, the era name as a link to the era page and its years in a badge, a chevron at the right of an era. Records are the bold rows of the other tabs with the count or the date at the right and the event's kind icon after its name. Every era is unfolded at first and the folding is remembered in the browser per tab; a search keeps only the eras with a match, or whose name matches, and unfolds them.
- An unfolded era without records says "Żaden autor nie ma jeszcze dzieła z tej epoki." or "Nie ma jeszcze Twoich wydarzeń z tej epoki.".
- Authors with no artwork that has an era stand after the axis under the heading "Autorzy bez dzieł z epoką", like "Okresy bez epoki". Every event has a year, so events always have an era.
- "Od najstarszych" and "Od najnowszych" order the authors of an era by the start of the date of their oldest artwork in that era, the key "Okresy i style" uses since ATL-820; authors without a dated artwork in the era go last, by name. The years of life are not used. Events keep their key, `year_from`, else `year_to`. The eras follow the order: "Od najnowszych" starts with współczesność. "Według nazwy" and "Według liczby dzieł" order the records inside each era, the count being the artworks of that era.
- `card_index()` returns `author_eras`: one row per author and era of their artworks with the number of those artworks and the oldest year, counting the trash like the other counts of Kartoteka. The eras of events are computed in the browser from the learner's bounds.

### Consequences

- Good: the three tabs in time read alike, and the axis shows where a learner's authors and events sit.
- Good: the cost is one grouped aggregate in the function the tab already calls, no new request.
- Bad: an author or event that crosses eras is listed more than once, so the rows of a tab no longer add up to the number of authors or events.
- Bad: the authors are no longer one alphabetical list; finding one by name relies on the search.
- Bad: an author whose artworks have no era is set apart even when their years of life would place them.

## More information

Design issue [ATL-827](https://linear.app/kamil-nawrot/issue/ATL-827), built in the same pull request. Query `atl-827/dane-epoki.sql` and screenshots `atl-827/autorzy-both.png` and `atl-827/wydarzenia-both.png` in the project files. The grouping lives in `card-index/era-groups/era-groups.ts` and the axis of flat records in `CardIndexEraRecords`.
