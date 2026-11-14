# 0292. Show an exhibition with every kind of block as Kircher's ark

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

The owner wants a hidden exhibit of the display case for one exhibition in "Wystawy" that uses every kind of block. An exhibition is one document of blocks: text, heading, quote, artwork, palette, close-up, divider, glossary term and, since ATL-747, symbol ([ADR-0199](0199-tell-stories-in-exhibitions-of-the-learners-artworks.md), [ADR-0290](0290-show-a-symbol-from-the-atlas-as-a-block-of-an-exhibition.md)). New kinds of block may come later. "Kaplica Lenoira" already rewards one exhibition, for its eras ([ADR-0231](0231-show-an-exhibition-through-all-six-eras-as-lenoir-s-chapel.md)). The look and the texts are designed first; the counting is built later in its own issue. Which blocks count, which object and engraving does the exhibit show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.
- The rooms of the display case are named "Sala …" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)), so the name of an exhibit avoids the word.
- The hint of a hidden exhibit works without the engraving and neither opens nor follows the pattern of another hint ([ADR-0231](0231-show-an-exhibition-through-all-six-eras-as-lenoir-s-chapel.md), [ADR-0213](0213-change-the-hint-of-the-alphabet-of-master-es.md)).
- An empty text block closes every document, and an empty heading or quote can be saved.

## Considered options

For the kinds that count: a fixed list of the nine kinds of today, symbol included; a list that grows with every new kind; a fixed list of eight without the symbol, which was still being built.

For empty blocks: text, heading and quote count only with content; every block counts, empty or not, so the closing empty text block always counts.

For the object: a compositor's type case from the plate "Imprimerie" of the _Encyclopédie_ (1769), every letter in its own compartment and "typ" an old word for a type, but the second _Encyclopédie_ plate of the case after the camera obscura; Athanasius Kircher's ark from _Arca Noë_ (Amsterdam, 1675), a place for every kind of animal; Jost Amman, _Der Buchdrucker_ (1568), a woodcut of a printing shop, small, while the case already has a workshop in "Akademia Boncompagniego".

For the plate of _Arca Noë_: the entry of the animals ("Ingressus Animalium intra Arcam"), chosen by the owner, who found the plans and sections of the ark weaker; the frontispiece, a public-domain scan of 2679 × 4261 px, where the ark is only a small ship in the background. The plates of the Wellcome Collection on Commons were left out: CC BY 4.0 and about 1500 px.

For the crop of the entry of the animals: the right side with the birds in flight, the ark, Noah and the animals (`kircher-entry-right`); the centre with the corner of the ark and Noah's family (`kircher-entry-centre`); Noah at the ramp close up with the plate border (`kircher-entry-noah-close`); the same a little wider without the border (`kircher-entry-noah`); wider still with a piece of the banner (`kircher-entry-wide`).

For the name: "Arka Kirchera"; "Arka Noego"; "Arka z Amsterdamu".

For the hint, before the chosen one: "Słowo, obraz i cisza między nimi dopiero razem tworzą komplet."; "Orkiestra brzmi pełnią dopiero wtedy, gdy zagra każdy instrument."; "Szachista wystawia na planszę wszystkie figury, nie tylko hetmana."; "Mozaika jest pełna dopiero, gdy każdy kamyk znajdzie swoje miejsce."; "Kolekcjoner znaczków śpi spokojnie dopiero z pełną serią."; "Zecer nie złoży strony, jeśli w kaszcie zabraknie jednej czcionki."; "Talia nadaje się do gry dopiero wtedy, gdy w pudełku są wszystkie karty."; "Bukiet jest pełny, gdy każdy kwiat z ogrodu dostanie w nim miejsce.". The owner then asked for opulence ("wystawność"): "Wystawne przyjęcie podaje na stół wszystko, co kryje spiżarnia."; "Na najwystawniejszym stole nie brakuje żadnego półmiska."; "Róg obfitości nie zostawia niczego na dnie."; "Barokowy gospodarz nie zna umiaru, gdy nakrywa do stołu."; "Kto wydaje bal, nie skąpi żadnej z atrakcji."; "Prawdziwa wystawność niczego nie pomija." and other short sentences with the word, which sounded unnatural; "Na wystawnej uczcie niczego nie może zabraknąć.". Then the total work of art: "Wagner nazwałby to dziełem totalnym.", too hard a name; "Dzieło totalne sięga po wszystkie środki naraz.". Then the owner's "wystawa multimedialna": "Barok robił wystawy multimedialne, zanim wymyślono to słowo."; "Wystawa multimedialna obywała się kiedyś bez jednego kabla."; "Wystawa multimedialna, tyle że na gęsie pióro i rylec."; "Dziś powiedzielibyśmy: multimedialna. Dawniej mówiło się: z rozmachem.". The last led the owner to a line from Stanisław Bareja's _Miś_: "Mają rozmach, ci kuratorzy."; "Mają rozmach, kuratorzy."; "Mają rozmach, wystawcy." and other nouns (muzealnicy, impresariowie, mecenasi, aranżerzy, scenografowie).

For the curiosity: Kircher's prime kinds and the hybrids that needed no place in the ark (Cornell University Library); the capacity of the ark, its three decks and the stores of the middle deck (Linda Hall Library).

## Decision outcome

Chosen by the owner in ATL-752.

### Counting

- The exhibit is unlocked by one exhibition that holds a block of every kind the editor offers. The list grows: a kind of block added later joins the condition, and an exhibit already found stays found. Today the kinds are "Tekst", "Nagłówek", "Cytat", "Dzieło", "Paleta", "Szczegół", "Odstęp", "Hasło" and "Symbol".
- "Tekst", "Nagłówek" and "Cytat" count only with content; the other kinds count as they are. A heading inside a text is not a block of its own. An exhibition in "Archiwum" does not count.
- Close-ups in a set, artworks in the trash, deleted terms and symbols, and data before the release are settled in the build's issue.

### Display case

- Object: the ark of Noah as Athanasius Kircher reconstructed it in _Arca Noë_, a whole book on its building and household.
- Engraving: unknown engraver after Athanasius Kircher, _Ingressus Animalium intra Arcam_, two-page engraving from _Arca Noë, in tres libros digesta_ (Amsterdam, Johannes Janssonius van Waesberge, 1675), public domain, the scan of the book on Commons (`… (IA athanasiikircher1675kirc).pdf`, page 179). Noah at the ramp with the pairs of animals and the birds on the roof, without the plate border, variant `kircher-entry-noah` in `tools/exhibit-art/manifest.json`; the other crops stay as alternatives. The cloud reaches only the 1280 px thumbnail of the page, so the variant uses it as `source_url`.
- Credit: Nieznany rytownik według Athanasiusa Kirchera, „Wejście zwierząt do arki”, 1675.
- Exhibit code: `kircher_ark`.
- Name "Arka Kirchera", an object and whose it is: the ark as Kircher reconstructed it.
- The story of the object: "Athanasius Kircher w księdze „Arka Noego” (Amsterdam, 1675) pokazał, jak zwierzęta parami wchodzą do arki."
- The hint while hidden: "Mają rozmach, kuratorzy."
- What it was awarded for: "Za wystawę ze wszystkimi rodzajami bloków."
- The room of the display case: Pawilon, third, after "Kryształowy Pałac" and "Kaplica Lenoira" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                         | Source                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1    | Jezuita Athanasius Kircher, zwany „mistrzem stu sztuk”, uważał, że Noe zabrał do arki tylko pierwotne rodzaje zwierząt, a resztę dały po potopie krzyżówki. Muła nie ratował, a na żyrafę miały wystarczyć dwa lamparty i dwa wielbłądy. Nad arką napisał, że ma ona nawet wolne stajnie dla tych, którzy wątpią w jej pojemność. | [Cornell University Library, In the Ark](https://exhibits.library.cornell.edu/AnimalLegends/feature/in-the-ark) |

The Cornell and Linda Hall pages refused automated reading, so the owner pasted their text. The Getty Research Institute's copy of the book (`gri_33125011108665`) names Coenraet Decker (about 1620–1678) as an engraver of the book but not of this plate, so the credit keeps the engraver unknown. Linda Hall Library calls the plate "the loading of the animals".

### Consequences

- Good: an ark with a place for every kind of animal mirrors an exhibition with a block of every kind, and the list may grow as the kinds of animals did after the flood.
- Good: the hint plays on a line every Polish visitor knows, without describing the engraving.
- Bad: the exhibit has to follow every new kind of block; the build guards that with a test.
- Bad: the source is a 1280 px page of a scanned book, so the crop is slightly enlarged.

## More information

Designed in ATL-752; the build, with the counting, is ATL-753. The WebP images go to `apps/web/static/exhibits/kircher_ark/` with `exhibit-art publish --only kircher_ark` once the exhibit exists in the app and the database.
