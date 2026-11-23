# 0338. Keep figures on a tab of their own in the glossary

- Status: accepted; the required category and the kind told by the category are superseded by [0341](0341-let-a-glossary-entry-have-no-category.md)
- Date: 2026-11-20

## Context and problem statement

The glossary keeps terms and people in one list with six fixed categories, one of them Osoba ([ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md)). Osoba already behaves apart from the others: its Wikipedia search keeps only articles about humans (Wikidata P31), it gets no forms from Wiktionary, it warns when its name is an author of the card index, and only its entries can be context labels of a symbol meaning ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)). The owner asked three questions after using the glossary: should people get a third tab "Postaci", should a term have more than one category (today a term that fits two lands in Pojęcie ogólne), and should subtle dividers come back between terms, leaving out the first and the last of a letter ([ADR-0192](0192-refresh-the-glossary-list-and-show-the-fragments-of-a-term.md) kept dividers only between letters).

A read-only query on the owner's data on 2026-11-19 found about 240 entries, only 6 of them Osoba (no pin, one symbol context, one review card, no namesake among the authors), and no god, saint or biblical figure at all. About 25 terms sit in a category that does not fit them, nearly all because no category fits: ornaments (meander, palmeta, bukranion) under Malarstwo or Technika i materiał, arches and vaults under Technika i materiał, iconographic types (hodegetria, deesis, pantokrator, pieta) under Pojęcie ogólne or Technika i materiał, altar parts and clothing under Technika i materiał.

## Decision drivers

- People who appear in the history of art (rulers, founders, scholars, artists outside the card index, saints, gods of myth) need a place that tells them apart by role, so that a pharaoh and a nineteenth-century egyptologist do not share a category.
- Everything that already points at a glossary entry (pins, symbol contexts, review cards, flags, note mentions) keeps working without a second key.
- The form and the pin dialog stay short, also on a phone.

## Considered options

- Figure categories: historical, religious and mythological; five categories by origin; seven by role; six by role.
- Storage: the same table with new categories; a table of figures of its own.
- The list of figures: alphabetical under letters like the terms; sections per category.
- The form: only the six categories of the tab the learner came from; twelve tiles in two groups; a choice "Pojęcie / Postać" before six tiles.
- A new figure from a pin: two create actions in the entry field; one dialog with twelve tiles.
- Many categories per term, or one category with a better list.
- Dividers between terms: a solid line over the whole row; a solid line set in to the text; a dotted line set in to the text.

## Decision outcome

Chosen by the owner in ATL-829.

- The glossary has three tabs, "Pojęcia", "Postaci" and "Symbole", in that order. A figure is a glossary entry whose category is one of six figure categories, chosen by role, one per figure: Władca (`ruler`), Fundator i mecenas (`patron`), Artysta (`artist`), Uczony i badacz (`scholar`), Postać biblijna i święty (`sacred`) and Bóstwo i postać mitu (`myth`). Each has a Lucide icon used nowhere else: `crown`, `hand-coins`, `feather`, `graduation-cap`, `cross` and `sun-medium`.
- Figures stay in `glossary_entries`: the check of `category` takes the six figure codes and `iconography` instead of `person`. Names stay unique over the whole glossary, so a figure and a term cannot share a name.
- The term category Osoba is replaced by Ikonografia (`iconography`, icon `scan-eye`). The terms keep one category each; many categories per term are not built, since the misplaced terms of the owner's data lack a category rather than fit two.
- The tab "Postaci" is the list of "Pojęcia" for figures: alphabetical under letters with the letter index, the six figure categories as filter tags with their counts, its own search and order, and "Dodaj postać" at the right. Its count beside the lead is "{n} postaci" (1 postać), its search "Szukaj postaci", and an empty tab says "Nie masz jeszcze żadnej postaci" with "Zapisuj tu ludzi, bogów i świętych, których spotykasz w historii sztuki. Gdy pojawią się w notatce, zobaczysz, kim byli." and "Dodaj pierwszą postać". The tab "Pojęcia" lists only terms.
- The form shows the six categories of its kind: a new entry those of the tab it was opened from, an edited one those of its own kind. An entry cannot move between terms and figures; a mistake is deleted and added again. The form of a figure is titled "Nowa postać" and "Edycja postaci". The field of the name has no placeholder in either form.
- The field of a pin is "Pojęcie lub postać ze Słowniczka" and lists terms and figures together. A name no entry has offers two actions, "Dodaj pojęcie „…”" and "Dodaj postać „…”", each opening the small dialog with the six categories of its kind; the panel of the exhibition editor does the same. `SearchSelect` takes a list of create actions.
- The Wikipedia search keeps only humans for Władca, Fundator i mecenas, Artysta and Uczony i badacz, as for Osoba today. Postać biblijna i święty searches without that filter, Bóstwo i postać mitu without it and with the hint "mitologia", and Ikonografia with the hint "ikonografia".
- What Osoba did holds for every figure: no forms from Wiktionary, the warning when the name is an author of the card index, and a figure can be a context label of a symbol meaning.
- Between the terms of one letter, and the figures of one letter, stands the thinnest line in `--color-tag`, set in to the text of the row like the line between styles in Kartoteka; none above the first entry of a letter or below the last.
- The migration turns every Osoba into Uczony i badacz. A one-off SQL file in the project files moves the owner's entries that fit elsewhere (two saints, one artist, about ten iconographic types); the owner checks it and runs it in the Supabase SQL Editor.

### Consequences

- Good: figures get a place and categories of their own, and the people of a scene can be pinned and found like terms.
- Good: one table means no change to pins, symbol contexts, review cards, flags or note mentions, and one migration.
- Good: Ikonografia gives the iconographic types a category, and the dividers make long letters easier to scan.
- Bad: an entry filed as the wrong kind has to be deleted and added again, losing its pins.
- Bad: the search of one tab does not find entries of the other.
- Bad: a term that fits two categories still has to pick one.

## More information

Design issue [ATL-829](https://linear.app/kamil-nawrot/issue/ATL-829). Data in `atl-829/dane-1.md`, texts in `atl-829/teksty-wybrane.md`, screenshots `atl-829/postaci-a-both.png`, `atl-829/formularz-a-both.png`, `atl-829/pinezka-a-both.png` and `atl-829/dividery-wybrane-both.png`, and the mockup's diff `atl-829/makieta.diff` in the project files.
