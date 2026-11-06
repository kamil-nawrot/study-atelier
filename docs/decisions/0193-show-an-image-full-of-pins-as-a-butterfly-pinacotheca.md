# 0193. Show an image full of pins as a butterfly pinacotheca

- Status: accepted
- Date: 2026-11-05

## Context and problem statement

The owner wants a hidden single-tier exhibit of the display case for an image of an artwork with the most pins allowed, like "Straż nocna", "Puchar Nemezis", "Uśmiech Mony Lisy" and "Paszcza prawdy" ([ADR-0160](0160-gamify-learning-as-a-museum-career.md), [ADR-0187](0187-reward-a-sent-idea-with-a-hidden-exhibit.md)). An image takes at most 10 pins (`MAX_PINS_PER_IMAGE`). The look and the texts are designed first; the counting is built later in its own issue. Which object and engraving does it show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A hidden exhibit keeps its secret until found, but its hint still points the way through the motif of its engraving (`voice-and-tone.md`).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.

## Considered options

For the object: Martin Schongauer's _Saint Sebastian_ (c. 1480–1490, National Gallery of Art, CC0), pierced by exactly 10 arrows; the insect drawers of Levinus Vincent's cabinet in Haarlem; Wenceslaus Hollar's _Lacemaker_ (1636, Rijksmuseum, CC0), with a lace pillow held by pins; a pincushion.

For the crop of the insect drawers: the tilted left drawer with butterflies and a large beetle; the middle drawer with butterflies; the right drawer with other insects; the whole plate with the table of drawer numbers; all three drawers padded with generated wall.

For the name: "Pinakoteka motyli"; "Motyle Levinusa Vincenta"; "Szuflady z Haarlemu".

For the hint: "Kolekcjoner motyli nie żałuje szpilek."; "W pinakotece każdy szczegół ma swoją szpilkę."; "Najpiękniejsze okazy trzymają się na wielu szpilkach."; "Motyle nie odlecą, jeśli tylko dobrze je przyszpilić."

For what it was awarded for: "Za dziesięć pinezek na jednym obrazie."; "Za komplet pinezek na jednym obrazie."

For the curiosity: the cabinet as a sight of Amsterdam and Haarlem visited by Peter the Great, with the drawers likened to embroidery; Joanna van Breda's drawers and the allegories of Embroidery and Painting on the first plate of the catalogue.

## Decision outcome

Chosen by the owner in ATL-525.

### Display case

- Object: the insect drawers. The owner first wanted a pincushion, but no public-domain engraving shows one as its main object: in the prints of the Rijksmuseum whose descriptions name one it is a small detail on a wall or a table (Christiaan Lodewijk van Kesteren's _Tailor's Workshop_, 1861; Abraham Bosse's _La Dame réformée_, 1633), and the one print where it is large, _La Modiste_ (1832), is a coloured lithograph. Hollar's _Lacemaker_ shows the pins only on a close look, and _Saint Sebastian_ repeats the arrow of "Strzała putta".
- Engraving: plate I of Levinus Vincent's catalogue _Elenchus tabularum, pinacothecarum, atque nonnullorum cimeliorum_ (Haarlem, 1719), inscribed "Pinacoteca 1. TAB. I", in the scan of the University of Strasbourg on Wikimedia Commons, which files it with the second volume of _Wondertooneel der Nature_ (1715); the plate is identified by the [Royal Society](https://pictures.royalsociety.org/image-rs-13827). The crop of the tilted left drawer with butterflies and a large beetle in the corner, variant `vincent-butterfly-drawer-left` in `tools/exhibit-art/manifest.json`; the middle and the right drawer stay there as alternatives, the whole plate and the padded three drawers as rejected.
- Credit: „Pinacoteca 1”, plansza z katalogu Levinusa Vincenta, 1719.
- Exhibit code: `pinacotheca`.
- Name "Pinakoteka motyli", after the inscription of the plate and the drawers of butterflies.
- The story of the object: "Plansza z katalogu Levinusa Vincenta z 1719 roku pokazuje szuflady jego haarlemskiego gabinetu, w których owady przypinano drobnymi szpilkami według wzoru rozrysowanego na siatce." The pinning follows the [Public Domain Review](https://publicdomainreview.org/essay/redressing-the-balance-levinus-vincents-wonder-theatre-of-nature), the grid drawn on the base of each drawer the [Princeton University Library](https://marquandrarebooks.princeton.edu/?p=245).
- The hint while hidden: "Motyle nie odlecą, jeśli tylko dobrze je przyszpilić.", the owner's own text.
- What it was awarded for: "Za komplet pinezek na jednym obrazie.", which stays true if the limit of pins changes.
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                                             | Source                                                                         |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1    | Przy szufladach z owadami w gabinecie Levinusa Vincenta, kupca tkanin, pracowała jego żona Joanna van Breda, chwalona za ich artyzm; porównywano je do wzorów haftu. Na rycinie otwierającej katalog ich zbiorów kobieta uosabiająca Haft wyszywa igłą wzór w jednej z szuflad. Naprzeciw niej postać Malarstwa trzyma pędzel, wzór i drugą szufladę. | [Princeton University Library](https://marquandrarebooks.princeton.edu/?p=245) |

The curiosity avoids the words "alegoria" and "frontyspis", which the owner found unclear. The story of Peter the Great kneeling before the cabinet is left out: it is Vincent's own account, retold by a visitor, and the Princeton page does not tell it.

### Counting

Settled with the owner in ATL-533.

- The exhibit `pinacotheca` counts the most pins on one image of an artwork outside the trash. It has one tier, at 10 (`MAX_PINS_PER_IMAGE`), and gives 50 points once as an easter egg, like the other hidden exhibits.
- Pins and images are deleted for good, so only the pins an image holds now count: a learner who went down from 10 pins to 9 before the release gets the exhibit only on reaching 10 again. Once unlocked, it stays, like every tier.
- An image of an artwork in the trash does not count, like the images of "Własne oko"; it counts again once the artwork is restored.
- Its place is 16, at the end of the display case after "Paszcza prawdy". The place only orders the display case and is not stored, so the exhibits added later can renumber it.
- The career is refreshed right after a new pin fills an image, so the menu icon flashes while the learner is still on the image, as after a sent idea for "Paszcza prawdy". Other pin saves do not refresh it.

### Consequences

- Good: the needle of Embroidery and the pinned drawers keep the owner's first idea of a pincushion, and the name plays on the pins in "pinakoteka".
- Good: the engraving is new to the display case, a natural history cabinet rather than a scene with a figure.
- Bad: the butterflies are small and the scan is a page of a book, so the engraving reads less clearly than the others.

## More information

Designed in ATL-525 from the idea ATL-516; built, with the counting, in ATL-533. The WebP images go to `apps/web/static/exhibits/pinacotheca/` with `exhibit-art publish --only pinacotheca` once the exhibit exists in the app and the database.
