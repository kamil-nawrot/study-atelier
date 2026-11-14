# 0282. Give a place its city and group the places of Kartoteka by country and city

- Status: accepted
- Date: 2026-11-13

## Context and problem statement

A place in Kartoteka cannot say which city it is in. The learner writes the city into the name ("Luwr, Paryż", "Rzym, Włochy"), or the map guesses it as the nearest Natural Earth town within 40 km of the place's point ([ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md)); trips find the "Na miejscu" places of their city the same way ([ADR-0275](0275-log-sightseeing-a-city-as-a-trip-in-the-chronicle.md)). Setting a point needs Wikidata or a click on the map, and the tab "Miejsca" is one flat list in which a city, a museum and a country stand side by side.

A read-only check of the owner's dev atelier on 2026-11-13 (176 places) found: 173 places without a type, 1 with a point, 2 with a country, and 21 names with a comma, 14 of them a museum or chapel followed by its city in Polish ("Musée d'Orsay, Paryż", 13 artworks). Imported places in English mix museums without a city (about 25), churches and chapels (about 7), monuments and sites (about 12), countries (13), regions (2), cities (about 7), districts (5) and bare rooms of a museum (6), such as "Hall VIII". Every place that is a country or a region holds a building, a site or a museum object whose real place is a city, a site or a museum (Koloseum under "Italy", Wenus z Willendorfu under "Austria").

The map bundles 7 342 towns of Natural Earth 10 m populated places, 24 of them in Poland. Each has a Polish name, a region and, for 98% of them, a Wikidata id. Of about 80 towns important for art history checked by hand, about a third are missing (Toruń, Padwa, Akwizgran, Trewir, Awinion, Arles, Chartres, Delft, Bamberg, Urbino, Orvieto, Asyż), while Rawenna, Siena, Brugia, Wersal, Haga and Watykan are there. GeoNames has 34 215 towns from 15 000 people, 70 030 from 5 000 (a table of 21 MB with trigram indexes) and 171 847 from 1 000 (48 MB), under CC BY 4.0, with namesakes within one country for 5 766 towns from 5 000 people.

How does a place get its city, where do cities come from, and how does Kartoteka show places by city?

## Decision drivers

- A city is at once a property of a place (the Louvre is in Paris) and a place of its own (the Eiffel Tower is seen in Paris, a trip goes to Paris).
- Kartoteka holds the learner's own values; whatever appears there should read as structure, not as stray records.
- The learner types as little as possible: one choice should give a place its city, its country and its spot on the map.
- No new provider that can throttle or charge, and no data the learner's atelier depends on that a later catalogue could invalidate.
- The map is drawn and simple; it needs no position finer than a city.

## Considered options

- What the city of a place points to: (5a) a town of the catalogue directly; (5b) the learner's own place of the type "Miasto", created when missing.
- How the tab "Miejsca" shows cities: a flat list as today; a hierarchy Kraj → Miasto → places like the timeline tab of eras and periods ([ADR-0240](0240-fold-eras-and-periods-in-the-timeline-tab-of-kartoteka.md)); a two-level type of place (a city or not, then a subtype).
- The catalogue of towns: (1a) Natural Earth as bundled today; (1b) Natural Earth plus a short hand-picked list of missing art towns; (1c) GeoNames from 5 000 people in a database table.
- Positions: a place in a city keeps its own point; a place has either a city or its own position.
- The map of the atelier ([ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md)), which now repeats Kartoteka: (A) a second view of the tab "Miejsca" behind a switch "Lista / Mapa", without its entry over the wall; (B) a separate view entered over the wall, without what Kartoteka now does; (C) the map as built, only reading the stored city.
- The existing places of production: the two planned one-off files (the points of ATL-461 and the city types of ATL-702) and a later correction into cities; one review that replaces both.
- Where cities are suggested: (7a) only where the app already holds a city, the place form and the trip form; (7b) also in new fields such as an author's place of birth or an artwork's place of making.
- Places that are not places (countries, regions, districts, bare rooms): a special type or rule; no rule, corrected as data.
- The place of an artwork that is a building or a site: a rule of the app; the learner's choice, with a rule only for correcting the existing data.

## Decision outcome

Chosen by the owner in ATL-711, one question at a time. 5b over 5a, because a city is a place of its own and trips already use city places; the hierarchy, because a city with no artworks of its own then reads as a group, like an era; 1a, because a missing town costs the learner one added value; 7a, because no other field holds a city today.

**The city of a place.** A place that is not of the type "Miasto" has an optional field "Miasto", which points to the learner's own place of the type "Miasto". A city place keeps the Wikidata id of its catalogue town in its own `wikidata_id`, so its name stays the learner's to change (the learner who prefers "Królewiec" renames it) while its position and country come from the catalogue. Choosing a catalogue town the atelier does not have yet creates the city place when the place is saved. Examples: Luwr, Muzeum, Paryż; Wieża Eiffla, Na miejscu, Paryż; Akropol, Na miejscu, Ateny; Lascaux, Na miejscu, no city.

**Either a city or a position.** A place has either a city or its own position, never both, and a check in the database keeps it so. A place of the type "Miasto" has a position (from the catalogue, else from Wikidata or a click on the map) and no city. A place without a city (Lascaux, Petra) may have its own position and is drawn as its own circle on the map, as today. A place with a city has no position and stands at its city. A place with a city cannot set a country of its own: the database keeps a copy of the city's country on the place, so the two cannot differ ([ADR-0057](0057-location-country-and-type-of-place.md)), and the exhibits, statistics, chronicle and Kartoteka that read a place's country count it. When the city is removed, the place keeps that country, shown and editable in "Kraj".

**The place form.** The field "Miasto" is the `ValueField` of the place field ([ADR-0075](0075-offer-a-starter-list-of-museums-in-the-place-field.md)): the learner's city places under "Już używane", the catalogue towns under "Z listy startowej", each with its country as the note and the region only when two suggestions share a name and a country, and "+ Dodaj „{nazwa}”" for a town missing from the catalogue (Tum). A town added this way has no country and no position until the learner fills them on its own page. Under a filled field stands "Na mapie w mieście {miasto}." and the form hides "Kraj" and the position editor; under an empty field stand "Kraj" and the position editor of the place form. Choosing a starter museum gives the place the catalogue town nearest to the museum's point as its city; with no town near (Miho Museum), the museum gets its own position. The museum suggestions of the position editor lose their use for museums and are revised when this is built.

**The catalogue.** Natural Earth stays the catalogue, as a static file loaded where it is needed (the map, the place form, the visit and trip forms), extended with the Wikidata id, the region and the original and English names: about 508 KB, 182 KB compressed, against 230 KB today. A suggestion shows the Polish name of Natural Earth; the search also matches the original and English names, so "London", "Munich" or "Roma" find Londyn, Monachium and Rzym. No historical names and no naming rule as in [ADR-0267](0267-keep-the-starter-list-of-museums-to-art-collections-under-one-naming-rule.md). Because a city place stores a Wikidata id, a larger catalogue later (GeoNames links to Wikidata too) adds suggestions without changing the learner's data. A short hand-picked list of missing art towns (1b) stays open, to be weighed while the existing places are corrected or later.

**The tab "Miejsca"** becomes a hierarchy modelled on [ADR-0240](0240-fold-eras-and-periods-in-the-timeline-tab-of-kartoteka.md):

- A country is a heading with its Polish name and a count, without a page, folded by a chevron at the right, like an era.
- A city is a bold row linking to the city page, with a count and a chevron at the left, like a period; unfolded, its places are lighter, indented rows with the icon of their type, like styles.
- A place without a city stands at the level of the cities with the icon of its type and the room of the chevron empty, sorted together with the cities.
- A country and a city count every artwork assigned to them directly or to their places, like a city circle on the map, so the places of an unfolded city may sum to less than the city.
- "Według nazwy" and "Według liczby dzieł" sort every level separately; "Według kraju" leaves the tab.
- Countries are unfolded and cities folded at first, and the folding is remembered in the browser.
- The search matches countries, cities and places, shows the path to every hit and unfolds it for the search: "Orsay" shows Francja, Paryż and Musée d'Orsay.
- "Miejsca bez kraju" closes the tab under a hairline, with a small-capitals heading like "Okresy bez epoki", holding places with neither a country nor a city and city places without a country with their places.

**The city page** keeps the layout of every value page and gains "Miejsca w tym mieście", its places in the rows of the tab. Its wall, "Dzieła z tego miasta", shows every artwork of the city, assigned to it directly or to its places, so its count matches the tab and the map; the owner sees this as the pattern of an era page, which shows every artwork of the era whatever its period or style. Its visits are the trips to the city and the visits to its places. A place in a city shows its city as a link in the type line ("Muzeum · Paryż, Francja"), and the map of a place page has no caption, since the type line already names the city.

**Trips.** A trip preticks the artworks of its city place and of the "Na miejscu" places with that city, with no distances; the trip form suggests cities like the field "Miasto".

**The map** stays a separate view (B), because it is the view for planning what to see, while Kartoteka is where places are kept in order:

- It keeps its entry over the wall, its geography and the filters "Wszystkie", "Chcę zobaczyć" and "Widziane na żywo".
- Its circles are the stored cities; a place with a city stands at its city, and a place without a city but with its own position is its own circle, as today.
- A click on a circle opens the city panel, now read-only. The city name in its heading links to the city page, and under the summary line stands the text link "Pokaż w Kartotece →". "Pokaż na ścianie →" is the same kind of text link at the bottom of the panel instead of a button. The places of the panel are the stored places of the city, with a row for the city itself when artworks are assigned to it.
- The mode "Uzupełnij położenie" and the line "{n} miejsc nie ma jeszcze na mapie" leave the map: they repeat the place form, the existing places are corrected once (below), new places get their city in the form, and places without a country stand under "Miejsca bez kraju".

**The existing data.** Neither the points of ATL-461 nor the city types of ATL-702 have been run on production, so the two planned one-off SQL files are replaced by one review after the 0.23 release: every existing place gets either its city (matched to the catalogue, the city split out of names like "Luwr, Paryż", city places linked to the catalogue and given the type "Miasto") or its own position when no town is near.

**Storage, merging and deleting.**

- `location_details` gains `city_id`, a reference to a place of the same owner of the type "Miasto"; a check keeps `city_id` and a point apart, and a place with a city stores a copy of its city's `country_code`, kept in sync by the database (corrected on 2026-11-14, ATL-739: the decision stays, only how it is stored is described).
- The export carries `city_id`; the import creates every place first and sets the cities after; an older export imports without cities.
- Merging two cities moves the places of the merged one to the kept one ("Miejsca w „{merged}” ({n}) przeniosą się do „{kept}”."). Merging a city that has places into a place of another type is refused ("To miasto ma swoje miejsca. Możesz je połączyć tylko z innym miastem."), and so is changing the type of such a city ("To miasto ma swoje miejsca, więc musi zostać miastem. Najpierw zmień miasto tych miejsc.").
- On a merge the kept place keeps its city or its position; with neither it takes the other's city, else the other's position.
- A city with places counts as used and cannot be deleted, like a value with artworks ("To miasto ma jeszcze {n miejsc}, więc nie da się go usunąć. Możesz je połączyć z innym miastem.").

**Places that are not places** get no rule of their own: countries, regions, districts and bare rooms are data to correct with the existing places (a district gets its city, a region its country). Until corrected, each stands where its country and city put it, and with neither under "Miejsca bez kraju". A real place known only by its country is an undisclosed private collection, a place of the type "Kolekcja prywatna" with a country. The app has no import that takes the place of an artwork from Wikidata, so these places came into the collection another way and there is no import bug to fix.

**A building or a site as an artwork.** The app sets no rule: the city and a place "Na miejscu" are both valid. When the existing places are corrected, a building in a city gets its city (Koloseum → Rzym, Pałac wersalski → Wersal), a site outside a city gets its own place "Na miejscu" with its country (Petra), and an own place in a city is worth it only when one building holds several artworks (Kaplica Sykstyńska). A building that houses a museum is an artwork with its city plus a separate place of the type "Muzeum": a trip preticks the building, a visit to the museum holds its collection. Linking the two is the idea ATL-712.

### Consequences

- Good: one choice gives a place its city, country and spot on the map, and most places reach the map without a point of their own.
- Good: the tab "Miejsca" reads like the timeline tab, and a city with no artworks of its own is a group, not a stray record.
- Good: trips and the map read a stored fact instead of a distance, so a museum on the outskirts and a district no longer fall into the wrong town.
- Good: the catalogue costs no provider and no table, and can grow later without touching the learner's data.
- Bad: about a third of the art towns checked are missing from Natural Earth, and the learner adds them with "+ Dodaj"; such a town has no country and no position until filled in.
- Bad: a place in a city stands at the city centre on the map, and the own points of places that get a city are dropped.
- Bad: a city page gathers artworks and visits through its places, one more query than a page of a value that artworks hold directly.
- Bad: the catalogue is a snapshot of Natural Earth, like the starter list of museums.

## More information

Design issue [ATL-711](https://linear.app/kamil-nawrot/issue/ATL-711); the numbers and the texts are in its comments, the mockups in `tmp/mockups/atl-711/` of the owner's machine. Requirements R-286 to R-296; model change M11, access patterns R35 and W32 of the [data model](../data-model/coverage.yaml). Partly supersedes [ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md) (the city of a place never stored, the rejected bundled list of cities, the caption under the map of a place page, the mode "Uzupełnij położenie", the line of places missing from the map, the button of the city panel and the one-off file of points) and [ADR-0275](0275-log-sightseeing-a-city-as-a-trip-in-the-chronicle.md) (the "Na miejscu" places of a trip found by distance and the one-off file of city types) and [ADR-0057](0057-location-country-and-type-of-place.md) (the country of a place with a city); builds on [ADR-0075](0075-offer-a-starter-list-of-museums-in-the-place-field.md) and [ADR-0240](0240-fold-eras-and-periods-in-the-timeline-tab-of-kartoteka.md). Built after ATL-709. Built in 0.23 with the map. The review of the existing places (splitting "X, Miasto", linking city places to the catalogue, turning points into cities, countries, regions, districts and rooms) is a follow-up issue after the 0.23 release, with the read-only queries of ATL-711 run on production; it replaces the one-off files of ATL-461 and ATL-702.
