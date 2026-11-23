# 0341. Let a glossary entry have no category

- Status: accepted; the Wikipedia search without the filter for people for a figure without a category is superseded by [0342](0342-search-wikipedia-for-people-for-a-figure-without-a-category.md)
- Date: 2026-11-22

## Context and problem statement

Every glossary entry has exactly one category, and since [ADR-0338](0338-keep-figures-on-a-tab-of-their-own-in-the-glossary.md) the category is also what tells a figure from a term: the six term categories put an entry on "Pojęcia", the six figure categories on "Postaci". After using the figures the owner found people who fit none of the six roles (a model, a philosopher, a literary character) and asked first for a catch-all "Pozostałe" and a merge of the two religious categories, then whether a figure, and a term, could simply have no category.

The category column was `not null`, and the app derived the kind from it (`kindOf`, `isFigure`), as did the database (the distractors of "Co to jest?", the people of the symbol questions). An empty category alone would therefore turn a figure into a term.

## Decision drivers

- An entry without a fitting category says "not decided yet" instead of landing in a catch-all that fills up.
- The kind of an entry stays fixed (R-327: an entry never moves between terms and figures).
- Older backups keep importing.

## Considered options

- A catch-all category "Pozostałe" for figures, and "Religia i mitologia" merging Postać biblijna i święty with Bóstwo i postać mitu.
- An optional category for figures only.
- An optional category for terms and figures, with the kind stored in a column of its own.

## Decision outcome

Chosen by the owner in ATL-846: an optional category for both terms and figures, with a column `kind` (`term` or `figure`). The catch-all and the merge are dropped.

- `glossary_entries.kind` is filled from the old category by the migration and can be set only on insert: the learners have no update grant on it. `category` is null or one of the categories of the kind.
- The forms offer the categories as tiles that can be cleared (`ChoiceTiles` `clearable`) and no longer ask for one. The automatic Wikipedia search starts after the name alone, without a hint and without the filter for people while no category is chosen, and searches again with the hint once a category is chosen; a definition the learner changed is not replaced. Wiktionary forms depend on the kind.
- An entry without a category shows no category in the list, on its page, in the card of a term and in the block "Hasło"; the term search of an exhibition shows an icon of the kind instead. The list adds a filter "Bez kategorii" with its count after the categories, only while some entry has none.
- Zaplecze does not list an entry without a category as missing data, because it is allowed by design.
- The distractors of "Co to jest?" come from the same category, then the same kind, and an entry without a category is never "the same category". The people of the symbol questions are all figures, with or without a category.
- `import_atelier` gives an entry of an older backup its kind from the category.

### Consequences

- Good: a figure or a term that fits no category can be saved as it is, and the kind no longer depends on the category.
- Good: the database now holds the rule that an entry never changes its kind.
- Bad: the automatic definition can be fetched twice for a new entry, once after the name and once after the category.

## More information

- Requirements: R-87, R-88, R-89, R-101, R-134, R-327, R-332.
