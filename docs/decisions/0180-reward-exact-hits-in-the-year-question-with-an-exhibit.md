# 0180. Reward exact hits in the year question with an exhibit

- Status: accepted
- Date: 2026-11-04

## Context and problem statement

The year question of the review ([ADR-0178](0178-ask-for-the-year-and-the-chronological-order-in-the-review.md)) rates a guess "Wiem" within 5% of the era's length, which is about 15 years in the modern era. A guess on the very year is rarer and worth noticing, and the owner wants an exhibit of the display case ([ADR-0160](0160-gamify-learning-as-a-museum-career.md), [ADR-0162](0162-show-the-exhibits-as-toned-engravings-in-frames.md)) to count such hits. The recording of [ADR-0179](0179-draw-the-questions-about-time-and-give-a-point-for-a-right-answer.md) keeps only the rating of a year answer, which cannot tell an exact hit from a near one. What counts as an exact hit, how is it recorded, and how does the exhibit look and read?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked.
- Editing an artwork's year later does not change what an answer was.
- The engraving follows the look of the other exhibits and comes from a public-domain or CC0 source.
- Nothing closes the way to statistics of the year answers later.

## Considered options

For an artwork dated with a span of years: any year inside the span is an exact hit; only artworks with a single year count; a span of at most 10 years counts like a single year.

For the recording: a flag of an exact hit on the answer; the guessed year and how far it missed, both on the answer.

For the tiers: 1, 5, 25, 50, 100, 250; 1, 10, 50, 100, 250, 500; 1, 5, 10, 25, 50, 100.

For the name: "Strzała w dziesiątce"; "Tarcza Vinkelesa"; "Tarcza strzelecka"; "Strzała Vinkelesa".

For the place: visible right after "Pamięć"; visible after "Kalendarium"; visible at the end; hidden until found.

For the engraving: Reinier Vinkeles' putto looking at an arrow in the bullseye of a target, close or wide; Dürer's "Apollo and Diana"; archers shooting at a herm after Michelangelo; Tycho Brahe's mural quadrant.

## Decision outcome

Chosen by the owner in ATL-480: any year inside the span, tiers 1, 5, 25, 50, 100, 250, the name "Strzała Vinkelesa", visible right after "Pamięć", the close crop of Vinkeles' putto, the texts and the six curiosities below. The recording of the guessed year and the miss was proposed by Claude and accepted with this record.

### Counting

- An exact hit is a saved answer to the year question whose guess lies inside the artwork's years: the very year of an artwork with one year, or any year of a span, both ends included.
- The exhibit `bullseye` counts every exact hit, so the same artwork hit again counts again; its schedule decides when it is asked.
- A free round saves nothing ([ADR-0084](0084-free-review-after-the-day-is-done.md)), so its hits do not count.
- Tiers: 1, 5, 25, 50, 100, 250. A tier gives no points, as for every tiered exhibit.

### Recording

- `record_review` saves a year answer with the guessed year (`guessed_year`) and how many years it missed the artwork's years at that moment (`year_miss`, 0 inside them) on its `review_log` row; both are empty for the other facets.
- The exhibit counts the `date` rows of `review_log` with `year_miss = 0`, so a later change of the artwork's year or its deletion does not change past hits.
- Export and import carry both columns with the review log.
- The year question ships in the same version, so there are no earlier answers to fill in.

### Display case

- Place: right after "Pamięć"; the exhibits after it move one place down.
- Name "Strzała Vinkelesa"; the story of the object: "Reinier Vinkeles (1741–1816), amsterdamski rytownik, wyrył putta, który ogląda strzałę wbitą w sam środek tarczy."; the counter "trafień co do roku" ("12 z 25 trafień co do roku"). The Rijksmuseum gives Vinkeles' dates as 1751–1816, but his birth in Amsterdam on 19 June 1741 is recorded in [Elsevier's Geïllustreerd Maandschrift](https://www.dbnl.org/tekst/_els001193301_01/_els001193301_01_0135.php), as in most sources.
- Engraving: the close crop of "Putto bekijkt een pijl in de roos van een schietschijf" by Reinier Vinkeles (I), Rijksmuseum RP-P-1905-5949, CC0, variant `vinkeles-putto-arrow-in-bullseye-close` in `tools/exhibit-art/manifest.json`; the other candidates stay there as alternatives. Credit: Reinier Vinkeles, „Putto ogląda strzałę w dziesiątce tarczy”.
- A curiosity for each of the six tiers on the theme "dates to the year: works dated exactly and dates that exposed forgeries", apart from the dating methods of "Praski orloj", from the plainest to the most surprising, each checked against its source:

| Tier | Curiosity                                                                                                                                                                                                                                                        | Source                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1    | Na autoportrecie z 1500 roku, który wisi w monachijskiej Alte Pinakothek, Albrecht Dürer umieścił łaciński napis: „Ja, Albrecht Dürer z Norymbergi, przedstawiłem się we właściwych barwach w wieku 28 lat”.                                                     | [Pinakotheken](https://www.sammlung.pinakothek.de/en/artwork/Qlx2QpQ4Xq)                                                 |
| 5    | „Pejzaż” z Gabinetu Rysunków i Rycin Galerii Uffizi, datowany na 5 sierpnia 1473 roku, to pierwsze pewnie datowane dzieło Leonarda da Vinci. Artysta, urodzony w 1452 roku w Vinci, miał wtedy niewiele ponad 20 lat.                                            | [Finestre sull'Arte](https://www.finestresullarte.info/arte-e-artisti/paesaggio-leonardo-da-vinci-analisi-scientifiche)  |
| 25   | Johann Jacob Diesbach uzyskał w Berlinie błękit pruski, próbując zrobić czerwony lak. Kronika z epoki wskazuje rok 1706, a już w 1709 roku Pieter van der Werff użył nowego pigmentu w obrazie „Złożenie do grobu”.                                              | [Swiss National Museum](https://blog.nationalmuseum.ch/en/2026/03/the-swiss-alchemist-who-invented-a-new-shade-of-blue/) |
| 50   | Wolfgang Beltracchi przez 14 lat sprzedawał własne obrazy jako dzieła znanych artystów. Zdradził go „Czerwony obraz z końmi”, rzekomo Heinricha Campendonka z 1914 roku: biel tytanowa w jego farbie w 1914 roku jeszcze nie istniała.                           | [The National](https://www.thenationalnews.com/not-picture-perfect-1.433913)                                             |
| 100  | Mapa Winlandii, którą Uniwersytet Yale ogłosił w 1965 roku jako XV-wieczną, okazała się fałszerstwem. Jej linie i napisy wykonano tuszem z anatazem, formą dwutlenku tytanu stosowaną dopiero od lat 20. XX wieku, choć pergamin pochodzi z lat około 1400–1460. | [Yale News](https://news.yale.edu/2021/09/01/analysis-unlocks-secret-vinland-map-its-fake)                               |
| 250  | Obraz w stylu ludowym podpisany „Sarah Honn” i datowany „5 maja 1866” namalowano na XIX-wiecznym płótnie. Zdradził go olej w farbie, z nadmiarem węgla-14 z prób jądrowych. Fałszerz Robert Trotter przyznał, że namalował go w 1985 roku.                       | [ScienceDaily](https://www.sciencedaily.com/releases/2019/06/190604131221.htm)                                           |

### Consequences

- Good: the exhibit rewards the rarest and most precise answer, which the "Wiem" band does not tell apart.
- Good: the guessed year and the miss allow statistics of the year answers later without another change of the log.
- Bad: two more columns on every year answer, though only the `date` facet fills them.
- Bad: an artwork dated with a wide span, such as a whole century, gives an exact hit more easily than one dated to a year.

## More information

- Designed in ATL-480 and built in ATL-481, after ATL-478, which adds the `date` facet and `record_review` for year answers, and ATL-446, the year question card.
- Curiosities checked and left out: the Oseberg ship burial dated to 834 by its tree rings (a dating method, the theme of the Prague astronomical clock), the Pompeii charcoal inscription of 17 October (the date is still disputed) and the radiocarbon dating of the Shroud of Turin.
