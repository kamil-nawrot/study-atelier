# 0275. Log sightseeing a city as a trip in the chronicle

- Status: accepted; the "Na miejscu" places of a trip found by distance are superseded by [0282](0282-give-a-place-its-city-and-group-the-places-of-kartoteka-by-country-and-city.md)
- Date: 2026-11-13

## Context and problem statement

A visit in the chronicle ([ADR-0128](0128-log-museum-visits-in-a-chronicle.md)) has one place and one date, and its form preticks only the artworks set on exactly that place. Seeing a city over several days does not fit: a visit to "Florencja" offers no artwork of its churches entered as places of their own, and five days of walking become five visits or one visit with a wrong date. Cities are not rare places: of the 188 places of the owner's production atelier on 2026-11-12, 86 were cities or towns in Wikidata and 49 were museums, galleries or libraries. Since the map ([ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md)) a place can have a point, so the app can tell which places lie in a city.

How should the chronicle record sightseeing a whole city, apart from the visits to its museums?

## Decision drivers

- Visits to museums and galleries stay exactly as they are.
- A city seen over several days is one entry, and the museum visits of those days stay recognisable as part of it.
- The data model stores facts: a trip, its dates and which visits belong to it, not links derived again on every read.
- A trip counts wherever seeing art in person counts, without copying every count for a second table.
- The form never offers a choice the learner cannot keep consistent.

## Considered options

- Shape: a visit with an end date; a trip as its own entry that groups visits; only city-wide suggestions for one-day visits.
- Scope of a trip: one city; a journey through several cities with stages; one city with an optional shared name for a journey.
- How a visit joins a trip: derived from its date and city; preselected in the visit form and stored; picked by hand only.
- What the city of a trip is: any place of the card index; a city from the bundled map; a place with a new place type "Miasto".
- How existing cities get that type: a one-off reviewed SQL file after the release; by hand in the card index; both with a prompt in the form.
- Which artworks the trip form preticks: those of the city and of the "Na miejscu" places in it; only those of the city; all places of the city with only the city ticked.
- Dates: from and to by day, or one approximate month or year; always exact days; a start and a number of days.
- Counting: like a visit with stated exceptions; only as seen in person; like a visit plus a new exhibit.
- Storage: the `visits` table with a kind; separate tables for trips and their artworks.
- Release: 0.24 as its theme; still 0.23; an idea for later.
- List: visits indented under the trip ticket; a band with the city over the tickets; a flat list with "W ramach podróży" under a visit.
- Mark of a trip ticket: a gold top edge and gold dates; a gold overline with the length; an offset outline like a stack of tickets.
- Adding: one form with a choice of the kind of entry; a separate "Dodaj podróż" button and form.

## Decision outcome

Chosen by the owner in ATL-700, one question at a time.

**A trip.** Kronika holds a second kind of entry, "Podróż": a stay in one city combined with sightseeing. It has a city, dates, a note and its own artworks, the ones seen around the city outside museums. A journey through three cities is three trips. Museum and gallery visits are unchanged.

**The city.** A place gains the type "Miasto" (icon `building-2`) next to "Muzeum", "Galeria", "Kolekcja prywatna" and "Na miejscu". "Na miejscu" stays one object seen as a whole (a church, a cave, a temple complex, a site); "Miasto" is a whole town, the target of a trip. A trip accepts only a place of the type "Miasto". The existing city places of the production atelier get the type from a one-off SQL file reviewed by the owner and run after the release, like the points of [ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md); archaeological sites stay "Na miejscu".

**Visits in a trip.** A visit may belong to one trip. The visit form shows "Część podróży" only when a trip covers the visit's date, preselects the trip of the same city, and offers the other trips and "Poza podróżą". The link is stored and does not depend on the map.

**Dates.** A trip runs from a day to a day; an empty end means one day. Without exact days a trip has one month or one year, as a visit does.

**Artworks.** The trip form preticks the artworks of the city place and of the "Na miejscu" places whose point lies in the city, found as on the map from the nearest bundled town; museums and galleries stay for their visits. A search adds any other artwork.

**Counting.** A trip counts like a visit: its artworks are seen in person, saving it clears their want-to-see mark and records the wish-seen event, its city counts among the places visited and its country among the countries, and "Fontanna di Trevi" counts its start date with its precision. "Siedmiomilowe buty" count only visits, as a trip is not one day.

**Storage.** `visits` gains `kind` (`visit` or `trip`, default `visit`), `ends_on` (a trip with exact days only, not before `visited_on`) and `trip_id` (a visit's trip, `on delete set null`, pointing only at a trip of the same owner). The artworks of a trip stay in `visit_artworks`, so every read of "seen in person" keeps working. `location_details.place_type` accepts `city`, and saving a trip at another place type is refused. A trip shares the limit of 1000 visits; the export and import carry the new columns, and an older export imports as visits.

**List.** The visits of a trip are indented under the trip ticket with a hairline. The trip ticket shows its dates as a range ("10–14 paź"), a gold overline "Podróż · {n} dni" ("Podróż · {miesiąc lub rok}" without exact days), the city, its type and country, the number of artworks seen and "{n} wizyty".

**Trip view.** The trip ticket with its count, the note, "Wizyty w czasie podróży" as small tickets leading to the visits, and the wall "Widziane na żywo podczas zwiedzania" with the trip's own artworks. Deleting a trip asks first, keeps its visits in the chronicle and the artworks in the collection.

**Form.** "Dodaj wpis" opens one form with the tiles "Wizyta" ("Pojedyncza wizyta w muzeum, galerii lub zabytku") and "Podróż" ("Pobyt w mieście połączony ze zwiedzaniem"); the fields below change with the choice. On a phone the shared "Dodaj" button of the bottom bar leads to the same form, so a second button would show only on a computer.

**Texts.** The texts are in the requirements. The visit form drops its first-person texts at the same time, as the app never speaks of itself in the first person ([voice and tone](../product/voice-and-tone.md)).

### Consequences

- Good: a city seen over days is one entry, and its museum visits stay visible under it.
- Good: every count of artworks seen in person, places and countries covers trips without a second table.
- Good: a trip names only facts the learner chose; the city of a "Na miejscu" place is derived only to suggest artworks.
- Bad: the place type "Miasto" overlaps "Na miejscu" for a town known for one building; the owner decides per place.
- Bad: a "Na miejscu" place without a point is not suggested in the trip form until it has one.
- Bad: one table holds two kinds of entries, so every query of visits that must not count trips ("Siedmiomilowe buty") has to filter by the kind.

## More information

Design issue [ATL-700](https://linear.app/kamil-nawrot/issue/ATL-700), builds [ATL-701](https://linear.app/kamil-nawrot/issue/ATL-701) and [ATL-702](https://linear.app/kamil-nawrot/issue/ATL-702); requirements R-274 to R-285; access patterns R34, W29 and W30 and model change M10 of the [data model](../data-model/coverage.yaml). Mockups `wizyty-miasta/makiety/*-both.png`, texts `wizyty-miasta/teksty.md` and the list of city places for the one-off file `wizyty-miasta/miasta-do-oznaczenia.md` in the project files.
