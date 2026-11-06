# 0196. Show an artwork seen twice as the Trevi Fountain

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

The owner wants a hidden single-tier exhibit of the display case for an artwork the learner has seen in person on two different visits, a returning admirer, like "Paszcza prawdy" and "Pinakoteka motyli" ([ADR-0187](0187-reward-a-sent-idea-with-a-hidden-exhibit.md), [ADR-0193](0193-show-an-image-full-of-pins-as-a-butterfly-pinacotheca.md)). "Na żywo" counts the artworks seen in person, each once. The look and the texts are designed first; the counting is built later in its own issue. Which object and engraving does it show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A hidden exhibit keeps its secret until found, but its hint still points the way through the motif of its engraving (`voice-and-tone.md`).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.

## Considered options

For the object: the Trevi Fountain in Giovanni Battista Piranesi's _Veduta della vasta Fontana di Trevi_ (Vedute di Roma, Rijksmuseum, CC0), after the legend that a visitor who throws a coin into it comes back to Rome; a copyist's easel in Winslow Homer's wood engraving _Art-Students and Copyists in the Louvre Gallery, Paris_ (Harper's Weekly, 1868, Cleveland Museum of Art, CC0), after the copyists who came back to the same painting day after day; Rembrandt's etching _The Return of the Prodigal Son_ (1636, National Gallery of Art, CC0).

For the crop of the fountain: the central niche with the statue of Oceanus and the tritons with their horses; the basin with visitors at the balustrade; the wide palace façade.

For the name: "Fontanna di Trevi"; "Moneta z Fontanny di Trevi".

For the hint: "Kto rzuci monetę przez ramię, ten jeszcze tu wróci."; "Prawdziwy wielbiciel zawsze wraca do źródła."; "Moneta w fontannie to obietnica, którą trzeba dotrzymać."; "Do tej samej rzeki nie wejdziesz dwa razy, ale do tej samej fontanny – czemu nie?"; "Ocean odpływa, ale zawsze wraca."; "Jedna moneta to dopiero obietnica powrotu."; "Kto raz napił się z Trevi, ten jeszcze tu wróci."; "Zakochani wracają, przechodnie tylko patrzą."

For what it was awarded for: "Za powrót do tego samego dzieła."; "Za dzieło zobaczone na żywo podczas dwóch wizyt."

## Decision outcome

Chosen by the owner in ATL-530.

### Display case

- Object: the Trevi Fountain. Homer's copyists show a second Louvre next to "Salon w Luwrze", and the return of the prodigal son is a scene that does not read as an object or a place; both stay as candidates for later exhibits.
- Engraving: Giovanni Battista Piranesi, _Veduta della vasta Fontana di Trevi anticamente detta l'Acqua Vergine_, from the Vedute di Roma, dated 1751 by the [Harvard Art Museums](https://www.harvardartmuseums.org/collections/object/237592), in the Rijksmuseum print RP-P-1941-600 on Wikimedia Commons. The crop of the central niche with the statue of Oceanus and the tritons with their horses, variant `piranesi-trevi-neptune` in `tools/exhibit-art/manifest.json`; the basin stays there as an alternative, the façade as rejected. Piranesi is the second engraver of the case to appear twice, after "Świątynia della Tosse".
- Credit: Giovanni Battista Piranesi, „Widok Fontanny di Trevi”, ok. 1751.
- Exhibit code: `trevi_fountain`.
- Name "Fontanna di Trevi", the name of the place, like "Praski orloj".
- The story of the object: "Giovanni Battista Piranesi wyrył Fontannę di Trevi około 1751 roku, jedenaście lat przed jej ukończeniem, z posągiem Oceana w centralnej niszy." The fountain was built from 1732 to 1762 to the design of Nicola Salvi, per the [Sovrintendenza Capitolina](https://www.sovraintendenzaroma.it/i_luoghi/roma_medioevale_e_moderna/fontane/fontana_di_trevi_mostra_dell_acqua_vergine).
- The hint while hidden: "Prawdziwy wielbiciel zawsze wraca do źródła."
- What it was awarded for: "Za dzieło zobaczone na żywo podczas dwóch wizyt."
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                    | Source                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 1    | Fontanna di Trevi to wylot akweduktu Aqua Virgo, który Agryppa, zięć cesarza Augusta, otworzył w 19 roku p.n.e. Według legendy nazwę dała mu dziewczyna, która wskazała źródła żołnierzom szukającym wody. To jedyny z jedenastu głównych akweduktów starożytnego Rzymu, który działa nieprzerwanie do dziś. | [Sovrintendenza Capitolina](https://www.sovraintendenzaroma.it/i_luoghi/roma_antica/monumenti/acquedotto_vergine) |

The coin legend stays out of the curiosity: the sources that tell it disagree on how it began (a parting draught of the water, a coin in the 19th century, the film _Three Coins in the Fountain_ of 1954), and none states it as a fact.

### Consequences

- Good: the hint plays on the source of the aqueduct, so the curiosity answers it once the exhibit is found.
- Good: the fountain is a place every visitor of Rome knows, so the engraving reads at a glance.
- Bad: Piranesi appears twice in the case.

## More information

Designed in ATL-530 from the idea ATL-521; the build, with the counting, is ATL-545. The WebP images go to `apps/web/static/exhibits/trevi_fountain/` with `exhibit-art publish --only trevi_fountain` once the exhibit exists in the app and the database.
