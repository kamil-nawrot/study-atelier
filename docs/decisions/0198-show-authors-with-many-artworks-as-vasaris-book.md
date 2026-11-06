# 0198. Show authors with many artworks as Vasari's book

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

The owner wants a tiered exhibit of the display case that rewards depth rather than breadth: the authors of whom the learner has collected many artworks (idea ATL-518, [ADR-0160](0160-gamify-learning-as-a-museum-career.md)). The look, the thresholds and the texts are designed first; the counting is built later in its own issue. What does it count, which object and engraving does it show, how does it read, and what do its curiosities tell?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- Each tier reveals a curiosity on the exhibit's theme, from one source that states every fact (`voice-and-tone.md`).
- The thresholds fit the owner's real collection: on 2026-11-06 it held 299 artworks by 131 authors, two of them with at least 10 artworks (Leonardo da Vinci 20, Vincent van Gogh 14) and the next ones close (Michelangelo 9, Caravaggio 8, Rembrandt and Vermeer 7).

## Considered options

For the object: Jacobus Harrewijn's _Rubens's house in Antwerp_ (1684, Rijksmuseum, CC0); the title page of the second edition of Giorgio Vasari's _Le vite de' più eccellenti pittori, scultori e architettori_ (Florence, Giunti, 1568); a woodcut portrait of an artist from that edition (Fra Filippo Lippi, Rijksmuseum, CC0); the frontispiece of David Teniers's _Theatrum Pictorium_ (c. 1660–1670).

For the crop of the title page: the whole page with its frame; the upper part with the title, the putti and the Medici arms.

For the thresholds: 1, 3, 5, 10, 20; 1, 2, 5, 10, 25.

For the name: "Księga Vasariego"; "Żywoty Vasariego", which names the exhibit after the title of a work.

For the curiosities: the biographies and catalogues of artists only; versatility and records of output only; both.

## Decision outcome

Chosen by the owner in ATL-527.

### Counting

- The exhibit counts the authors with at least 10 artworks in the collection, with five tiers at 1, 3, 5, 10 and 20. The owner reaches the first tier at once and the second with Michelangelo and Caravaggio; 20 stays a long goal. How the build treats the trash, artworks with several authors and merged authors is settled in its issue.

### Display case

- Object: Vasari's book. The title page reads as a book, which the owner preferred over a single artist's portrait, though the text fills much of it; Rubens's house and the Lippi portrait stay in the manifest as candidates, and the Teniers frontispiece tells of a collection of many artists rather than of one.
- Engraving: the title page of _Le vite_, Florence, Giunti, 1568, the second edition, a woodcut, in the scan `Vite.jpg` on Wikimedia Commons, the whole page with its frame, variant `vasari-title-page` in `tools/exhibit-art/manifest.json`; the upper part and the Lippi portrait stay as alternatives.
- Credit: Strona tytułowa „Żywotów najwybitniejszych malarzy, rzeźbiarzy i architektów” Giorgia Vasariego, Florencja 1568.
- Exhibit code: `vasari_lives`.
- Name "Księga Vasariego", an object and whose it is.
- The story of the object: "Strona tytułowa drugiego wydania „Żywotów” Giorgia Vasariego, wydrukowanego we Florencji w 1568 roku razem z drzeworytowymi portretami artystów." The title page itself states the year, the publisher and the portraits ("Con i ritratti loro").
- The counter label: "autorów z co najmniej 10 dziełami", as in "2 z 3 autorów z co najmniej 10 dziełami".
- Theme of the curiosities, a new row in `voice-and-tone.md`: how the whole work of one artist is known: biographies, catalogues of works, versatility and records. The owner found the biographies and catalogues alone too narrow.
- The curiosities of its tiers:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                                                  | Source                                                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | „Żywoty najwybitniejszych malarzy, rzeźbiarzy i architektów” Giorgia Vasariego, zbiór biografii artystów, ukazały się po raz pierwszy w 1550 roku. W drugim wydaniu z 1568 roku Vasari dodał portrety artystów, jedne z pierwszych przykładów takich wizerunków. Książka do dziś jest jednym z najważniejszych źródeł do badań nad artystami tamtej epoki. | [Uffizi](https://www.uffizi.it/en/artworks/vasari-giunti-en)                                                                              |
| 2    | W katalogu grafik Rembrandta z 1751 roku, opracowanym przez Edme-François Gersainta, jego akwaforta z 1636 roku figuruje jako portret Menasseha ben Izraela, autora książki „Piedra Gloriosa”. Kolejni autorzy katalogów powtarzali to bez sprawdzania, choć badacze od dawna twierdzą, że to wcale nie on.                                                | [Rembrandthuis](https://www.rembrandthuis.nl/en/kronieken/rembrandts-etchings-for-menasseh-ben-israels-piedra-gloriosa-a-mystery-solved/) |
| 3    | Johannes Vermeer, nazywany Sfinksem z Delftu, pozostawił po sobie wyjątkowo mało dzieł: Rijksmuseum liczy jego dorobek na 37 obrazów. Na wystawę w 2023 roku muzeum zgromadziło co najmniej 28 z nich, wypożyczonych z Europy, Stanów Zjednoczonych i Japonii.                                                                                             | [Rijksmuseum](https://www.rijksmuseum.nl/en/press/press-releases/rijksmuseum-announces-list-of-vermeer-paintings)                         |
| 4    | Muzeum Wiktorii i Alberta w Londynie przechowuje pięć notesów Leonarda da Vinci, oprawionych w trzy tomy nazywane Kodeksem Forstera. Między zapisanymi pismem lustrzanym notatkami o geometrii, ciężarach i hydraulice są w nich szkice końskich nóg i notatki związane zapewne z „Ostatnią Wieczerzą”.                                                    | [V&A](https://www.vam.ac.uk/articles/leonardo-da-vincis-notebooks)                                                                        |
| 5    | Pablo Picasso to według Księgi rekordów Guinnessa najpłodniejszy malarz w historii. W ciągu 75 lat pracy stworzył około 13 500 obrazów i projektów, 100 000 grafik, 34 000 ilustracji książkowych oraz 300 rzeźb i ceramik.                                                                                                                                | [Guinness World Records](https://www.guinnessworldrecords.com/world-records/most-prolific-painter)                                        |

### Consequences

- Good: the exhibit rewards studying one artist closely, which no other exhibit does.
- Good: the curiosities move from the first biographies to the largest body of work, so the last tier crowns the deepest collector.
- Bad: the title page is mostly text and reads less clearly at a small size than the other engravings.

## More information

Designed in ATL-527 from the idea ATL-518; the build, with the counting, is ATL-548. The WebP images go to `apps/web/static/exhibits/vasari_lives/` with `exhibit-art publish --only vasari_lives` once the exhibit exists in the app and the database.
