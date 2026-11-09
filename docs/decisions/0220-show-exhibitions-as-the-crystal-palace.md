# 0220. Show exhibitions as the Crystal Palace

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The owner wants a tiered exhibit of the display case for the exhibitions the learner builds in "Wystawy", new in 0.21 (idea ATL-560). The display case already has "Salon w Luwrze", which counts the places of the chronicle and whose curiosities tell of museum visiting and exhibitions. The look and the texts are designed first; the counting is built later in its own issue. Which object and engraving does it show, and how do its curiosities differ from those of the Salon?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- The new exhibit must not look like "Salon w Luwrze", a crowd before a wall of paintings.
- A tiered exhibit's curiosities follow its own theme, one per tier, with a checked source each (`voice-and-tone.md`).

## Considered options

For the object: the exhibition room of the Royal Academy at Somerset House (Rowlandson and Pugin, _Microcosm of London_, 1808, Met CC0), too close to the Salon; the Crystal Palace of the Great Exhibition of 1851, the owner's suggestion of a world's fair, from the Rijksmuseum prints RP-P-1953-38 to -41, RP-P-1906-3795, RP-P-2018-839 and RP-P-2018-2036.

For the scope: giving "Salon w Luwrze" with its curiosities to the new exhibit and a new engraving to the chronicle; keeping the Salon for the chronicle and splitting the themes.

For the crop: the transept with its semicircular window (`burton-transept`); the same with more sky (`burton-transept-wide`); the iron nave inside with the trees of the park (`wood-interior`).

## Decision outcome

Chosen by the owner in ATL-563.

### Counting

- The exhibit counts the exhibitions with at least 5 artworks, so that empty or barely started ones do not count, with five tiers at 1, 3, 5, 10 and 25. Building an exhibition is a lot of work, so the first one is enough to start and 25 stays a long goal. What counts as an artwork of an exhibition, the trash and the place in the case are settled in the build's issue.

### Display case

- Object: the Crystal Palace, the glass building of the Great Exhibition of 1851 in Hyde Park. "Salon w Luwrze" stays with the chronicle.
- Engraving: Charles Burton, _Transept (external view) of the Industrial Palace, from Prince of Wales's Gate_, London, Ackermann & Co., printed by Vincent Brooks, Day & Son, 1851, Rijksmuseum RP-P-2018-839, marked with the Public Domain Mark on its [object page](https://www.rijksmuseum.nl/en/collection/RP-P-2018-839). It is not on Commons: `exhibit-art` takes the museum's image through `source_url`. The crop of the transept with its semicircular window, the flag and the visitors at the entrance, variant `burton-transept` in `tools/exhibit-art/manifest.json`; the other two crops stay as alternatives.
- The museum gives no technique, so the story says "przedstawił" rather than "wyrył".
- Credit: Charles Burton, „Transept Pałacu Przemysłu od Bramy Księcia Walii”, 1851.
- Exhibit code: `crystal_palace`.
- Name "Kryształowy Pałac", the name of the place, like "Fontanna di Trevi".
- The counter label: "wystaw z co najmniej 5 dziełami", as in "2 z 3 wystaw z co najmniej 5 dziełami".
- The story of the object: "Charles Burton przedstawił w 1851 roku transept Kryształowego Pałacu w londyńskim Hyde Parku, szklanego gmachu zbudowanego na Wielką Wystawę." The [Royal Parks](https://www.royalparks.org.uk/read-watch-listen/great-exhibition-1851-hyde-park) describe the glass building raised in Hyde Park for the Great Exhibition.
- Theme of the curiosities, a new row in `voice-and-tone.md`: how exhibitions are made: world's fairs, selection, hanging and curators. The row of "Salon w Luwrze" becomes the stories of museum visiting and exhibitions as the visitors lived them; its curiosities stay as they are.
- The curiosities of its tiers:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                                                                                       | Source                                                                                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Na Wielką Wystawę w 1851 roku 5000 robotników w pięć miesięcy zbudowało w londyńskim Hyde Parku szklany Kryształowy Pałac. Gmach był tak duży, że w środku znalazły się drzewa parku. 14 000 wystawców pokazało w nim 100 000 przedmiotów z całego świata, które obejrzało sześć milionów ludzi.                                                                                                | [Royal Parks](https://www.royalparks.org.uk/read-watch-listen/great-exhibition-1851-hyde-park)                                        |
| 2    | Udział w paryskim Salonie, wystawie z jury, decydował o karierze artysty. Gdy artyści zarzucili jury, że odrzuca dzieła niezgodne z akademickim wzorem, cesarz Napoleon III zorganizował w 1863 roku pierwszy Salon Odrzuconych dla prac, których jury nie przyjęło. Pokazano tam wiele dzieł artystów, których później łączono z impresjonizmem.                                               | [Getty](https://www.getty.edu/education/for_teachers/curricula/impressionism/background1.html)                                        |
| 3    | Białe ściany galerii to wynalazek dopiero początku XX wieku, gdy sztuka stawała się coraz bardziej abstrakcyjna. Artyści De Stijl i Bauhausu chcieli, by nic nie odciągało uwagi od dzieł, a gładka biel dodatkowo je obramowywała. Tak powstał „biały sześcian”: prosta sala o białych ścianach, zwykle oświetlona z sufitu.                                                                   | [Tate](https://www.tate.org.uk/art/art-terms/w/white-cube)                                                                            |
| 4    | W 1969 roku Harald Szeemann pokazał w Kunsthalle w Bernie wystawę „When Attitudes Become Form”, która przeszła do historii dzięki jego radykalnemu podejściu: sama wystawa, czyli dobór dzieł i ich zestawienie, była jego wypowiedzią. W 2013 roku Fondazione Prada odtworzyła ją w Wenecji, wstawiając białe sale Kunsthalle w pełnej skali do zdobionych freskami wnętrz zabytkowego pałacu. | [Fondazione Prada](https://www.fondazioneprada.org/project/when-attitudes-become-form/?lang=en)                                       |
| 5    | Wieża Eiffla miała być w Paryżu tylko gościem: trzystumetrową konstrukcję postawiono na wystawę światową w 1889 roku z myślą, że postoi 20 lat. Zamiast zniknąć razem z wystawą, została na stałe i stała się symbolem Paryża i całej Francji.                                                                                                                                                  | [BnF Passerelles](https://passerelles.essentiels.bnf.fr/fr/chronologie/construction/86975eb3-9f28-4e1a-bc88-e28bbfab0a26-tour-eiffel) |

The Fondazione Prada page refused automated reading, so the owner pasted its text; the year 2013 comes from its title. The Tate page could be read only as a summary. A draft of the fourth tier on Szeemann's age, his title of the inventor of the curator's profession and his leaving Bern, from The Art Newspaper, was dropped: no open source said why the trustees were upset. A sentence on Brian O'Doherty's essays _Inside the White Cube_ was dropped from the third.

### Consequences

- Good: the exhibit rewards the exhibitions module, which no other exhibit counts, and its glass building looks unlike every other engraving of the case.
- Good: the curiosities run from the first world's fair through selection, hanging and curating back to the fair that left the Eiffel Tower, so the last tier crowns the hardest goal.
- Bad: the themes of the Salon and the Crystal Palace stay close; the split between visiting and making exhibitions has to be kept by later curiosities.

## More information

Designed in ATL-563 from the idea ATL-560; the build, with the counting, is ATL-566. The WebP images go to `apps/web/static/exhibits/crystal_palace/` with `exhibit-art publish --only crystal_palace` once the exhibit exists in the app and the database.
