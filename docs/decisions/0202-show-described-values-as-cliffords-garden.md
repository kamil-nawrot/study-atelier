# 0202. Show described values as Clifford's garden

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

The owner wants a tiered exhibit of the display case for the card index values the learner describes on their value pages, since writing those descriptions counts towards no exhibit today (idea ATL-519, [ADR-0160](0160-gamify-learning-as-a-museum-career.md)). The look, the thresholds and the texts are designed first; the counting is built later in its own issue. What does it count, which object and engraving does it show, how does it read, and what do its curiosities tell?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- Each tier reveals a curiosity on the exhibit's theme, from one source that states every fact (`voice-and-tone.md`).
- The thresholds fit the owner's real atelier: on 2026-11-06 in production, filled chronologically up to the Gothic period, it held 321 values (53 authors, 11 periods, 55 styles, 43 materials, 153 places and the 6 eras), of which 28 had a summary and 31 a summary or notes, 21 of them styles.

## Considered options

For what counts: values with a summary; values with a summary or notes.

For the thresholds: 1, 10, 25, 50, 100, 250; 5, 25, 50, 100, 250, 500; 10, 25, 50, 100, 250; 1, 10, 25, 50, 100, 500.

For the object: Jan Wandelaar's frontispiece of Carl Linnaeus's _Hortus Cliffortianus_ (1738); the frontispiece of David Teniers's _Theatrum Pictorium_ (c. 1660), the illustrated catalogue of Archduke Leopold Wilhelm's paintings.

For the crop of the frontispiece: nearly the whole composition; the bust on its pedestal inscribed "Hortus Cliffortianus" with the garden behind; Apollo and Mother Earth with the putti below.

For the curiosities: Linnaeus's works and herbarium cabinets alone; naming, labelling, cataloguing and classifying in art, with Dewey's classification and the Louvre's database.

## Decision outcome

Chosen by the owner in ATL-528.

### Counting

- The exhibit counts the values of the card index described with a summary or notes: authors, periods, styles, materials, places and the eras. The values of own fields have no description and do not count. Notes count too, since some values are described only there.
- Six tiers at 1, 10, 25, 50, 100 and 500. With 31 described values the owner holds the third tier; 500 is a long goal for an atelier that will grow several times over by the contemporary era. How the build treats values without artworks, blank summaries and merged values is settled in its issue.

### Display case

- Object: Clifford's garden in the frontispiece of _Hortus Cliffortianus_, Linnaeus's catalogue of the plants grown by George Clifford. The Teniers frontispiece came close and stays as a candidate; its portrait of the archduke outweighs the catalogue.
- Engraving: Jan Wandelaar, frontispiece of _Hortus Cliffortianus_, signed and dated 1738 on the plate, in the scan of the Real Jardín Botánico, Madrid, on Wikimedia Commons (`Linnaeus Hortus Cliffortianus frontispiece.jpg`, 1181 × 2037). The crop of nearly the whole composition inside the plate lines, variant `wandelaar-wide` in `tools/exhibit-art/manifest.json`; the other two crops stay as alternatives.
- Credit: Jan Wandelaar, frontyspis „Hortus Cliffortianus” Karola Linneusza, 1738.
- Exhibit code: `hortus_cliffortianus`.
- Name "Ogród Clifforta", a place and whose it is, after the inscription "Hortus Cliffortianus" on the pedestal.
- The counter label: "opisanych wartości w Kartotece".
- The story of the object: "Jan Wandelaar wyrył w 1738 roku frontyspis „Hortus Cliffortianus”, katalogu roślin z ogrodu George’a Clifforta opisanego przez Karola Linneusza." The [Rijksmuseum](https://www.rijksmuseum.nl/en/collection/RP-P-OB-61.486) records Wandelaar's plates for the book, published in Amsterdam in 1738 with Clifford as the grower of its plants. The allegory of the scene is left out: no source that opened named its figures.
- Theme of the curiosities, a new row in `voice-and-tone.md`: how collections are described and ordered: names, labels, catalogues and classification systems. The owner asked for more about art than about Linnaeus.
- The curiosities of its tiers:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                                    | Source                                                                                                                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Muzeum Ennigaldi, córki babilońskiego króla Nabonida i arcykapłanki boga księżyca, powstało w Ur około 530 roku p.n.e. i uchodzi za najstarsze na świecie. W 1925 roku Leonard Woolley rozpoznał je po etykietach: przy każdym przedmiocie leżał gliniany cylinder z napisami w czterech językach, objaśniającymi przedmiot i jego historię. | [Artnet News](https://news.artnet.com/art-world/art-bites-first-museum-labels-2467975)                                                      |
| 2    | Portret matki Jamesa Whistlera, amerykańskiego malarza dzielącego karierę między Londyn i Paryż, ma podwójny tytuł: „Aranżacja w szarości i czerni nr 1” i „Portret matki artysty”. Wkrótce potem Whistler dawał swoim obrazom już tylko muzyczne podtytuły, bo ważniejsza była dla niego harmonia niż temat.                                | [Musée d’Orsay](https://www.musee-orsay.fr/en/artworks/arrangement-en-gris-et-noir-ndeg1-974)                                               |
| 3    | Poradnik pisania tekstów w Muzeum Wiktorii i Alberta zaleca, by zwykła etykieta dzieła miała 50–60 słów, a jej pierwsze zdanie w miarę możliwości mniej niż 16. Powód: według Getty Museum zwiedzający bez przygotowania patrzy na obiekt krócej niż 30 sekund, więc najważniejsza informacja musi paść od razu.                             | [V&A, Writing Gallery Text at the V&A](http://media.vam.ac.uk/media/documents/gallery_text_writing_guide_updated.pdf)                       |
| 4    | Iconclass, system klasyfikacji tego, co przedstawiają obrazy, wymyślił Henri van de Waal, profesor historii sztuki na uniwersytecie w Lejdzie, który pracował nad nim od lat 40. XX wieku. Dziś wiele muzeów i bibliotek opisuje nim tematy dzieł w swoich zbiorach.                                                                         | [Iconclass](https://iconclass.org/)                                                                                                         |
| 5    | Melvil Dewey od 1873 roku pracował w bibliotece Amherst College nad systemem porządkowania książek i katalogów kartkowych. Pierwsze wydanie jego klasyfikacji z 1876 roku liczyło mniej niż 50 stron, a 23. wydanie z 2011 roku ma cztery tomy. Sama Biblioteka Kongresu z tego systemu nie korzysta.                                        | [Library of Congress](https://blogs.loc.gov/manuscripts/2026/04/of-note-registering-the-dewey-decimal-system-at-the-library-of-congress/)   |
| 6    | W marcu 2021 roku Luwr po raz pierwszy udostępnił w sieci całą swoją kolekcję. Jego nowa baza miała na start ponad 482 000 wpisów, również o dziełach z magazynów i tych wypożyczonych na długo innym instytucjom we Francji.                                                                                                                | [Musée du Louvre](https://presse.louvre.fr/le-musee-du-louvre-met-en-ligne-ses-collections-et-devoile-son-nouveau-site-internet-3/?lang=en) |

The Artnet and Musée d'Orsay pages refused automated reading, so the owner pasted their text. Artnet gives four languages for the labels of Ur, where other accounts give three. Earlier drafts with Linnaeus's _Systema naturae_, _Species plantarum_ and herbarium cabinets, the Mona Lisa's official title and Jan Asselijn's _Threatened Swan_ were dropped: too much about Linnaeus, no point, or no link to ordering collections.

### Consequences

- Good: the exhibit rewards the descriptions written in the card index, which no other exhibit counts.
- Good: the curiosities run from the first museum labels to the catalogue of a whole museum, so the last tier crowns the hardest goal.
- Bad: the scan is of modest size and the scene is crowded at 400 × 520.

## More information

Designed in ATL-528 from the idea ATL-519; the build, with the counting, is ATL-551. The WebP images go to `apps/web/static/exhibits/hortus_cliffortianus/` with `exhibit-art publish --only hortus_cliffortianus` once the exhibit exists in the app and the database.
