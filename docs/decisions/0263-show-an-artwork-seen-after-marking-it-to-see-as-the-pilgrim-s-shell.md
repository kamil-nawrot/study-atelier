# 0263. Show an artwork seen after marking it to see as the pilgrim's shell

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

Version 0.23 lets the learner mark an artwork "Chcę zobaczyć" and clears the mark when a saved visit holds the artwork ([ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md)). The moment a wish to see an artwork comes true is rewarded by no exhibit. The owner chose a hidden exhibit for it. The look and the texts are designed first; the counting is built later in its own issue.

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after a thing or a place it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md), `voice-and-tone.md`).
- The engraving should show a journey towards something longed for.
- The hint works without the engraving and never names the action or the place in the app; the name and the hint avoid words the app gives its own features ("mapa", "lornetka", "wizyta").
- A visit clears the mark and keeps no trace, so the moment has to be stored when it happens.

## Considered options

For the kind: a hidden exhibit; a tiered one counting the artworks seen from the list. The tiered one was dropped: it would nearly repeat "Teleskop Mathieu Laensbergha" (artworks seen in person), and marking an artwork just before saving a visit would game it.

For the object:

- An anonymous copy after Jacques Callot, two pilgrims inside a rhymed route to Santiago de Compostela, published by Jean Lenfant, Paris, 1623–1699, Rijksmuseum RP-P-OB-20.935 (chosen).
- Giuseppe Vasi, Porta del Popolo, from _Delle magnificenze di Roma antica e moderna_, 1747–1761, Rijksmuseum RP-P-1909-1683: the gate where Grand Tour travellers entered Rome, but a small landscape plate, and Rome and Piranesi's circle are already in the case.
- "Pèlerins de l'Isle de Cythère", 1705, Rijksmuseum RP-P-1921-273: a pilgrimage of love, off the theme.

For the crop: both pilgrims from the staffs to the feet (`callot-pilgrims`); wider, with the title of the guide cut (`callot-pilgrims-verse`); the heads with the shells (`callot-pilgrims-hats`).

For the name: "Muszla pielgrzyma", "Kostur pielgrzyma", "Kapelusz pielgrzyma", "Droga do Santiago".

For the hint: "Najpierw trzeba wiedzieć, dokąd się tęskni."; "Kto tęskni do obrazu, ten w końcu do niego dojdzie."; "Tęsknota to mapa, której nie trzeba rysować."; "Obraz z pocztówki czeka, aż stanie się wspomnieniem."; "Wypatrzone z daleka najpiękniej ogląda się z bliska."; "Obietnica złożona obrazowi czeka na dotrzymanie."; "Najdłuższa podróż zaczyna się od jednego pragnienia."; "Tęsknota nosi w kieszeni bilet w jedną stronę."; "Marzenie, które ma adres, łatwiej spełnić." (chosen).

## Decision outcome

Chosen by the owner in ATL-688.

### Counting

- The exhibit is unlocked by the first artwork marked "Chcę zobaczyć" that goes into a saved visit. `save_visit` records the moment as a `wish_seen` event in `point_events`, with the artwork as its item and no points of its own (ATL-684); the exhibit gives the 50 points of a single-tier easter egg ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)). Marks cleared before the event exists leave no trace and do not count.

### Display case

- Object: two pilgrims with staffs and hats bearing the scallop shell of Saint James, standing inside a rhymed French guide to the road from Paris to Santiago de Compostela, which ends with the pilgrims seeing the church at last and sums the road up as 359 leagues.
- Engraving: anonymous copy after Jacques Callot's "Two Pilgrims" from _Les Gueux_ (about 1622–1623), published by Jean Lenfant, Paris, _La guide des chemins de Paris a Saint Iacques en Galice disposee en abregé pour la comodité des pelerins_, etching, 1623–1699, Rijksmuseum RP-P-OB-20.935 (Lieure 481, copy), CC0, Commons `Twee pelgrims en een routebeschrijving naar Santiago de Compostela … RP-P-OB-20.935.jpg`. Both pilgrims from the staffs to the feet with the verse around them, variant `callot-pilgrims` in `tools/exhibit-art/manifest.json`; the other two crops stay as alternatives.
- Credit: Według Jacques’a Callota, wyd. Jean Lenfant, „Przewodnik drogami z Paryża do Świętego Jakuba w Galicji”, 1623–1699.
- Exhibit code: `pilgrim_shell`.
- Name "Muszla pielgrzyma", a thing and whose it is: the shell on the pilgrims' hats.
- The story of the object: "Na kopii akwaforty Jacques’a Callota dwoje pielgrzymów w kapeluszach z muszlą świętego Jakuba stoi w środku rymowanego przewodnika z Paryża do Santiago de Compostela."
- The hint while hidden: "Marzenie, które ma adres, łatwiej spełnić."
- What it was awarded for: "Za dzieło zobaczone na żywo po tym, jak trafiło na listę do zobaczenia."
- The room of the display case: Sala map, last, after "Siedmiomilowe buty" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                            | Source                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1    | Pielgrzymi kupowali w sanktuarium w Composteli prawdziwe muszle przegrzebków i przypinali je do toreb. Gdy chętnych przybyło więcej, niż było muszli, zaczęto sprzedawać metalowe odznaki, a w XIII wieku w Composteli pracowało 100 wytwórców z licencją. Nikt nie wie na pewno, dlaczego muszla stała się znakiem świętego Jakuba. | [London Museum](https://www.londonmuseum.org.uk/collections/v/object-37427/st-james-of-santiago-de-compostela/) |

The curiosity tells the story of the shell on the engraving rather than of the print itself: the catalogues of the print (Rijksmuseum, Wellcome Collection) give only its data, and the owner accepted the exception.

### Consequences

- Good: the guide is a list of places to reach that ends in seeing them, as the mark "Chcę zobaczyć" ends in a visit.
- Good: Callot is new to the case, and his line renders cleanly in every metal.
- Bad: the exhibit counts only marks cleared after ATL-684 ships; artworks seen before cannot unlock it.
- Bad: the curiosity is about the motif, not the work, unlike the other hidden exhibits.

## More information

Designed in ATL-688; the moment is stored by ATL-684; the build, with the counting, is ATL-693. The WebP images go to `apps/web/static/exhibits/pilgrim_shell/` with `exhibit-art publish --only pilgrim_shell` once the exhibit exists in the app and the database.
