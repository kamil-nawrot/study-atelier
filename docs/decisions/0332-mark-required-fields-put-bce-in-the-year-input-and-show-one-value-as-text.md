# 0332. Mark required fields, put "p.n.e." in the year input and show one value as text

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

The owner collected four inconsistencies of the form fields after using 0.25:

- No form tells which fields are required: the learner finds out only from the error after a save.
- The "p.n.e." of a year is a `Checkbox` under its input (`YearInput`), apart from the number it changes, and in "Od – do" two such checkboxes stand under two narrow inputs.
- A field that takes one value (`ValueField` with `single`) looks exactly like a field that takes many: both show the chosen values as tags.
- The glossary term and the symbol of a pin (`SearchSelect`) show the chosen one as plain text, while "Miejsce" shows it as a tag.

How should a required field, the era of a year and a field of one value look in every form?

## Decision drivers

- One rule for every form of the app, built once in the library components.
- Subtle: the app is monochrome and red means an error.
- The kind of a field is visible when a value is chosen, without extra icons or texts.
- Large enough targets on a phone, also in the narrow "Od" and "Do" inputs.

## Considered options

Required fields: an asterisk after the label in the muted colour, in the highlight colour, or in the danger colour.

"p.n.e.": a block joined to the right edge of the input, a small badge inside the input with a dashed outline when off, or a two-part switch "n.e. | p.n.e." at the end of the input.

One value and many values: an icon at the end of the field (a chevron for one value, a plus for many), the tag of one value stretched over the whole field, "Dodaj kolejną wartość" after the tags of a field of many values, or one value as plain text in the input (the owner's proposal, as the term and the symbol of a pin already are).

## Decision outcome

**Required fields.** A required field shows an asterisk right after its label in `--color-fg-muted`, in every form. The asterisk is hidden from assistive technology, and the input carries `aria-required="true"` instead. No legend explains it. A field that is required only when another control allows it ("Autorzy" unless "Autor nieznany") shows the asterisk while it is enabled and loses it while the other control disables it. Optional rows the learner adds (a relation, a meaning of a symbol) mark nothing, even though a started row must be completed.

**"p.n.e."** The `Checkbox` under a year input goes away. "p.n.e." becomes a block joined to the right edge of the input, as tall as the input and separated from the number by a hairline: off it is muted text, on it is filled with `--color-fg` and its text is `--color-on-fg`. It is a toggle button (`aria-pressed`) switched by a click, the space bar or Enter, with the accessible names of today ("p.n.e. (od)", "p.n.e. (do)"). It applies to every `YearInput`: the date of creation, the years of life of an author, the bounds of an era and the date of an event. While the input is filling or disabled, the block is disabled too.

**One value.** A field that holds one value shows the chosen value as plain text in the input, at the size of typed text, with a clear button (X) at the right edge, as `SearchSelect` shows the glossary term and the symbol of a pin. A field that holds many values keeps the tags. Typing in a filled field of one value searches, and leaving it without a choice restores the value; "Dodaj „…”" still creates a new value where the field allows it. This applies to every `ValueField` with `single`: "Okres", "Miejsce", the own lists of one value and the other artwork or author of a relation row. The term and the symbol of a pin stay as they are, so the fourth inconsistency is resolved by the same rule.

### Consequences

- Good: the learner sees the required fields before the first save, and the error texts stay as they are.
- Good: "p.n.e." stands by the number it changes and does not add a line under the input.
- Good: the kind of a field shows once it has a value, with no extra icon or text, and the term and symbol fields already follow the rule.
- Bad: an empty field of one value still looks like an empty field of many; the difference shows only once a value is chosen.
- Bad: the single mode of `ValueField` becomes a second way of showing values in the component, with its own keyboard rules to test.

## More information

- Issue [ATL-825](https://linear.app/kamil-nawrot/issue/ATL-825); the mockups are in the issue's comments.
- The "p.n.e." under each year of [ADR-0046](0046-enter-the-date-of-creation-as-a-year-span.md) is superseded by the block in the input.
