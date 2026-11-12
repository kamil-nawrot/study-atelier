# 0265. Show three generations of masters as van Eyck's easel

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

Version 0.23 lets the learner relate authors, among them as teacher and pupil ([ADR-0259](0259-relate-artworks-and-authors-with-typed-relations.md)). A chain of three generations, a master, a pupil and the pupil's pupil, is a piece of art-historical knowledge no exhibit rewards. The owner chose a hidden exhibit for it. The look and the texts are designed first; the counting is built later in its own issue.

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after a thing or a place it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md), `voice-and-tone.md`).
- The engraving should show generations of a workshop, a master and those who learn from him.
- The hint works without the engraving and never names the action or the place in the app.

## Considered options

For the object, in four rounds:

- Robert Péril, sheet three of the family tree of the House of Habsburg, Antwerp 1533–1535, Rijksmuseum RP-P-1927-426-3: a royal line, not masters.
- Reinier Vinkeles and Daniël Vrijdag, the drawing hall of Felix Meritis, 1789, Rijksmuseum RP-P-OB-70.322: one generation of pupils, and Vinkeles is already in the case.
- Daniël Voorman's drawing lesson, Pierre Thomas Le Clerc's _Étude du dessein_ and Johann Oswald Harms's torch in ruins: thin, without a master, or dark and small.
- Saint Anne with the Virgin and Child: a woodcut of the school of Dürer, 1520–1530, Rijksmuseum RP-P-OB-1551, and Dürer's engraving, 1498–1502, Rijksmuseum RP-P-OB-1186: three generations literally, but a fourth Dürer and figures rather than a thing.
- Charles Baltet, a cleft graft from _L'art de greffer_, 1892: a technical figure with letters, in a small scan.
- A painter's attributes, a beehive by Bernard Picart (1717), a beehive between age and youth (1762), a bird's nest and Theodor de Bry's emblem "Ex optimis praestantiores vitae magistros imitados" (1596): loose metaphors or small prints.
- _Color olivi_ from the _Nova Reperta_ (chosen).

For the crop, the owner wanted three figures: the master, the pupil and the boy from the left (`galle-master-pupils-left`) cut the master; the master, the pupil and the boy on the right (`galle-master-pupils-right`) and the centre (`galle-master-pupils-centre`) were set aside for a crop between them, the master, the pupil and the boy in the doorway (`galle-master-pupils-centre-right`).

For the name: "Sztaluga van Eycka", "Paleta van Eycka", "Pracownia van Eycka", the last repeating "Pracownia Świętego Hieronima".

For the hint: "Najdłuższy rodowód nie potrzebuje herbu."; "Sztuka też ma swoich dziadków."; "Szkoła nie kończy się na jednym nauczycielu."; "Talent dziedziczy się dalej niż nazwisko."; "Każdy mistrz był kiedyś czyimś uczniem." (chosen).

## Decision outcome

Chosen by the owner in ATL-690.

### Counting

- The exhibit is unlocked by a chain of three authors in the learner's relations of the kind `pupil`: A is the teacher of B, and B is the teacher of C. It is read from the current `author_relations`, so it unlocks retroactively like the other exhibits. Whether merged authors or authors without artworks count is settled in the build's issue.

### Display case

- Object: Jan van Eyck's workshop as the engraving imagines it: the master paints Saint George in oil at the easel, a pupil grinds paint on a palette before him, and a boy carries a board in the doorway behind.
- Engraving: attributed to the workshop of Philips Galle after a design by Jan van der Straet (Stradanus), _Color olivi_, plate 14 of the 19 of the _Nova Reperta_, engraving, Antwerp, about 1589–1593, Rijksmuseum RP-P-1904-1038, CC0, Commons `Schilderen met olieverf Color olivi … RP-P-1904-1038.jpg`. The master, the pupil and the boy in the doorway, variant `galle-master-pupils-centre-right` in `tools/exhibit-art/manifest.json`; the other three crops stay as alternatives.
- Credit: Warsztat Philipsa Galle’a według Jana van der Straeta, „Color olivi”, około 1589–1593.
- Exhibit code: `van_eyck_easel`.
- Name "Sztaluga van Eycka", a thing and whose it is: the caption of the plate names "magister Eyckius".
- The story of the object: "Na miedziorycie z warsztatu Philipsa Galle’a według Stradanusa Jan van Eyck maluje farbą olejną świętego Jerzego, a uczniowie wokół ucierają farby i ćwiczą rysunek."
- The hint while hidden: "Każdy mistrz był kiedyś czyimś uczniem."
- What it was awarded for: "Za mistrza, jego ucznia i ucznia jego ucznia w atelier."
- The room of the display case: Sala główna, after `vault_cobweb` ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md), [ADR-0264](0264-show-relations-as-arachne-s-web.md)).
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                               | Source                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1    | Rycina pokazuje wyidealizowaną pracownię Jana van Eycka, któremu Stradanus za Giorgiem Vasarim przypisał wynalezienie farby olejnej. To nieprawda: Vasari nazwał van Eycka człowiekiem, który „lubował się w alchemii”, i liczył, że taki wynalazek sprowadzi sztukę niderlandzką do poziomu rzemiosła. | [Max Planck Institute for the History of Science](https://www.mpiwg-berlin.mpg.de/news/features/features-feature22) |

The Rijksmuseum describes the plate as a painter at work with his pupils and does not name him; the caption of the plate and the Max Planck page name van Eyck. The Max Planck page dates the series 1584, the Rijksmuseum this impression about 1589–1593; the credit follows the Rijksmuseum.

### Consequences

- Good: the master, the pupil and the youngest of the workshop stand in three planes of one crop, the idea of the exhibit.
- Good: the curiosity tells a story about the print itself, a famous misattribution.
- Bad: the second design by Stradanus in the case, after "Akademia Boncompagniego".
- Bad: the hint is the most direct of the hidden exhibits, by the owner's choice.

## More information

Designed in ATL-690; the build, with the counting, is ATL-695. The WebP images go to `apps/web/static/exhibits/van_eyck_easel/` with `exhibit-art publish --only van_eyck_easel` once the exhibit exists in the app and the database.
