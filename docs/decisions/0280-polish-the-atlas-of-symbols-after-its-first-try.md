# 0280. Polish the atlas of symbols after its first try

- Status: accepted; the "⋯" on a lens is superseded by [0281](0281-assign-details-to-a-meaning-and-align-the-symbol-page-with-the-app.md)
- Date: 2026-11-13

## Context and problem statement

After trying the atlas of symbols ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md), [ADR-0277](0277-let-the-learner-choose-the-main-detail-of-a-symbol-and-keep-its-contexts-optional.md), [ADR-0279](0279-edit-symbol-meanings-one-at-a-time-and-create-symbols-from-a-pin.md)) the owner noted that:

- a tile in the list showed only the first meaning of a symbol, which reads as if the symbol had only that one;
- the axis "Przez wieki" split at a long gap into parts with an empty space of 300 years between them, with nothing joining them, after a dotted line had been too faint;
- a detail could be moved to another meaning only in the pin dialog of the artwork form;
- a symbol had no place for a general description;
- the star of the main detail looked unlike the star of the main image and the tier of an exhibit.

How should the atlas answer these?

## Decision drivers

- A tile must not suggest that a symbol has one meaning.
- The axis should read as one line, and a long gap should neither stretch it nor leave a hole.
- Sorting details into meanings is work done on the symbol's page, where the meanings are seen together.
- Marks laid over an image look the same everywhere.

## Considered options

For the axis:

- a narrow break of a fixed width with two slanted strokes on an unbroken line, as on charts;
- a narrow break drawn as a dashed line in the full colour of the axis;
- no break, one axis at true scale.

For moving a detail to another meaning:

- a "⋯" menu on the lens of each detail;
- a select under the title of each detail, always visible;
- a mode switched on in the top bar that shows a select on every detail.

## Decision outcome

- A tile in the list shows the main detail, the name and the counts, and no meaning; `symbol_atlas()` no longer returns `first_meaning`.
- "Przez wieki" draws one unbroken axis line. A gap of more than 500 years becomes a break 4 % of the axis wide, however long the gap, marked with two slanted strokes, because it keeps the line whole and the details readable without pretending to a scale it does not have.
- Each lens on the symbol's page has a "⋯" at its top right, "Zmień znaczenie", listing the numbered meanings and "Bez wskazanego znaczenia" with the current one ticked; a choice moves the pin with the toast "Zmieniono znaczenie detalu.". It works the same with a mouse and on a phone and adds no noise until it is needed.
- A symbol has an optional "Opis" of up to 2000 characters, set in its form and shown under its name; `save_symbol` takes it as `new_description`.
- "Dodaj znaczenie" moves from below the meanings to the top bar of the symbol's page, before "Edytuj".
- The star of the main detail stands on a semi-transparent dark band across the bottom of the lens, cut by its edge, like the star of the main image and the numeral of a tier.

### Consequences

- Good: the list no longer hides meanings, the axis stays one line however far apart the details are, and details are sorted where their meanings are read.
- Bad: the break no longer shows how long a gap is; the years at its sides tell it.

## More information

Decided with the owner on 2026-11-13 in [ATL-710](https://linear.app/kamil-nawrot/issue/ATL-710/polish-the-chronicle-kalendarium-and-the-atlas-of-symbols).
