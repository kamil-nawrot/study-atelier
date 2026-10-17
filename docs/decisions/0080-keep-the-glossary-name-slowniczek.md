# 0080. Keep the glossary name "Słowniczek"

- Status: accepted
- Date: 2026-10-17

## Context and problem statement

[ADR-0079](0079-connect-the-lexicon-and-suggest-forms-from-wiktionary.md) renamed the glossary module from "Słowniczek" to "Leksykon" for version 0.6.1. After seeing the rename in the build of ATL-199, the owner withdrew it: the module keeps its name. Which texts name the module, and what of ADR-0079 stays?

## Decision drivers

- The owner's call to keep the name the learner already knows from 0.6.
- Only the name changes; the rest of ADR-0079 was not questioned.

## Considered options

- Keep "Słowniczek" everywhere and leave the rest of ADR-0079 as it is.
- Keep "Leksykon".

## Decision outcome

Chosen option: "Keep "Słowniczek" everywhere", by the owner in ATL-199.

- The module is "Słowniczek" in the menu, the titles and the way back, and the texts keep the 0.6 wording ("Nie udało się wczytać słowniczka", "Nie ma takiego pojęcia w słowniczku. Może zostało usunięte.", "Usunąć „{nazwa}” ze słowniczka?", "Wróć do słowniczka").
- The link on a term's card is "Otwórz w Słowniczku" instead of "Otwórz w Leksykonie".
- Everything else in ADR-0079 stands: the count of terms, the list layout, the sort name, synonyms, the link from the card, marking in definitions and on flashcards, and the forms from Wiktionary.

### Consequences

- Good: no change of name for the learner between 0.6 and 0.6.1.
- Bad: none.
