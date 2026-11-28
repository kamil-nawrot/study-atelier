# 0352. Search Polish Wikipedia and spelling variants when Wikidata finds nothing

- Status: proposed
- Date: 2026-11-28

## Context and problem statement

For 204 of the 434 artworks of the owner's production collection, the image suggestions of the artwork form show no candidate after the confidence rule of [ADR-0345](0345-show-only-confident-image-suggestions.md). The owner's titles are often descriptive ("Brama Holsztyńska w Lubece", "Chrzest Chrystusa – mozaika w kopule baptysterium Arian w Rawennie") or spelled differently from Wikidata ("Auriga delficki" for "Auriga z Delf", "Brama Lwic" for "Lwia Brama") ([ATL-860](https://linear.app/kamil-nawrot/issue/ATL-860/find-artworks-wikidata-misses-through-polish-wikipedia)).

How should the search try harder when it finds nothing, and still show only confident candidates?

## Decision drivers

- A title that finds something today must find the same candidates; the extra search runs only when the dialog would be empty.
- Every new candidate passes the confidence rule of ADR-0345.
- No new request from the browser to a Wikimedia service and no new UI text.
- The extra candidates must be worth the wait and the noise, measured on the owner's collection.

## Considered options

1. Polish Wikipedia search for the title, each page mapped to its Wikidata item (the issue measured 150 of 199 empty titles with a page).
2. A simplified title: without a trailing place ("w Lubece", "we Florencji") and without the part after a dash, a comma or a bracket, searched in Wikidata.
3. The same simplified title searched in Polish Wikipedia.
4. The fuzzy operator of the Wikidata full-text search (`word~` for words of 4 letters or more), for spelling variants.

Each source was measured on its own on the 200 empty titles without a known match and on the 93 artworks with a Wikidata match the owner had accepted ("known"). The known matches show how often a source names the right item first.

| Source                         | Empty titles with a candidate (of 200) | Their cards | Known: right item first | Known: right item among them |
| ------------------------------ | -------------------------------------- | ----------- | ----------------------- | ---------------------------- |
| 1. Wikipedia, 5 pages          | 120                                    | 233         | 71 of 86                | 75                           |
| 1. Wikipedia, 3 pages          | 111                                    | 169         | 72 of 86                | 75                           |
| 2. Simplified title, Wikidata  | 47                                     | 221         | 72 of 90                | 78                           |
| 3. Simplified title, Wikipedia | 130                                    | 287         | 58 of 88                | 67                           |
| 4. Fuzzy search                | 16                                     | 17          | 84 of 90                | 86                           |

## Decision outcome

Chosen options: 1 with 3 pages, and 4, because together they fill more than half of the empty dialogs with little noise; the simplified title (2 and 3) is left out.

- When the first search leaves no confident candidate, the app sends one more SPARQL query to the Wikidata Query Service. It runs the Polish Wikipedia search through the query service (`wikibase:mwapi` with the `pl.wikipedia.org` endpoint), reads the Wikidata item of the first three pages, and adds the Wikidata full-text search with the fuzzy operator. Wikipedia pages come first. The items go through the same confidence rule, author match and ordering as the first search.
- The fourth and fifth Wikipedia pages were almost always noise (another cathedral, a museum of the town); only "King's College Chapel" and "Zwiastowanie" were right among them.
- The simplified title found mostly other artworks of a generic name: "Chrzest Chrystusa" eight times for a mosaic in Ravenna, "Pantokrator" eight times for four different works, "Domus Aurea" for "Złoty Dom w Wenecji", "Katedra Notre-Dame w Paryżu" for "Katedra w Kołobrzegu". Among the titles that only it filled, Palazzo Pubblico was the one right item.
- The add form fills in a single candidate of the further search by itself only when its creator matches an author; a single candidate without an author is offered, not filled in, because 48 of the 118 newly filled dialogs hold one candidate and many of them are the place of the artwork rather than the artwork ([R-110](../product/requirements.md#images)).
- When the further query fails, the dialog shows that nothing was found, as before, instead of an error.

### Consequences

- Measured with the built code on all 434 titles: dialogs without a candidate drop from 204 to 86; the accepted match is among the candidates for 91 of 93 instead of 89 (Partenon and Stela sępów come back); the 118 newly filled dialogs hold 179 cards.
- Good: about 58 of the 118 show the artwork itself (Auriga z Delf, Brama Holsztyńska, Lwia Brama, drzwi Bernwarda, Wielki Sfinks, Portret małżonków Arnolfinich, Zamek w Golubiu).
- Bad: about 35 show only the place of the artwork, such as the church of a mosaic or a portal (Hagia Sofia for the Deesis, Katedra w Cefalù for the Pantokrator) or its museum (Luwr for Stela Hammurabiego); about 25 show noise (Wonder Woman for "Ranne Amazonki", Musée de Cluny for capitals in Autun). The learner can pass them with "Dodaj własne".
- Bad: an empty title now waits for a second query: the median time to the dialog for those titles is 1.5 s instead of 0.3 s, the slowest 7.6 s.
- Stela Hammurabiego is still not found: the stele has only an English label, and the Polish Wikipedia article is about the code of law.

## More information

- The measurement used the production export of the owner's collection and the search code of this decision with real requests; the script and data stayed outside the repository.
- [ADR-0345](0345-show-only-confident-image-suggestions.md) holds the confidence rule and the first search.
