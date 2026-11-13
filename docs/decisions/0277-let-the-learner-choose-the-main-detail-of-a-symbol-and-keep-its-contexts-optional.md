# 0277. Let the learner choose the main detail of a symbol and keep its contexts optional

- Status: accepted
- Date: 2026-11-13

## Context and problem statement

The owner reviewed the atlas of symbols ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)) in 0.23 and found five rough edges. The list showed a detail the learner could not choose (the newest pin with a loupe view). The line "Na Twoich dziełach" under a meaning added noise. A prehistoric detail stretched the axis "Przez wieki" over thousands of years and piled ticks and lenses on top of each other. A symbol in the card of a pin offered no way to its page, while a glossary term does. The field "W jakim kontekście?" was shown for every meaning although most meanings are general. How should each be settled?

## Decision drivers

- The learner chooses what represents a symbol, as with the main image of an artwork ([ADR-0109](0109-pin-details-on-the-artwork-image.md)).
- The common case (a general meaning) must be the quiet one.
- Reuse the patterns that exist: the card of a glossary term, the star of the main image.
- Few new things in the data.

## Decision outcome

- **Main detail:** a symbol has an optional `cover_pin_id`, set from the symbol's page with "Ustaw jako główny" on a detail with a crop and taken off by the same button ("Główny detal"). The atlas shows the chosen detail; without a choice, or when the chosen pin no longer belongs to the symbol, it keeps showing the newest pin with a crop. The function `set_symbol_cover` checks that the pin has the symbol and a crop. The reference to the pin is checked at the end of a transaction, because the import adds symbols before their pins.
- **Summary dropped:** the line "Na Twoich dziełach" and its counting are removed.
- **Axis with breaks:** details whose years lie more than 500 years apart form separate groups; each group spans whole centuries, groups are joined by a dashed break of a fixed width, and the tick step grows (100, 500, 1000, … years) so that a group has at most 12 ticks.
- **Pin card:** a symbol is shown like a glossary term: the overline "Symbol" with its icon, the name in italics, the chosen meaning and a link "Otwórz w atlasie symboli".
- **Optional contexts:** the form of a meaning shows the context field only after "Dodaj kontekst", or at once when the meaning already has labels. The data model is unchanged.

### Consequences

- Good: the learner decides what a symbol looks like in the atlas; a prehistoric outlier no longer breaks the axis; the form of a general meaning is shorter.
- Bad: one more column and function; the axis is no longer to scale between groups.

## More information

- Issue [ATL-703](https://linear.app/kamil-nawrot/issue/ATL-703); data model in [`docs/data-model/`](../data-model/README.md) (read pattern R28 unchanged, new write W31).
