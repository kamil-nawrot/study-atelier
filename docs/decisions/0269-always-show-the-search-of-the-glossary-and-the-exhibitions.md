# 0269. Always show the search of the glossary and the exhibitions

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

The card index shows its search however few values it has ([ADR-0188](0188-redesign-the-card-index-lists.md)). The glossary showed its search only from 20 terms ([ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md)), and Wystawy only from five exhibitions (R-241). Wystawy also had no order, a bare search above the posters and no line under it. Should the lists keep their thresholds, and should Wystawy get the tools of the glossary?

## Decision drivers

- One rule for every list is simpler than three thresholds.
- A row of tools that appears later moves the list down when the collection grows.
- Wystawy and the glossary list look alike.

## Considered options

- Keep the thresholds.
- Always show the search, and give Wystawy the tools of the glossary.

## Decision outcome

Chosen option: "Always show the search, and give Wystawy the tools of the glossary", as the owner asked in ATL-697.

- "Pojęcia" in the glossary always shows its search and its order. `LetterIndex` still waits for 20 terms ([ADR-0245](0245-stand-the-glossary-letter-index-in-the-middle-of-the-screen.md)).
- The tools and the categories of "Pojęcia" lose the hairline under them and stand `--spacing-6` above the first letter, like the tools above the eras in the card index; the panel of the tab already sets them apart.
- Wystawy always shows the row of `ListTools` above the posters: the search "Szukaj wystawy", at most `--size-content-default` wide, and next to it the order "Sortuj" with "Ostatnio zmienione" (the default, the order of the last change), "Alfabetycznie" and "Najwięcej dzieł" (ties by title). The choice is kept on the device. A hairline closes the row, `--spacing-6` under the tools (`--spacing-4` on a phone), as under the tools of the glossary.

### Consequences

- Good: every list of the app shows its search from the first item.
- Good: the learner can order the exhibitions.
- Bad: a glossary or an atelier with one or two exhibitions shows a search it hardly needs.

## More information

Supersedes the threshold of the glossary search and the hairline under its tools in [ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md) and [ADR-0079](0079-connect-the-lexicon-and-suggest-forms-from-wiktionary.md). Follows [ADR-0268](0268-add-from-the-tabs-of-the-glossary-like-the-card-index.md). Issue: ATL-697.
