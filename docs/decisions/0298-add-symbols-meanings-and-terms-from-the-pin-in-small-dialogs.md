# 0298. Add symbols, meanings and terms from the pin in small dialogs

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

After testing 0.23 the owner found adding a symbol or a glossary term from a pin very cumbersome ([ATL-764](https://linear.app/kamil-nawrot/issue/ATL-764)). The pin could create a symbol from its name only ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)); the meaning had to be added on the symbol's page in the atlas and then chosen in the pin in the artwork form, about 12 clicks, and about 21 when the pin had to point at one of several meanings. The choice of meaning appeared only from two meanings up. The pin dialog of the artwork form, the only way to add a pin on a phone, could not create a symbol at all, and no pin could create a glossary term (12 to 14 clicks through Słowniczek). The exhibition editor sent the learner to the atlas or Słowniczek when nothing matched ([ADR-0290](0290-show-a-symbol-from-the-atlas-as-a-block-of-an-exhibition.md)).

## Decision drivers

- The learner finishes a symbol or a term where they noticed it, on the artwork.
- The pin dialog stays short; it grows only in the rarer case of creating an entry.
- The atlas and Słowniczek stay the places where an entry is completed (contexts, description, synonyms, forms).
- A phone can do what a computer can.

## Considered options

Where the meaning is entered:

- A field of meanings in the pin with "Dodaj znaczenie", for every symbol.
- A field only when a symbol is created in the pin.
- The full meaning dialog of the atlas over the pin.

Contexts of a new meaning in the pin: none, an optional "Dodaj kontekst", or a context taken from the artwork.

A glossary term from the pin: name and category, name only, or not at all; with or without the definition.

Keeping the dialog small: kind first (term, symbol, text only), a small dialog only when an entry is created, or steps in one dialog.

## Decision outcome

Chosen by the owner on 2026-11-14, one question at a time with mockups (`/mnt/project-files/symbole-pojecia-uzytecznosc/` in the project files).

- **Meaning in the pin:** once a symbol is chosen, the pin always shows "Znaczenie na tym dziele", a search select of the symbol's meanings. A symbol with one meaning has it chosen by itself. A text no meaning has offers "Dodaj znaczenie „…”" for any symbol, new or existing; the meaning is added at the end of the symbol's meanings, without contexts, when the pin is saved. Contexts stay in the atlas, because the summary of eras, styles and authors is counted from the pinned artworks anyway.
- **New symbol:** "Dodaj symbol „…”" opens a small dialog "Nowy symbol" over the pin with "Nazwa" filled from the search and an optional "Znaczenie". "Dodaj symbol" saves the symbol at once and chooses it, with that meaning, in the pin.
- **New term:** the field "Pojęcie ze Słowniczka" gets "Dodaj pojęcie „…”", which opens "Nowe pojęcie" with "Nazwa", the category as the tiles of the glossary form and the definition filled from Polish Wikipedia with its source, "Wybierz inny artykuł" and "Usuń źródło", as in the form of Słowniczek. "Dodaj pojęcie" saves the term at once and chooses it in the pin. Synonyms, inflected forms and the sort name stay in the full form; marking terms without a definition is an idea for later ([ATL-762](https://linear.app/kamil-nawrot/issue/ATL-762)).
- **Saving:** an entry made in a small dialog is saved on "Dodaj" and stays in the atlas or Słowniczek even when the pin is then cancelled.
- **Artwork form:** the pin dialog of the artwork form behaves the same, so a phone can add a symbol, a meaning and a term.
- **Exhibitions:** when no term or symbol matches in the section "Słowniczek" of "Przybornik", the panel offers "Dodaj pojęcie „…”" or "Dodaj symbol „…”", which open the same dialogs; the new entry is added as a block at the end.
- **Not chosen:** a smaller loupe preview in the pin (the owner keeps it large), the kind chosen first, and steps in one dialog.

### Consequences

- Good: a new symbol with its meaning takes 5 clicks instead of 12 or 13, a new term 6 instead of 12 to 14, and a pin points at its meaning when it is made.
- Good: the dialogs reuse the definition search and the category tiles of Słowniczek.
- Bad: the dialog of the article choice can open as a third layer over the pin.
- Bad: a term or symbol added and then left by a cancelled pin stays in the atlas or Słowniczek.

## More information

Requirements R-305 to R-308; R-247, R-233 and R-301 are amended. Builds: [ATL-765](https://linear.app/kamil-nawrot/issue/ATL-765) (pin), [ATL-766](https://linear.app/kamil-nawrot/issue/ATL-766) (exhibitions).
