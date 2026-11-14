# 0266. Give points for adding a symbol

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

[ADR-0160](0160-gamify-learning-as-a-museum-career.md) gives 2 points for adding an artwork, a glossary definition, an event or a visit. Version 0.23 adds symbols as the second tab of the glossary ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)), and adding one gives nothing. Should it, and how much?

## Decision drivers

- Adding to the atelier is rewarded the same everywhere, and settling stays worth ten times more.
- Points are computed from stored events, and a weight applies to everyone at once (ADR-0160).
- Deleting is never punished, and the history can be recomputed.

## Considered options

- No points for symbols.
- 2 points for adding a symbol, like a definition.
- Points also for typed relations ([ADR-0259](0259-relate-artworks-and-authors-with-typed-relations.md)) and for the mark "Chcę zobaczyć" ([ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md)).

## Decision outcome

Chosen by the owner on 2026-11-12, in ATL-691: 2 points for adding a symbol, as a symbol is a glossary entry like a definition. Relations and the mark give no points; their work is rewarded by exhibits (ADR-0264, ADR-0263).

- The ledger gains the kind `symbol_added`, with the symbol as its item; `learner_points()` already gives 2 to every addition, so no weight changes.
- Saving a new symbol records the event in a trigger, like the other additions, and not during an import. Editing a symbol records nothing more, and deleting it keeps the event.
- The migration fills the events of the symbols that exist, at their creation dates, and `fill_point_events` includes symbols, so an import into an account without points counts them too.

### Consequences

- Good: every kind of glossary entry pays the same, and the points table of ADR-0160 stays one rule for all additions.
- Bad: the list of kinds in the `point_events` check grows again; the next change to it (the `wish_seen` event of ATL-684) must keep `symbol_added`.

## More information

Amends the points table of ADR-0160. Built in ATL-691, migration `20261112155000_symbol_points.sql`, tested in `supabase/tests/points.sql`.
