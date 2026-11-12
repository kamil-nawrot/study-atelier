# 0260. Show places on a drawn map and mark artworks to see

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

The atelier knows where its artworks are: 314 of the 333 artworks of the owner's production atelier on 2026-11-12 had a place, and the chronicle ([ADR-0128](0128-log-museum-visits-in-a-chronicle.md)) records which of them the learner has seen in person. Nothing shows this geographically, and nothing records the artworks the learner wants to see on a trip. A place is a `location` value with a name, a country and a type ([ADR-0057](0057-location-country-and-type-of-place.md)), but without a position: of 187 places only 9 came from the starter list of museums ([ADR-0075](0075-offer-a-starter-list-of-museums-in-the-place-field.md)), and their names mix museums, cities and sites ("Luwr, Paryż", "Rzym, Włochy", "Tum"). How should the learner see their places on a map and plan what to see next ([ATL-461](https://linear.app/kamil-nawrot/issue/ATL-461), [ATL-462](https://linear.app/kamil-nawrot/issue/ATL-462))?

## Decision drivers

- The map looks like the rest of the app: tokens, no tiles of a foreign style, no provider that can throttle or charge.
- A learner never types coordinates; a place gets its position from a suggestion or a click, and existing places are filled for them.
- The map answers two questions: where have I seen art, and where is what I still want to see.
- Marking an artwork costs one click and clears itself once the artwork is seen.
- The data model stores facts (a point, a Wikidata id), not names the app can derive.

## Considered options

- Kind of map: a drawn map from Natural Earth; a street map from a tile provider; an atlas list of countries and cities without a map.
- Where the map lives: an item of the menu; a tab of Kronika; a toggle of the wall; a separate view entered from the wall next to the statistics link.
- How a place gets its position: a Wikidata suggestion with a click on the map as fallback; a bundled list of cities; only a click on the map.
- How existing places get theirs: a one-off reviewed SQL file; a fill-in mode in the app only; both.
- What a city shows: a list of places; places with small thumbnails; big thumbnails.
- How an artwork is marked: a binoculars button next to the heart; a switch row above "Widziane na żywo".
- What a visit does to the mark: clears it; keeps it; a checkbox in the visit form.
- How the map shows the mark: filters above the map; a badge on city pins.

## Decision outcome

Chosen by the owner in ATL-461, one question at a time.

**Map.** A drawn map of land and borders from Natural Earth (`world-atlas` 50 m TopoJSON), projected with `d3-geo` and painted in token colours, bundled with the app. No tile provider: tiles do not fit the editorial look, and a provider can change its terms. A city is a circle with the number of its artworks, gold when one of them was seen in person, with the city name in Newsreader italic under it. The map fits the cities on it and can be zoomed and moved.

**Entry.** A separate view "Mapa" with a back arrow to the wall, like "Statystyki" ([ADR-0171](0171-show-statistics-of-the-collection-from-the-wall.md)). It is entered from a map icon right after the statistics link over the wall; there is no menu item and no toggle of the wall.

**Position of a place.** A place stores a point (latitude, longitude) and the Wikidata id of the place itself, both optional. The learner sets them on the place page with "Ustaw położenie": the app searches Wikidata for the place name (the part before a comma, then the whole name) and offers two or three hits with their description; when none fits, a click on the map sets the point without an id. The city is not stored: the app takes the nearest town of the Natural Earth populated places (with its Polish name) bundled with the map, because Wikidata's "located in" often names a district. A museum of the starter list carries its point and id, filled by the migration from Wikidata; choosing it copies both into the place. The starter list loses "Newgrounds", which is a website.

**Existing places.** The places of the production atelier are matched once to Wikidata by a script, reviewed by the owner in a table and written by a one-off SQL file after the release. Places added later, or left out by the review, are filled in the app: the map shows "{n} miejsc nie ma jeszcze na mapie" with "Uzupełnij położenie", a mode that walks through the places without a point one at a time, with the same suggestions and click.

**City.** Clicking a city opens a panel beside the map (under it on a phone): the country as an overline, the city in Newsreader italic, a count line, then each place with its type, its number of artworks and a row of small thumbnails, a gold dot on the artworks seen in person, and "Pokaż na ścianie", which opens the wall filtered by the places of the city.

**Want to see.** An artwork has a flag "Chcę zobaczyć na żywo", switched by a binoculars button next to the heart in the artwork's top bar. The wall filters by it with a toggle next to "Ulubione" and "Widziane na żywo". Saving a visit clears the flag of every artwork the visit holds, so the list shrinks as the learner travels.

**Map filters.** Above the map, "Wszystkie", "Chcę zobaczyć" and "Widziane na żywo", one at a time with their counts: a filter narrows both the circles and the panel to the artworks it names.

**Storage.**

- `location_details` gains `latitude`, `longitude` (both or neither, in range) and `wikidata_id` (a Q-id, independent of `catalogue_wikidata_id`).
- `catalogue_museums` gains `latitude` and `longitude`, not null; the migration fills them and deletes Newgrounds.
- `artworks` gains `want_to_see boolean not null default false`.
- `save_visit` copies the point and id of a starter museum with its country and type, and clears `want_to_see` of the visit's artworks in the same transaction.
- The export and import carry the new columns; an older export imports with no points and no flags.
- Merging two places keeps the point of the place that stays, or takes the other's when it has none.

### Consequences

- Good: the map costs no provider and looks like the app; it works offline once loaded.
- Good: most places get their point without the learner, and the rest take two clicks each.
- Good: the want-to-see list maintains itself through visits.
- Bad: the bundled geography adds about 0.3 MB, loaded only with the map view.
- Bad: a place named after a whole city or region gets the point of that city; the map cannot tell a museum from its town.
- Bad: Wikidata suggestions depend on a foreign service; without it only the click works.

## More information

Design issues [ATL-461](https://linear.app/kamil-nawrot/issue/ATL-461) and [ATL-462](https://linear.app/kamil-nawrot/issue/ATL-462); requirements R-255 to R-264; access patterns R33, W27 and W28 and model change M9 of the [data model](../data-model/coverage.yaml). Mockups `atl-461/*-both.png`, texts `atl-461/teksty.md` (set b) and the matching of existing places `atl-461/dopasowanie-miejsc.md` in the project files. Reviewing the starter list of museums is [ATL-680](https://linear.app/kamil-nawrot/issue/ATL-680).
