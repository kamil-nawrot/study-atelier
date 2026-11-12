# 0257. Keep symbols with meanings in context as a tab of the glossary

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

Art is full of recurring motifs whose meaning the learner wants to remember: a skull, a lily, keys, a dove, a dome, the colour red. Today the learner can only note them as a glossary entry ([ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md)) or as the free text of a pin ([ADR-0109](0109-pin-details-on-the-artwork-image.md)); on production about 8 of some 60 free pin texts are symbols written as prose ("Orzeł – (tutaj) symbol św. Marka", "Wół – symbol św. Łukasza", Ecclesia, a globe under Christ's feet). A glossary entry has one definition and one fixed category, but a symbol means different things in different contexts (the lily is purity in an Annunciation and the monarchy in French heraldry), and the same meaning often holds across many eras and styles. The module must work for any art, not only for medieval saints: modern art, architecture and colour too. How should symbols be kept, shown and practised?

## Decision drivers

- Universal: a symbol is not tied to one era, style or kind of art.
- A meaning is general by default; context narrows it only when it matters.
- Links to the card index and the glossary without forcing them.
- Reuse what exists: pins, stored crops of the loupe ("Detale", [ADR-0192](0192-refresh-the-glossary-list-and-show-the-fragments-of-a-term.md)), extra questions in the review ([ADR-0153](0153-add-glossary-definitions-to-the-review-as-extra-questions.md)).
- The menu does not grow.

## Considered options

What a symbol is:

- Any glossary entry can carry meanings
- A seventh glossary category "Symbol"
- A separate entity outside the glossary

How a meaning relates to context:

- One context per meaning (an era, style, author, artwork or free text)
- Any number of context labels, none meaning general, plus a summary counted from the pinned artworks
- Labels only, or a summary only

Where the atlas lives: its own menu item, or a tab of the glossary. How it is laid out: a grid of lenses, a list with meanings, or a timeline of lanes. How symbols join the review: extra questions, their own schedule, or a separate session.

## Decision outcome

Chosen by the owner on 2026-11-12, one question at a time with mockups on real artworks (`/mnt/project-files/atl-674/` in the project files).

**A symbol is its own entity**, outside the glossary: a name unique for the learner and an ordered list of meanings. The same word may exist as a term and as a symbol (Lilia).

**A meaning** is a short text ("przemijanie, śmierć") with any number of **context labels**. A meaning without labels holds everywhere ("znaczenie ogólne"). A label is one of: a card index value (author, period, style, material, place), an era, an artwork of the atelier, a person of the glossary, or a free text. One field "W jakim kontekście?" with suggestions offers them all, with the hint "Wybierz wartość z Kartoteki, postać ze Słowniczka, lub wpisz własny opis. Puste pole będzie traktowane jako znaczenie ogólne."; what matches nothing stays as free text. The meaning itself is asked as "Co oznacza?", and "Dodaj znaczenie" adds another. A meaning whose label is a glossary person is that person's **attribute** (Klucze, "władza Kościoła", label Św. Piotr): the person's glossary page lists their attributes under "Atrybuty postaci", and a card index value page lists the symbols whose meanings carry it under "Symbole tego autora" (okresu, stylu, materiału, miejsca, epoki).

**A pin** gets an optional field "Symbol" next to its glossary entry; both may be set. When the chosen symbol has two or more meanings the pin offers "Znaczenie na tym dziele" with them, optional. Existing pins are not converted: the learner picks the symbol in the few pins that note one in their text.

**The atlas** is the second tab, "Symbole", of the glossary ("Pojęcia" · "Symbole"), with the shared lead "Postaci ważne dla sztuki, pojęcia które warto znać by lepiej ją rozumieć, a także Twój własny atlas symboli powracających w wielu różnych dziełach i epokach." and no lead of its own on the tab. The add button of the top bar follows the tab ("Dodaj pojęcie" / "Dodaj symbol"). The tab has a search field "Szukaj symbolu" by name and a sort select (Alfabetycznie, Ostatnio dodane, Najwięcej detali), placed and styled as on the "Pojęcia" tab. Below, a grid of round lenses, four in a row with 200 px lenses and wide gaps on a desktop, two columns on a phone: each symbol shows one detail, its name in italics, its first meaning and the counts "3 detale · 2 znaczenia".

**A symbol's page** has the overline "Symbol" and the name in italics. Each meaning is its own section: its number, its text in italics, its labels (or "znaczenie ogólne"), the summary "Na Twoich dziełach: nowożytność 1 · barok 1 · Caravaggio" counted from the artworks of its pins (eras, styles and authors with counts), and a strip of round lenses of the pins with that meaning, each with the artwork title, author and year. Pins with the symbol but no meaning come last under "Bez wskazanego znaczenia"; a meaning without pins says "Żaden detal nie ma jeszcze tego znaczenia.". At the bottom "Przez wieki" places every lens of the symbol on an axis of the artworks' years.

**The review** adds symbols as extra questions without a schedule, like definitions: a lens of a pin crop where the image of an artwork is, with four answers, under the label "Pytanie dodatkowe z atlasu symboli". "Co przedstawia ten detal?" asks for the symbol; "Jakie znaczenie ma tu ten symbol?" asks for the meaning when the pin has one; "Do kogo należy ten atrybut?" asks for the person when the meaning carries a person label. The settings ask "Ile pytań o symbole dołączać do sesji?".

An empty tab says "Atlas symboli jest jeszcze pusty" with a short hint and "Dodaj pierwszy symbol". The texts are the owner's picks in `teksty-wybrane.md` in the project files.

### Consequences

- Good: one mechanism covers saints' attributes, vanitas, heraldry, modern motifs, architecture and colour.
- Good: the learner sees which artwork illustrates which meaning, and the summary shows where a meaning was actually met without extra typing.
- Good: pins, stored crops and extra questions are reused; the menu keeps its items.
- Bad: a word can live twice, as a term and as a symbol, and the learner keeps them apart by hand.
- Bad: three new tables and two pin columns; labels point at four kinds of rows and must follow their renames, merges and deletes.
- Bad: only pins with a loupe view have a crop, so a pin without one shows no lens and takes no part in the review questions.

## More information

- Issue [ATL-674](https://linear.app/kamil-nawrot/issue/ATL-674); builds [ATL-677](https://linear.app/kamil-nawrot/issue/ATL-677) and [ATL-678](https://linear.app/kamil-nawrot/issue/ATL-678); data model in [`docs/data-model/`](../data-model/README.md) (patterns R26–R30, W23–W24).
- Proposals made in the design and not yet confirmed by the owner, settled in the build issues: a deleted value, artwork or person removes its label; a merge of two values moves the labels to the value that stays; a pin without a loupe view is listed by artwork title under its meaning, without a lens.
