# 0297. Show a swatted painted fly as Giotto's fly

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

The owner wants a hidden exhibit for the room "Krypta", which holds the exhibits for actions outside collecting and learning ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)): "Paszcza prawdy" for a sent idea and "Nocny lichtarz" for the light theme at night. The idea is an easter egg to be spotted: now and then a small painted fly sits on the image on the stage of the artwork view, and a click on it, which swats it away, finds the exhibit. The motif is Giorgio Vasari's anecdote of young Giotto, who painted a fly on a work of his master Cimabue so true to life that Cimabue tried to brush it away. The story is in the 1568 edition of the _Vite_, not in the 1550 one, and names no painting, so no image of the work itself exists. The look and the texts are designed first; the counting is built later in its own issue. Which object and engraving does the exhibit show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.
- The hint of a hidden exhibit works without the engraving and neither opens nor follows the pattern of another hint ([ADR-0231](0231-show-an-exhibition-through-all-six-eras-as-lenoir-s-chapel.md), [ADR-0213](0213-change-the-hint-of-the-alphabet-of-master-es.md)).
- The case already shows insects: insects flying to a candle in "Nocny lichtarz", butterflies in "Pinakoteka motyli" and a web that catches flies in "Sieć Arachne".

## Considered options

For the engraving: Robert Hooke's blue fly from _Micrographia_ (London, 1665), Schem. XXVI, a fly as large as the page, chosen by the owner; Hooke's eyes and head of a grey drone-fly from the same book, Schem. XXIV, very graphic but with the fold of the plate in view; the plate "Aenigma" of _Archetypa studiaque_ by Jacob Hoefnagel after Joris Hoefnagel (1592, Rijksmuseum RP-P-1887-A-11856), where the flies are tiny details; "Bloemen, een vlieg en een slak" (1594, Rijksmuseum RP-P-OB-6878), a flower pattern sheet with a large fly, too close to "Pinakoteka motyli"; George Moutard Woodward and Isaac Cruikshank, "Virtuoso and a fly" (1796, Rijksmuseum RP-P-2015-26-801), a collector over a fly on a book page, where the fly is tiny and the subject is a person. Petrus Christus's _Portrait of a Carthusian_ (1446) with a fly on its painted frame was left out as a painting, not a print.

For the crop of the blue fly: the whole fly from the cleaned Commons scan (`hooke-blue-fly-whole`); the same with a generated wall instead of the paper (`hooke-blue-fly-wall`), whose hatching blurs the wings; the head and thorax close up (`hooke-blue-fly-head`), where the fly is harder to recognise; the whole fly from the Science History Institute's 2880 × 3984 px scan (`shi-blue-fly-whole`, `shi-blue-fly-wide`, `shi-blue-fly-dark`), paler because the text of the other side shows through the paper.

For the name: "Mucha Giotta"; "Mucha Hooke'a"; "Mucha spod mikroskopu".

For the hint: "Mistrz machał ręką, a ona ani drgnęła."; "Cimabue też dał się nabrać."; "Najlepszy żart ucznia zmieści się na czubku nosa."; "Nie każdy gość przychodzi na wernisaż z zaproszeniem.". The owner then asked for a play on "mucha nie siada": "Tu mucha nie siada. Prawie nigdy."; "Nawet tam, gdzie mucha nie siada, czasem przysiądzie."; "Mówią, że tu mucha nie siada. Nie zawsze mają rację."; "Mucha nie siada? Czasem jednak przysiada."; "Gdzie mucha nie siada, tam ją najtrudniej zauważyć."; the owner wrote the chosen one.

For what it was awarded for: "Za odgonienie muchy z obrazu."; "Za machnięcie ręką godne Cimabuego."; "Za przepędzenie nieproszonego gościa z obrazu."; "Za refleks, którego pozazdrościłby Cimabue."; "Za muchę, która jednak usiadła.".

For the curiosity: Samuel Pepys, who saw _Micrographia_ on 2 January 1665, ordered it at once and called it "a most excellent piece…of which I am very proud" (Cambridge University Library, Special Collections blog); Vasari's anecdote of Giotto's fly, which the owner chose to explain the name. The well-known story of Pepys reading the book until 2 a.m. was left out, since no allowed source stating it was found.

## Decision outcome

Chosen by the owner in ATL-757.

### Display case

- Object: the blue fly Robert Hooke showed under the microscope in _Micrographia_; the name ties it to Giotto's painted fly, as "Sieć Arachne" ties a web to its myth.
- Engraving: Robert Hooke, Schem. XXVI, _Micrographia_ (London, J. Martyn and J. Allestry, 1665), public domain, Commons `Hooke-bluefly.jpg` (1176 × 1786 px, a cleaned scan), the whole fly from its antennae to the wings, variant `hooke-blue-fly-whole` in `tools/exhibit-art/manifest.json`; the other crops stay as alternatives. The Science History Institute and the Library of Congress name Hooke alone as its maker; the Royal Society says he "oversaw the engraving process of the plates with great attention", and no engraver is named.
- Credit: Robert Hooke, „Mucha plujka pod mikroskopem”, 1665.
- Exhibit code: `giotto_fly`.
- Name "Mucha Giotta".
- The story of the object: "Robert Hooke w „Mikrografii” (Londyn, 1665) pokazał muchę plujkę powiększoną pod mikroskopem."
- The hint while hidden: "Kolekcja taka, że mucha nie siada. Zazwyczaj."
- What it was awarded for: "Za muchę, która jednak usiadła."
- The room of the display case: Krypta, third, after "Paszcza prawdy" and "Nocny lichtarz" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                    | Source                                                                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Giorgio Vasari, by wysławić nowatorską sztukę Giotta, pisze, że malarz potrafił odręcznie narysować idealne koło. Opowiada też, że Giotto jako uczeń namalował na obrazie swojego mistrza Cimabuego muchę, żeby z niego zakpić, a Cimabue próbował ją potem odgonić z deski. | [Treccani, F. Mercadante, „Leonardo, Gauss, De Mauro tra ‘coloro che sono stati nutriti’”](https://www.treccani.it/magazine/lingua_italiana/speciali/Trame/AG_Mercadante_30.html) |

The source says Vasari "racconta" the story "a scopo chiaramente celebrativo", so the curiosity tells it as Vasari's and not as a fact. It does not say on which part of the figure the fly sat, so the curiosity says only "na obrazie".

### Consequences

- Good: the exhibit rewards spotting rather than a deliberate action, the kind of easter egg "Krypta" was missing.
- Good: the hint plays on a Polish idiom about a flawless thing, and the award closes the joke.
- Bad: a fourth exhibit with insects, and the second in "Krypta" after the insects at the candle of "Nocny lichtarz".
- Bad: the chosen scan is 1176 px wide, cleaned by an unknown hand; the Science History Institute's larger scan stays as an alternative.

## More information

Designed in ATL-757; the build, with how often and where the fly appears, is ATL-760. The WebP images go to `apps/web/static/exhibits/giotto_fly/` with `exhibit-art publish --only giotto_fly` once the exhibit exists in the app and the database.
