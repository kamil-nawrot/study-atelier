# 0293. Show two symbols with the same meaning as the nest of Nehushtan

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

The owner wants a hidden exhibit of the display case for two different symbols of the atlas that share a meaning. A symbol has one or more meanings, each a free text on `symbol_meanings`, and a detail (pin) of an artwork points at a symbol and optionally at one of its meanings ([ADR-0290](0290-show-a-symbol-from-the-atlas-as-a-block-of-an-exhibition.md)). The look and the texts are designed first; the counting is built later in its own issue. When are two meanings the same, how is an accidental find kept out, which object and engraving does the exhibit show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.
- The rooms of the display case are named "Sala …" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)), so the name of an exhibit avoids the word.
- The hint of a hidden exhibit works without the engraving and neither opens nor follows the pattern of another hint ([ADR-0213](0213-change-the-hint-of-the-alphabet-of-master-es.md)).
- A meaning is often copied to a new symbol while a mistake is fixed, which alone must not unlock the exhibit.

## Considered options

For the object: the Rosetta Stone, engraving by Bigand after Jomard in _Description de l'Égypte_ (1822), the same decree in three scripts, but in 400 × 520 a grey slab full of text, while Kircher and the hieroglyphs are already in the curiosities of "Czaszka zwycięzcy"; the anchor with a dolphin "Festina lente" from _Symbola divina et humana_ after Aegidius Sadeler (1666, Rijksmuseum RP-P-2016-1042-104, CC0), a motto given many symbols (the dolphin with the anchor, the crab with the butterfly, the tortoise with the sail), but a small print of about 1800 px once cropped; the title page of Ripa's _Iconologia_ (1644) with Poetry and Painting, Ripa giving each concept several symbols, but figures on a title page rather than an object; the pelican and the brazen serpent of Boëtius Bolswert (1639), two symbols of the same sacrifice of Christ on one plate.

For the crop of the anchor, kept in `tools/exhibit-art/manifest.json` under `festina_lente_anchor`: the cartouche (`sadeler-anchor-cartouche`), the banner (`sadeler-anchor-banner`) and the anchor close up (`sadeler-anchor-close`).

For the crop of the pelican: the whole scene under the plate border (`bolswert-pelican-scene`); the pelican and the serpent a little closer (`bolswert-pelican-close`).

For the hint, in the pattern of two symbols of one meaning in one image: "Jak serce przeszyte strzałą Amora." (love); "Jak sowa siedząca na księdze." (wisdom); "Jak świeca dopalająca się przy klepsydrze." (transience); "Jak palma i laur w dłoniach zwycięzcy." (victory).

For the curiosity: the plate as one of the sixteen scenes of the Miracle of Amsterdam, without saying what the miracle was; the same with a short clause on the miracle, first worded as a host thrown into the fire, then corrected to the museum's account of a host found unharmed in the flames of the hearth.

## Decision outcome

Chosen by the owner in ATL-754.

### Counting

- Two meanings are the same when their whole texts are equal, ignoring letter case and spaces. Context labels do not matter: "czystość, niewinność" and "czystość" do not match.
- Two different symbols have such a meaning, and each is shown with it on a detail of an artwork outside the trash; the two details are on two different artworks.
- Spaces inside the text, a pin without a chosen meaning on a symbol with several meanings, and data before the release are settled in the build's issue.

### Display case

- Object: the pelican feeding its young with its own blood at the foot of the cross with the brazen serpent, two symbols of the same sacrifice of Christ.
- Engraving: Boëtius Adamsz. Bolswert, _The pelican and the brazen serpent_, plate 12 of 16 of the Miracle of Amsterdam in Leonardus Marius, _Amstelredams eer ende opcomen_ (Antwerp, 1639), Rijksmuseum RP-P-1878-A-2587, CC0, on Commons at 3876 × 6358 px. The whole scene under the plate border, variant `bolswert-pelican-scene` in `tools/exhibit-art/manifest.json`; the other crop stays as an alternative.
- Credit: Boëtius Adamsz. Bolswert, „Pelikan i miedziany wąż”, 1639.
- Exhibit code: `pelican_serpent`.
- Name "Gniazdo Nechusztana", the owner's own text: the nest of the pelican under Nehushtan, the brazen serpent of Moses.
- The story of the object: "Na rycinie Boëtiusa Bolswerta z 1639 roku pelikan karmi pisklęta własną krwią u stóp krzyża, na którym wije się miedziany wąż."
- The hint while hidden: "Jak gołąb niosący gałązkę oliwną.", the owner's own text: two symbols of peace in one image.
- What it was awarded for: "Za dwa różne symbole o tym samym znaczeniu, wskazane na dwóch dziełach."
- The room of the display case: Skryptorium, last, after "Alfabet Mistrza E.S." ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                            | Source                                                                                                                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Rycina to dwunasta z szesnastu scen o Cudzie amsterdamskim z 15 marca 1345 roku, kiedy w płomieniach paleniska znaleziono nietkniętą hostię. Dwa wiersze pod nią, po łacinie i po niderlandzku, stawiają obok siebie miedzianego węża i pelikana karmiącego pisklęta krwią: oba mówią o tej samej ofierze Chrystusa. | [Rijksmuseum, RP-P-1878-A-2587](https://www.rijksmuseum.nl/nl/collectie/RP-P-1878-A-2587), [Museum Ons' Lieve Heer op Solder, Miracle of Amsterdam](https://opsolder.nl/en/miracle-of-amsterdam/), the verses on the plate |

The page of Museum Ons' Lieve Heer op Solder did not open from the cloud, so the owner pasted its text.

### Consequences

- Good: one plate shows two symbols of one meaning, which is exactly what the exhibit counts, and its verses say so.
- Good: the hint names another pair of symbols of one meaning, the dove and the olive branch, without describing the engraving.
- Good: two details on two artworks keep out a meaning only copied while a symbol is fixed.
- Bad: the exact match misses meanings worded differently, such as "czystość" and "czystość, niewinność".

## More information

Designed in ATL-754; the build, with the counting, is [ATL-755](https://linear.app/kamil-nawrot/issue/ATL-755/build-the-exhibit-gniazdo-nechusztana-for-two-symbols-with-the-same-meaning). The WebP images go to `apps/web/static/exhibits/pelican_serpent/` with `exhibit-art publish --only pelican_serpent` once the exhibit exists in the app and the database. The candidates not chosen stay for later exhibits.

This record was written after the design session ended before pushing, from the design issue and the end of its conversation; earlier rounds of hints and names were not kept.
