# 0264. Show relations as Arachne's web

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

Version 0.23 lets the learner relate artworks and authors with typed relations ([ADR-0259](0259-relate-artworks-and-authors-with-typed-relations.md)). No exhibit of the display case counts them. The owner chose to cover the new area with a tiered exhibit. The look and the texts are designed first; the counting is built later in its own issue.

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after a thing or a place it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md), `voice-and-tone.md`).
- The engraving should show a net of connections.
- The name avoids "powiązania", the name of the feature it rewards.
- A tiered exhibit's curiosities follow its own theme, one per tier, with a checked source each.

## Considered options

For the object:

- Robert Péril, sheet three of the family tree of the House of Habsburg, woodcut, Antwerp 1533–1535, Rijksmuseum RP-P-1927-426-3: a literal tree of relations, but heavy with text and dominated by the enthroned king. Kept for a later exhibit.
- Theseus before the entrance of the labyrinth with the thread tied to his leg, 1759, Rijksmuseum RP-P-OB-50.882: a small scene on a large sheet with handwritten notes.
- Virgil Solis, Theseus and Ariadne at the labyrinth, 1569, Rijksmuseum RP-P-OB-22.083(R): the labyrinth is small in a 10:13 crop.
- A vault with a cobweb after Hans Weiditz (chosen).

For the crop: the web with the vault and the right pillar (`weiditz-web`); the whole woodcut padded with paper (`weiditz-web-whole`); the web alone (`weiditz-web-close`), the softest at the size of the scan.

For the name: "Sieć Arachne", "Pajęczyna Cycerona", "Pajęczyna pod sklepieniem", "Sklepienie z pajęczyną", "Pajęcza sieć". The meaning of the woodcut in the book could not be confirmed (the old saying that laws are like cobwebs was a guess), so the name does not lean on it.

For the counting: all kinds of relations; only the specific kinds, without "Powiązane z" and "Powiązani z".

For the seventh curiosity: Jan Brueghel as the son of Pieter Bruegel and the subject of Rubens's family portrait (National Gallery); the civet cat in _The Sense of Smell_; the friendship of Brueghel and Rubens and _The Five Senses_ (chosen).

## Decision outcome

Chosen by the owner in ATL-689.

### Counting

- A tiered exhibit counting the relations between artworks and between authors together, of every kind including the loose ones, with seven tiers at 1, 5, 10, 25, 50, 100 and 250. No learner had relations when the exhibit was designed, so the thresholds were not checked against data. ADR-0160 has no anti-abuse rules, and one count is easier to read than a count of some kinds. What happens to a relation of an artwork in the trash or of a merged author is settled in the build's issue.

### Display case

- Object: a cobweb spanned under a vault, with flies and larger insects caught in it.
- Engraving: anonymous after a design by Hans Weiditz (II), _Gewelf met spinnenweb_, woodcut used in the German Cicero _Officia M.T.C._ translated by Johann von Schwarzenberg, published by Heinrich Steiner, Augsburg 1531, Rijksmuseum RP-P-1874-11-72-1 (dated 1514–1531), CC0, Commons `Gewelf met spinnenweb, RP-P-1874-11-72-1.jpg`. The web with the vault and the right pillar, variant `weiditz-web` in `tools/exhibit-art/manifest.json`; the other two crops stay as alternatives.
- Credit: Według Hansa Weiditza, wyd. Heinrich Steiner, „Sklepienie z pajęczyną”, 1514–1531.
- Exhibit code: `vault_cobweb`.
- The room of the display case: Sala główna, after `boncompagni_academy` ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).
- Name "Sieć Arachne", a thing and whose it is: in Ovid the weaver Arachne was turned into a spider, so every cobweb is hers.
- The counter label: "powiązań między dziełami i autorami".
- The story of the object: "Na drzeworycie według Hansa Weiditza do niemieckiego wydania Cycerona pajęczyna rozpięta pod sklepieniem łowi muchy i większe owady."
- Theme of the curiosities, a new row in `voice-and-tone.md`: how artworks and artists are connected: masters and pupils, workshops, pendants, copies, versions, influences and families.
- The curiosities of its tiers:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                   | Source                                                                                                                                                                                                                                                                                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | „Chrzest Chrystusa” z Uffizi powstał około 1470–1475 roku w pracowni Andrei del Verrocchia. Według Giorgia Vasariego pomagał mu młody uczeń, Leonardo, który anioła po lewej namalował tak zręcznie, że zdenerwował starszego mistrza. Dziś badacze przypisują Leonardowi także pejzaż, złote światło i postać Chrystusa.   | [Uffizi](https://www.uffizi.it/en/artworks/verrocchio-leonardo-baptism-of-christ)                                                                                                                                                                                                                          |
| 2    | Peter Paul Rubens dostawał o wiele za dużo zamówień, by wykonać je sam, więc zbudował dużą pracownię dla uczniów i pomocników. Jego warsztat wytworzył oszałamiającą liczbę dzieł: w latach 30. XVII wieku sam król Hiszpanii Filip IV zamówił u niego ponad 80 obrazów.                                                    | [National Gallery](https://www.nationalgallery.org.uk/artists/peter-paul-rubens)                                                                                                                                                                                                                           |
| 3    | W 1634 roku Rembrandt namalował dla świeżo poślubionych Martena Soolmansa i Oopjen Coppit parę portretów, jedyne pendanty w tak monumentalnym formacie w swoim dorobku. W 2016 roku Holandia i Francja kupiły je wspólnie, a muzea umówiły się, że obrazy zawsze będą pokazywane razem, na zmianę w Rijksmuseum i w Luwrze. | [Rijksmuseum](https://www.rijksmuseum.nl/en/press/press-releases/rembrandts-marten-and-oopjen-naar-het-louvre)                                                                                                                                                                                             |
| 4    | Luwr jest ostatnim muzeum, które ma biuro kopistów; działa ono od otwarcia muzeum w 1793 roku. Kopiowanie dzieł innych było szkołą wielu mistrzów, od Matisse’a po Picassa.                                                                                                                                                 | [Louvre](https://www.louvre.fr/expositions-et-evenements/expositions/copistes)                                                                                                                                                                                                                             |
| 5    | Leonardo namalował „Madonnę w grocie” dwa razy: pierwsza wersja jest w Luwrze, druga w National Gallery. Nie wiadomo na pewno dlaczego. Być może sprzedał pierwszy obraz komuś innemu, gdy mediolańskie bractwo, które go zamówiło, nie chciało dopłacić za droższe materiały.                                              | [National Gallery](https://www.nationalgallery.org.uk/paintings/leonardo-da-vinci-the-virgin-of-the-rocks)                                                                                                                                                                                                 |
| 6    | Vincent van Gogh zebrał razem z bratem Theo setki japońskich drzeworytów. W 1887 roku skopiował z jednego z nich kwitnący sad śliwowy Hiroshigego, ale czarny i szary pień drzewa zamienił na czerwony i niebieski, a pomarańczowe ramki z japońskimi znakami dodał tylko dla ozdoby.                                       | [Van Gogh Museum, gallery texts](https://www.vangoghmuseum.nl/assets/b023267d-2d87-43a6-88bf-956d4213f2cc?c=52f4bba580232396dbe6bf84801c5783b3e42cd25daff1bd91fef735c9d7bc52)                                                                                                                              |
| 7    | Jan Brueghel starszy i Peter Paul Rubens przyjaźnili się i malowali razem na jednym obrazie: Brueghel pejzaże i dworskie sceny, Rubens postacie. Tak powstał cykl „Pięć zmysłów” w Prado, jedna z ich najbardziej udanych współprac: w dworskie sceny Brueghla Rubens wstawił alegorie zmysłów.                             | Prado, [_The Vision of Saint Hubert_](https://www.museodelprado.es/en/the-collection/art-work/the-vision-of-saint-hubert/79d8949b-15e5-4de2-8aad-6b9e2bdaf95f) and [_The Sense of Smell_](https://www.museodelprado.es/en/the-collection/art-work/the-sense-of-smell/adff981e-a317-4152-9e04-05ada13be226) |

The Prado pages refused automated reading, so the owner pasted their text. The seventh curiosity rests on two pages of the same museum, an exception to one source per curiosity: one states the friendship and the division of the work, the other the series. The fourth does not say that Matisse and Picasso copied in the Louvre, since the page does not. The sixth comes from the museum's gallery texts, as its collection pages render with a script.

### Consequences

- Good: the exhibit rewards the work of relating records, and the web reads at once as a net of connections.
- Good: the curiosities follow the kinds of relations the app offers: pupil, workshop, pendant, copy, version, influence and collaboration.
- Bad: the thresholds were not checked against real data.
- Bad: the scan is small (1365 px wide), so the woodcut cannot be cropped closer without losing its line.

## More information

Designed in ATL-689; the build, with the counting, is ATL-694. The WebP images go to `apps/web/static/exhibits/vault_cobweb/` with `exhibit-art publish --only vault_cobweb` once the exhibit exists in the app and the database.
