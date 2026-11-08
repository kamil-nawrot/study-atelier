# 0229. Show artwork types as the Boncompagni academy

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

The owner wants an exhibit of the display case for a collection with artworks of every artwork type (idea ATL-562), as "Świątynia della Tosse" counts the eras. The app has eight artwork types: painting, sculpture, architecture, printmaking, drawing, photography, applied arts and other. The design was started in a cloud session, which settled the structure, the engraving, the crop and the name, and finished in a local session, which researched the curiosities. The look and the texts are designed first; the counting is built later in its own issue.

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after a thing or a place it shows, never a person ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md), `voice-and-tone.md`).
- The engraving should show several arts side by side, as the exhibit counts several types.
- A tiered exhibit's curiosities follow its own theme, one per tier, with a checked source each.

## Considered options

For the kind: a hidden exhibit for all types; a tiered one by the number of types.

For the object: Cornelis Cort after Stradanus, the practitioners of the visual arts (1578); Pietro Francesco Alberti, _Academia d'Pitori_ (1600–38); Enea Vico after Baccio Bandinelli, Bandinelli's academy (about 1544); Frans Huys after Frans Floris, Apollo and the Muses (1565), whose nine Muses preside over poetry, music, dance, history and astronomy rather than the visual arts.

For the crop of the Cort: the whole workshop (`cort-workshop`); the statue court with "STATVARIA" (`cort-statuaria`); the table of printmaking with "INCISORIA" (`cort-incisoria`).

For the name: "Akademia w Rzymie"; "Rzymska akademia sztuk"; "Pracownia sztuk w Rzymie"; "Akademia Boncompagniego".

For the tiers: 2 to 7 types; 3, 5 and 7.

## Decision outcome

Chosen by the owner in ATL-580.

### Counting

- A tiered exhibit counting the artwork types of the collection without "Inne", at most seven, with six tiers at 2, 3, 4, 5, 6 and 7, like "Świątynia della Tosse" from 2 to 6 eras. The trash, artworks without a type and the place in the case are settled in the build's issue.

### Display case

- Object: the academy of the visual arts in Rome, where sculptors, painters, draughtsmen, architects and engravers work side by side, each art marked with its Latin name.
- Engraving: Cornelis Cort after a design by Jan van der Straet (Stradanus), _The Practitioners of the Visual Arts_, Rome, 1578, published by Laurentius Vacarius and dedicated to Giacomo Boncompagni, Metropolitan Museum of Art 53.600.509, CC0 on its [object page](https://www.metmuseum.org/art/collection/search/369581); `exhibit-art` takes the museum's image through `source_url`. The Rijksmuseum holds another impression, RP-P-BI-6381, which confirms the publisher and the dedication. The whole workshop inside the plate, without the dedication, variant `cort-workshop` in `tools/exhibit-art/manifest.json`; the other two crops stay as alternatives. The scene is dense at 400 × 520, which the owner accepted.
- Credit: Cornelis Cort, „Adepci sztuk plastycznych”, 1578.
- Exhibit code: `boncompagni_academy`.
- Name "Akademia Boncompagniego", a place and whose it is, after the dedication of the print.
- The counter label: "typów dzieł w atelier", as in "3 z 7 typów dzieł w atelier".
- The story of the object: "Cornelis Cort wyrył w 1578 roku w Rzymie pracownię, w której obok siebie pracują rzeźbiarze, malarze, rysownicy, architekci i rytownicy."
- Theme of the curiosities, a new row in `voice-and-tone.md`: how the arts were told apart and ranked: the contest of painting and sculpture, academies, fine and applied arts, printmaking and photography admitted among the arts.
- The curiosities of its tiers:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                                                | Source                                                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1    | W 1546 roku florencki uczony Benedetto Varchi zapytał najwybitniejszych artystów, która sztuka jest wyższa: malarstwo czy rzeźba, i ten spór nazwano paragone. Bronzino w niedokończonej odpowiedzi bronił malarstwa: według niego umie ono oddać trójwymiarowość rzeźby, a przy tym naśladować naturę tak, jak rzeźba nie potrafi.                      | [National Gallery](https://www.nationalgallery.org.uk/paintings/bronzino-the-madonna-and-child-with-saints)                       |
| 2    | W 1563 roku książę Kosma I Medyceusz zatwierdził statut florenckiej Akademii Sztuki Rysunku, którą wymyślił Giorgio Vasari. Na pierwszym zebraniu 70 osób ogłosiło Michała Anioła „Ojcem i Mistrzem tych trzech sztuk”, a młodsi artyści protestowali, bo nie przyjęto ich do grona pierwszych akademików.                                               | [Accademia delle Arti del Disegno](https://www.aadfi.it/accademia/)                                                               |
| 3    | Gdy w 1768 roku powstała londyńska Royal Academy, jej statut wprost wykluczał z członkostwa rytowników. Francesco Bartolozzi, przez blisko 40 lat rytownik króla, był jednak ceniony tak wysoko, że zrobiono dla niego wyjątek i przyjęto go do Akademii jako malarza.                                                                                   | [Royal Academy](https://www.royalacademy.org.uk/art-artists/name/francesco-bartolozzi-ra)                                         |
| 4    | Od 1912 do 1948 roku na igrzyskach olimpijskich przyznawano medale także za architekturę, literaturę, muzykę, malarstwo i rzeźbę, za dzieła poświęcone sportowi. W 1912 roku złoto za rzeźbę zdobył Amerykanin Walter Winans, cztery lata wcześniej mistrz olimpijski w strzelaniu. Brąz w 1932 roku dostał projekt Stadionu Olimpijskiego we Wrocławiu. | [olympics.com](https://www.olympics.com/en/news/look-to-the-past-when-olympic-medals-were-awarded-for-architecture-music-and-lit) |
| 5    | Po Wielkiej Wystawie w 1851 roku za 5000 funtów rządowej dotacji kupiono wybór wystawionych przedmiotów. Stały się zaczątkiem otwartego w 1852 roku Muzeum Wyrobów, które miało uczyć projektantów, producentów i publiczność sztuki i wzornictwa. W 1899 roku dostało nazwę Muzeum Wiktorii i Alberta.                                                  | [V&A, Building the V&A](https://www.vam.ac.uk/articles/building-the-museum)                                                       |
| 6    | W 1852 roku V&A jako jedno z pierwszych muzeów zaczęło kupować do zbiorów fotografie, a w 1858 urządziło swoją pierwszą wystawę fotografii. Dziś ma około 800 000 zdjęć, jedną z najważniejszych kolekcji na świecie.                                                                                                                                    | [V&A, Photography](https://www.vam.ac.uk/collections/photographs)                                                                 |

The Royal Academy page refused automated reading and olympics.com did not answer, so the owner pasted their text. The Accademia page does not name the "three arts", so the curiosity quotes them without listing them. A remark on the four categories of the Royal Academy today was dropped: no open source stated it.

### Consequences

- Good: the exhibit rewards breadth across kinds of art, which no other exhibit counts, and its last tier crowns photography, the youngest type, with the museum that first collected it.
- Good: the fifth curiosity links to "Kryształowy Pałac", whose Great Exhibition founded the V&A.
- Bad: the engraving is the densest of the case at 400 × 520.
- Bad: the Floris Muses, first proposed in the local session, were set aside; the Muses do not stand for the visual arts.

## More information

Designed in ATL-580 from the idea ATL-562; the build, with the counting, is ATL-584. The WebP images go to `apps/web/static/exhibits/boncompagni_academy/` with `exhibit-art publish --only boncompagni_academy` once the exhibit exists in the app and the database.
