# 0330. Polish the glossary and keep the forms field still

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

After using 0.25 the owner collected small faults in the glossary ([ATL-821](https://linear.app/kamil-nawrot/issue/ATL-821)). The hover of a term covered only half of its row, the field "Odmiana" ([ADR-0079](0079-connect-the-lexicon-and-suggest-forms-from-wiktionary.md)) changed its size and flickered when the category or the name changed, the flag button stood next to "Usuń", the symbols had less space under the search than the terms have under the tags, and the source note in a definition popover touched the definition.

## Decision outcome

- The rows of the term list fill the whole width of the list, so the hover covers the whole row; the definition line keeps its reading width.
- The field "Odmiana" always shows its frame with the summary and the buttons, and the tags field is shown only after the learner expands it, also for a new term and while Wiktionary answers. Only the text inside the frame changes. This replaces the rule of ADR-0079 that an empty field is open.
- On the view of a term and of a symbol the flag button is the last one, after "Usuń", so the buttons with text stay together. The overflow menu keeps the same order.
- The symbols have the same space under the search as the terms have under the tags.
- Every definition popover leaves a larger space before the source note.

### Consequences

- Good: nothing moves while the learner types a name or changes the category.
- Bad: a new term needs one click on "Pokaż formy" to type forms by hand.
