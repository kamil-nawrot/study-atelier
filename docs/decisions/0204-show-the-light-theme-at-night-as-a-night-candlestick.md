# 0204. Show the light theme at night as a night candlestick

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

The owner wants a hidden single-tier exhibit of the display case for switching the app to the light theme at night, like a moth drawn to a lamp (idea ATL-514), like "Paszcza prawdy" and "Fontanna di Trevi" ([ADR-0187](0187-reward-a-sent-idea-with-a-hidden-exhibit.md), [ADR-0196](0196-show-an-artwork-seen-twice-as-the-trevi-fountain.md)). The chosen theme is kept only in the browser today, so the build needs a new mechanism. The look and the texts are designed first; the counting is built later in its own issue. Which object and engraving does it show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A hidden exhibit keeps its secret until found, but its hint still points the way through the motif of its engraving (`voice-and-tone.md`).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.
- The owner asked for a moth at a light, the most readable motif.

## Considered options

For the object: Crispijn van de Passe's owl with spectacles, torches and candles, emblem 95 of Gabriel Rollenhagen's _Nucleus emblematum selectissimorum_ (1613, public domain); Diogenes with his lantern (Rijksmuseum RP-P-OB-17.622, and Bernard Picart, 1720, RP-P-OB-57.030, both CC0); Vincent Laurensz. van der Vinne's candle with insects in Adriaan Spinniker's _Leerzaame zinnebeelden_ (1714). No engraving of a moth at a flame was found on Wikimedia Commons or in the Rijksmuseum.

For the crop of the candle: the whole candlestick with its flame, the curtain and the dead insects at its foot; a close view of the flame and the insects around it.

For the name: "Świeca z Haarlemu"; "Lichtarz ze świecą"; "Świeca Spinnikera"; "Świeca z owadami"; "Lichtarz nocnych gości"; "Nocny lichtarz"; "Świeca po zmroku"; "Płomień o północy".

For the hint: "Kto po zmroku szuka jasności, ten wie, co czuje ćma."; "Nie każdy, kogo nocą ciągnie do światła, ma skrzydła."; "Po zmroku światło przyciąga najmocniej."; "Muchy wiedzą, dokąd lecieć, gdy zapada zmrok.".

For what it was awarded for: "Za jasny motyw włączony w środku nocy."; "Za zapalenie światła między 22:00 a 6:00."; "Za zapalenie światła w środku nocy.".

## Decision outcome

Chosen by the owner in ATL-523.

### Counting

- The exhibit is unlocked by switching to the light theme between 22:00 and 6:00. What exactly is recorded, the time zone and a switch made before the release are settled in the build's issue.

### Display case

- Object: a candlestick at night with insects flying to its flame. The owl came close and stays as a candidate; Diogenes's lantern is a small detail of its prints.
- Engraving: Vincent Laurensz. van der Vinne (II), _Vliegen komen af op het licht van een kaars_, an etching of 1714 for Adriaan Spinniker's _Leerzaame zinnebeelden_ (Haarlem and Amsterdam, 1714), Rijksmuseum RP-P-OB-62.370, marked with the Public Domain Mark on its [object page](https://www.rijksmuseum.nl/en/collection/RP-P-OB-62.370). It is not on Commons: `exhibit-art` takes the museum's image through `source_url`. The whole candlestick, variant `van-der-vinne-candle` in `tools/exhibit-art/manifest.json`; the close view stays as an alternative.
- The museum calls the insects flies. The texts say "owady" wherever they can, so the moth of the owner's idea stays open; the credit keeps the title of the work in Polish, like the other credits.
- Credit: Vincent Laurensz. van der Vinne, „Muchy lecą do światła świecy”, 1714.
- Exhibit code: `candle_moths`.
- Name "Nocny lichtarz", an object named for the mood of the scene rather than a place or a person, as the owner asked.
- The story of the object: "Vincent Laurensz. van der Vinne wytrawił w 1714 roku świecę, do której płomienia zlatują się owady, a te, które zginęły, leżą w wosku i na ziemi."
- The hint while hidden: "Po zmroku światło przyciąga najmocniej."
- What it was awarded for: "Za zapalenie światła w środku nocy.", the owner's own text.
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                | Source                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1    | Rycina Vincenta Laurensza van der Vinne ilustruje „Leerzaame zinnebeelden” Adriaana Spinnikera, zbiór pouczających emblematów wydany w Haarlemie i Amsterdamie w 1714 roku. Owady, które giną od żaru i w wosku świecy, są w nim obrazem ludzi lekceważących ostrzeżenia, którzy przepadają przez marne, ziemskie życie. | [Rijksmuseum](https://www.rijksmuseum.nl/en/collection/RP-P-OB-62.370) |

### Consequences

- Good: the candle and the insects read at once as "drawn to the light", the owner's idea.
- Bad: the exhibit needs a new record of the theme switch in the database before it can be counted.
- Bad: the insects are flies by the museum's account, so the moth lives only in the hint's spirit and the owner's idea.

## More information

Designed in ATL-523 from the idea ATL-514; the build, with the counting, is ATL-552. The WebP images go to `apps/web/static/exhibits/candle_moths/` with `exhibit-art publish --only candle_moths` once the exhibit exists in the app and the database.
