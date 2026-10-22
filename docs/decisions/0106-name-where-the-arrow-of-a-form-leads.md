# 0106. Name where the arrow of a form leads

- Status: accepted
- Date: 2026-10-22

## Context and problem statement

[ADR-0101](0101-go-back-to-where-the-learner-came-from.md) names the arrow of a detail page after the place the learner came from ("← Atelier", "← Tympanon"). Forms kept their earlier top bar, the library `BackHeading`: an arrow next to the form's own title ("← Edytuj dzieło #0001", "← Nowe pojęcie"). The owner read it as an arrow back to "Edytuj dzieło" and reported it as a bug (ATL-265), together with a new glossary entry that named the place before Słowniczek ("← Kartoteka") as its way back. What does the top bar of a form show?

## Decision drivers

- An arrow with a name means the same thing on every page: where it leads.
- A form keeps a quick way out at the top, besides "Anuluj" at the bottom.

## Considered options

1. The arrow of a form names where it leads, as on a detail page; the form's title leaves the bar
2. The bar shows only the form's title, without an arrow; the form is left through "Anuluj"

## Decision outcome

Chosen by the owner: option 1, and the form's title is not shown at all.

- A form starts its top bar with `BackLink`, named after the page that opened it: the artwork ("← Mona Lisa") from its edit form, "← Atelier" from the add form, "← Słowniczek" or the entry from a glossary form, the value from its edit form, "← Kalendarium" from an event form. Opened directly, it links to that page by its name.
- The form's title stays only as a visually hidden `h1` and in the browser tab.
- After saving, a form that added something leads to a new page whose arrow names the page that opened the form ("← Słowniczek" on a new entry). A form that edited something returns to that page, which keeps the arrow it had before the form was opened.
- `BackHeading` leaves the library.

### Consequences

- Good: every arrow in the app names its destination.
- Good: the top bar of a form has room on a phone.
- Bad: the form's title is no longer visible; the arrow and the fields tell what the page is.

## More information

- Issue ATL-265.
