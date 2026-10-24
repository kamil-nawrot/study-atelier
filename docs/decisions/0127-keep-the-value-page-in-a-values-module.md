# 0127. Keep the value page in a values module

- Status: accepted
- Date: 2026-10-24

## Context and problem statement

[ADR-0126](0126-organise-the-web-app-in-feature-modules-with-enforced-limits.md) splits `lib/collection` into feature modules and requires no cycles between them. Its analysis put the value page (the page of one author, place, period, style or material, with its form) into `card-index`. The value page shows the glossary terms of its notes (`GlossaryNotes`) and the notes that mention the value (`MentionedIn`), so `card-index` would import `glossary` and `notes`. Both of them read the card index (`loadCardIndex`, `valuePath`), so the modules would form a cycle that the module check of `dependency-cruiser` rejects. Where does the value page live?

## Decision drivers

- No cycles between modules, as ADR-0126 requires.
- One module, one feature that the learner can name.
- The card index stays the lower layer that `notes` and `glossary` build on.

## Considered options

- A `values` module for the value page: its view, its form, the loading of the page and of the value's details, and the author form.
- The value page inside `artworks`.
- The value page inside `card-index`, with the cycle kept in the baseline of `dependency-cruiser`.

## Decision outcome

Chosen option: "a `values` module", because it removes the cycle without mixing two features in one module: `card-index` keeps the lists of the card index and the data of the values, `notes` and `glossary` build on it, and `values` builds on all three.

### Consequences

- Good: the dependencies run one way, `card-index` → `notes` → `glossary` → `values`, and the module baseline of `dependency-cruiser` is empty.
- Good: the value page is found by its name, next to `artworks`, the page of one artwork.
- Bad: one more module than ADR-0126 lists.

## More information

- Issue: ATL-313 in Linear.
- Module list: [code-conventions.md](../guidelines/code-conventions.md#web-app-layout).
