# 0197. Show three places in one day as the seven-league boots

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

The owner wants a hidden single-tier exhibit of the display case for three different places of the chronicle visited on the same day, like "Paszcza prawdy", "Pinakoteka motyli" and "Fontanna di Trevi" ([ADR-0187](0187-reward-a-sent-idea-with-a-hidden-exhibit.md), [ADR-0193](0193-show-an-image-full-of-pins-as-a-butterfly-pinacotheca.md), [ADR-0196](0196-show-an-artwork-seen-twice-as-the-trevi-fountain.md)). "Kronika" and "Globus podróżnika" count the places and countries visited, not the visits of one day. The look and the texts are designed first; the counting is built later in its own issue. Which object and engraving does it show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A hidden exhibit keeps its secret until found, but its hint still points the way through the motif of its engraving (`voice-and-tone.md`).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.

## Considered options

For the object: the seven-league boots in Gustave Doré's plate for Charles Perrault's _Le Petit Poucet_ (1862), where Tom Thumb pulls the boots off the sleeping ogre; Mercury's winged sandals in Hendrick Goltzius's _Marcurius_ after Polidoro da Caravaggio (1592, Rijksmuseum, CC0) or in the Goltzius workshop's _Mercury and his children_ (1596, Rijksmuseum, CC0); Phileas Fogg in Alphonse de Neuville's and Léon Benett's illustrations for _Around the World in Eighty Days_ (1872), the frontispiece portrait or the elephant ride.

For the crop of the boots: both boots of the ogre with Tom Thumb and the brothers on the slope behind; a close view of one boot and Tom Thumb; a wider view with the ogre's body, a tree and the landscape.

For the name: "Siedmiomilowe buty"; "Buty olbrzyma".

For the hint: "Siedem mil to tylko jeden krok, jeśli ma się odpowiednie buty."; "W dobrych butach jeden dzień wystarczy na pół świata."; "Olbrzym śpi, a jego buty czekają na kogoś niespokojnego."; "Buty olbrzyma pasują każdemu, kto się spieszy."; "Siedem mil przed śniadaniem, siedem po obiedzie i siedem przed kolacją."; "Tomcio zdążył przed nocą. A Ty?"; "Olbrzymom wystarczy jeden krok, sprytnym – jeden dzień."; "Kto pożyczy buty od olbrzyma, wróci do domu przed zmrokiem."; "Między świtem a zmierzchem da się obejść więcej, niż się wydaje."; "Olbrzymowi na siedem mil wystarczy jeden krok, sprytnemu – jeden dzień."; "Olbrzymowi wystarczy jeden krok, sprytnemu – jeden dzień."

For what it was awarded for: "Za trzy miejsca odwiedzone jednego dnia."; "Za trzy wizyty jednego dnia."; "Za trzy muzea odwiedzone jednego dnia."

## Decision outcome

Chosen by the owner in ATL-529.

### Display case

- Object: the seven-league boots. Mercury's sandals are a small detail of their engravings, and Neuville and Benett already show the modern era; both stay as candidates for later exhibits.
- Engraving: Gustave Doré's plate for Perrault's _Le Petit Poucet_ in _Les Contes de Perrault_ (Paris, Hetzel, 1862, per the [Morgan Library](https://www.themorgan.org/printed-books/52978)), a wood engraving cut by others after his drawing, in the scan `Le Petit Poucet (136548020).jpg` on Wikimedia Commons. The crop of both boots with Tom Thumb, variant `dore-boots-legs` in `tools/exhibit-art/manifest.json`; the close and the wide crop stay there as alternatives.
- Credit: Gustave Doré, ilustracja do „Tomcia Palucha” Charles’a Perraulta, 1862.
- Exhibit code: `seven_league_boots`.
- Name "Siedmiomilowe buty".
- The story of the object: "Na drzeworycie według Gustave’a Doré z 1862 roku Tomcio Paluch ściąga śpiącemu olbrzymowi siedmiomilowe buty."
- The hint while hidden: "Olbrzymowi wystarczy jeden krok, sprytnemu – jeden dzień.", the owner's own text in the singular, after the one ogre and the one clever boy of the tale.
- What it was awarded for: "Za trzy muzea odwiedzone jednego dnia." The owner chose "muzea" knowingly as a simplification: the chronicle also holds other kinds of places, and how the build counts them is settled in its issue.
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                  | Source                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1    | W baśni Charles’a Perraulta buty olbrzyma były zaczarowane: rosły i malały, dopasowując się do nóg tego, kto je włożył. Według jednego z dwóch zakończeń Tomcio został w nich królewskim gońcem i jeszcze tego samego wieczoru przyniósł królowi wieści od armii oddalonej o dwieście mil. | [BnF Essentiels](https://essentiels.bnf.fr/fr/extrait/a4e7265f-26a5-43ff-9fb2-924a75411cd5-bottes-sept-lieues-tresor-petit-poucet) |

The curiosity follows the BnF's extract of the 1697 text and its note that Perrault kept both endings; the text of the tale itself is not a source of the kind `voice-and-tone.md` allows.

### Consequences

- Good: the curiosity answers the hint once the exhibit is found: the clever boy crosses two hundred leagues there and back in one day.
- Good: Doré is new to the display case, and his wood engravings read clearly at a small size.
- Bad: the award names museums while the counting may take other places of the chronicle too.

## More information

Designed in ATL-529 from the idea ATL-520; the build, with the counting, is ATL-546. The WebP images go to `apps/web/static/exhibits/seven_league_boots/` with `exhibit-art publish --only seven_league_boots` once the exhibit exists in the app and the database.
