# 0231. Show an exhibition through all six eras as Lenoir's chapel

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

The owner wants a hidden single-tier exhibit of the display case for one exhibition in "Wystawy" that holds artworks of all six eras, a story told across the whole history of art (idea ATL-561). "Świątynia della Tosse" counts the eras of the whole collection, not of one exhibition. The look and the texts are designed first; the counting is built later in its own issue. Which object and engraving does it show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.
- The rooms of the display case are named "Sala …" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)), so the name of an exhibit avoids the word.
- The engraving of a hidden exhibit is not seen until it is found, so its hint cannot lean on what the engraving shows.

## Considered options

For the object: the introduction hall of Alexandre Lenoir's Musée des monuments français, in two etchings by Jean-Baptiste Réville and Jacques Lavallée after Jean-Lubin Vauzelle (_Première vue_ and _Seconde vue de la salle d'introduction_, 1816, Musée Carnavalet G.30765 and G.30766, CC0); William Hogarth, _Time Smoking a Picture_ (1761, Rijksmuseum RP-P-OB-18.728, CC0), a satire on smoked old masters only loosely about a walk through the eras; Philips Galle after Pieter Bruegel the Elder, _The Triumph of Time_ (1574, Met and NGA, CC0), landscape and dense, while the case already has two allegories of time.

For the crop of the _Seconde vue_, each the full height of the plate: the left side with the window, the tombs and the fountain (`introduction-left`); the centre with the obelisk, the fountain and the portal (`introduction-centre`); the right side with the portal and the tombs of the right wall (`introduction-right`).

For the name: "Kaplica Lenoira"; "Muzeum Lenoira"; "Obelisk Lenoira".

For the hint, first through the engraving: "W jednej kaplicy zmieszczą się wszystkie wieki."; "Obelisk i fontanna nie pytają, z którego są stulecia."; "Kto zbiera wieki, nie zatrzymuje się w połowie drogi."; "Szachownica posadzki prowadzi przez wszystkie epoki."; "Światło z okna pada tak samo na kamień antyczny, jak na wczorajszy."; "Pod jednym sklepieniem mieszczą się wszystkie stulecia."; "Każde stulecie dostaje w kaplicy swój nagrobek."; "Fontanna nie wyschnie, dopóki płyną przez nią wieki.". The owner noted that the engraving is not seen before the exhibit is found, so these were dropped for hints that work without it: "Z jaskini do galerii da się przejść jednym spacerem."; "Dobra opowieść nie pomija żadnego rozdziału."; "Na jednej ścianie zmieszczą się i mamut, i pisuar."; "Historię sztuki najlepiej opowiadać od pierwszego kamienia po ostatni ekran."; "Między ochrą a pikselem mieści się cała opowieść.".

For the curiosity: the introduction hall as the convent's former chapel and the museum replaced by the École des beaux-arts (Musée Carnavalet), which repeated the story of the object.

## Decision outcome

Chosen by the owner in ATL-567.

### Counting

- The exhibit is unlocked by one exhibition that holds artworks of all six eras. Which artworks count (the trash, artworks without an era, close-ups and palettes) and data before the release are settled in the build's issue.

### Display case

- Object: the introduction hall of Lenoir's museum in the former chapel of the Petits-Augustins convent in Paris, where he gathered funerary and decorative sculpture of all periods.
- Engraving: Jean-Baptiste Réville and Jacques Lavallée after Jean-Lubin Vauzelle, _Seconde vue de la salle d'introduction_, etching and engraving from _Vues pittoresques et perspectives des salles du Musée des monuments français_ (Paris, P. Didot l'aîné, 1816, [CCA](https://cca.qc.ca/en/search/details/library/publication/1277178439)), Musée Carnavalet G.30766, CC0 on its [object page](https://www.parismuseescollections.paris.fr/fr/musee-carnavalet/oeuvres/seconde-vue-de-la-salle-d-introduction) and on Commons. The left side of the hall at the full height of the plate, variant `introduction-left` in `tools/exhibit-art/manifest.json`, chosen by the owner to show as many different monuments as possible; the other two crops stay as alternatives.
- Credit: Jean-Baptiste Réville i Jacques Lavallée według Jean-Lubina Vauzelle’a, „Druga perspektywa sali wprowadzającej”, 1816.
- Exhibit code: `lenoir_chapel`.
- Name "Kaplica Lenoira", a place and whose it is: the hall was the convent's former chapel ([Musée Carnavalet](https://www.parismuseescollections.paris.fr/fr/musee-carnavalet/oeuvres/la-salle-d-introduction-du-musee-des-monuments-francais)).
- The story of the object: "Jean-Baptiste Réville i Jacques Lavallée wyryli w 1816 roku salę wprowadzającą paryskiego Muzeum Zabytków Francuskich, w której Alexandre Lenoir zebrał rzeźby ze wszystkich epok."
- The hint while hidden: "Dobra opowieść nie pomija żadnego rozdziału."
- What it was awarded for: "Za wystawę z dziełami wszystkich sześciu epok."
- The room of the display case: Pawilon, after "Kryształowy Pałac" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                                              | Source                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1    | Muzeum Zabytków Francuskich Alexandre’a Lenoira, otwarte w Paryżu w 1795 roku, było drugim muzeum narodowym Francji po Luwrze i przyczyniło się do narodzin pojęcia dziedzictwa. Zamknięto je w 1816 roku, a zbiory rozproszyły się: dziś są m.in. w Luwrze, bazylice Saint-Denis i katedrze Notre-Dame, a za granicą najwięcej w Metropolitan Museum. | [Louvre, A Revolutionary Museum](https://www.louvre.fr/en/exhibitions-and-events/exhibitions/a-revolutionary-museum) |

The Carnavalet record of the print gives no date; the year comes from the album the plate was published in.

### Hints of hidden exhibits

- A hint works without the engraving, which is not seen until the exhibit is found: it uses an image of its own, not a description of the engraving. `voice-and-tone.md` says so.

### Consequences

- Good: Lenoir's hall gathered sculpture of all periods in one room, the idea of the exhibit.
- Good: the wide crop shows many kinds of monuments at once.
- Bad: the third museum interior of the case, after "Salon w Luwrze" and "Kryształowy Pałac".
- Bad: the hall is dense at 400 × 520.

## More information

Designed in ATL-567 from the idea ATL-561; the build, with the counting, is ATL-586. The WebP images go to `apps/web/static/exhibits/lenoir_chapel/` with `exhibit-art publish --only lenoir_chapel` once the exhibit exists in the app and the database.
