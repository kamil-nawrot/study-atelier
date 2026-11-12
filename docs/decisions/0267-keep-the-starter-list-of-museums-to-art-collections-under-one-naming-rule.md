# 0267. Keep the starter list of museums to art collections under one naming rule

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

The starter list of museums ([ADR-0075](0075-offer-a-starter-list-of-museums-in-the-place-field.md)) was taken from Wikidata in one query: art museums with at least 12 language editions. While designing the map ([ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md)) the owner found a website on it, "Newgrounds", and expected more problems of this kind. A review of all 721 entries against Wikidata (instance of, country, dissolution, labels) on 2026-11-12 found:

- entries that are not museums of art: a website, a sports club museum, a parliament, a sea cave, libraries, museums of palaeontology;
- institutions that no longer exist: Corcoran Gallery of Art, Deutsche Guggenheim, Tacheles, the National Gallery in Oslo, Al Qarara Cultural Museum, the Museum of Roman Civilization;
- 35 archaeological sites and ancient cities, such as Selinunt, Sybaris or Villa Romana del Casale;
- narrow or very small collections: animation, comics, glass, Easter eggs, posters, photography, design, local history, single works such as Panorama Racławicka;
- names in four forms at once: Polish Wikipedia labels, English labels for museums in non-English countries (154 of them, such as "Archaeological Museum of Chania"), originals, and hybrids such as "Museum of Fine Arts w Bostonie"; the city written in five different ways, or missing where the name is generic ("National Museum", "Narodowa Galeria Sztuki");
- most Polish museums of art missing, because Wikidata classes them as plain museums or palaces (the Royal Castle in Warsaw, Wawel, Zachęta, the National Museum in Gdańsk).

Labels and countries matched Wikidata, except Hong Kong Museum of Art, which had China while the app knows Hong Kong. One learner used nine entries, none of them among those to be removed. Which entries belong on the list, and how are they named?

## Decision drivers

- The list helps a learner of art history name where an artwork is or which exhibition they visited.
- One predictable form of name, so the learner can tell what to expect and two entries are not confused.
- The app shows the country next to every entry, so the name does not need it.
- A place a learner already took from the list stays theirs ([ADR-0075](0075-offer-a-starter-list-of-museums-in-the-place-field.md)) and is not offered a second time under a new name.

## Considered options

- Fix only the entries that are clearly wrong and keep the Wikidata labels.
- Keep museums with substantial art collections and give every name one form, the same for every source language.

## Decision outcome

Chosen option: "keep museums with substantial art collections under one naming rule", because the owner wants the list uniform and limited to places where art is studied.

**What stays on the list.** A museum, gallery or residence with a substantial collection of art, and a gallery without a permanent collection where exhibitions of art take place (Kunsthalle, Serpentine, Barbican), because a visit uses the same place field. Chapels with frescoes and single-artist museums with large collections (Van Gogh, Picasso, Rodin, Munch) stay. An umbrella institution and its part may both be on the list (Pałac Pitti and Galleria Palatina), as labels of artworks cite either.

**What leaves it.** An entry that is not a museum of art, an institution that no longer exists, an archaeological site or ancient city, a narrow collection (one craft, comics, photography, design, local history) and a small gallery in a historic building. The review was done by hand: counting the works per collection in Wikidata (P195) was not possible during a Wikidata outage on 2026-11-12.

**Polish museums.** The list gains 23 Polish museums with art collections that the first query missed: the national museums in Gdańsk, Szczecin, Lublin and Kielce, the Silesian and Upper Silesian museums, the District Museum in Toruń, the Lubomirski Museum, the royal residences and castle museums (Warsaw, Wawel, Wilanów, Łazienki, Malbork, Łańcut, Kozłówka, Pszczyna), Zachęta, Zamek Ujazdowski, Muzeum Współczesne Wrocław, the Centre of Polish Sculpture in Orońsko, the Gallery in Sukiennice and the church museums in Kraków and Pelplin. Museums of history, martyrdom or technology are not added.

**The naming rule**, the same for every source language:

1. A name fully in Polish when one exists: the Polish Wikipedia title with no foreign words, or the Polish institution's own name ("Luwr", "Ermitaż", "Muzea Watykańskie", "Muzeum Współczesne Wrocław").
2. A descriptive name, made only of generic words and a place, is translated into Polish, from English too: "Muzeum Sztuki w Cleveland", "Muzeum Sztuk Pięknych w Sewilli", "Muzeum Sztuki Nowoczesnej w Nowym Jorku". A patron follows the Polish "im." ("Galeria Narodowa im. Iwana Ajwazowskiego w Teodozji"); a region or country that is part of the name replaces the city ("Galeria Sztuki Ontario", "Narodowa Galeria Kanady").
3. A name with a proper element (a person, a building, a brand, an acronym) stays in the original, in Latin script: "Walters Art Museum", "Musée de Cluny", "Mauritshuis", "Tate Modern", "MACBA". For a country that does not write in Latin script, the institution's official English name counts as the original ("Miho Museum"). Kunsthalle, Kunsthaus and Haus der Kunst count as proper, as Polish has no equivalent; Kunstmuseum is translated.
4. A city only in a name under rule 2, written "w" with the locative, or where two entries would otherwise be confused ("Muzeum Picassa w Paryżu"). No country unless it is part of the name.
5. Original capitalisation and diacritics; no parentheses, no hybrids of two languages.
6. An institution that changed its name takes the current one ("Buffalo AKG Art Museum", "MUNCH").

**Search.** The column `english_name` becomes `alias`: the former name of a renamed entry, or another common form of a new one ("Zachęta", "Wawel"). The place field matches it as it matched the English name, so "Cleveland Museum of Art" still finds "Muzeum Sztuki w Cleveland", and a learner who has a place under the alias is not offered the entry again.

**Places already taken from the list.** A place linked to a renamed entry is renamed with it when it still has the entry's former name and the learner has no place with the new name. A place the learner renamed keeps its name. A place linked to a removed entry keeps its name and loses only the link (`on delete set null`).

### Consequences

- Good: the list holds 653 museums, all of them places where art is seen, with one form of name the learner can predict.
- Good: Polish museums of art are on the list.
- Good: former names keep working in the search.
- Bad: rule 2 gives Polish names that some literature does not use ("Galeria Obrazów w Berlinie" for the Gemäldegalerie, "Muzeum Brooklyńskie"); the former name is the alias.
- Bad: the line between descriptive and proper names, and between narrow and substantial collections, is a judgement; it was made by hand for each entry.
- Bad: the review is a snapshot of 2026-11-12; later changes of names in Wikidata are not followed.

## More information

Partly supersedes [ADR-0075](0075-offer-a-starter-list-of-museums-in-the-place-field.md) (the list and its names). Requirements R-93, R-265. Migration `20261112190000_museum_catalogue_review.sql`; ATL-680. The review, with every entry removed, renamed or added, is recorded in the comments of ATL-680.
