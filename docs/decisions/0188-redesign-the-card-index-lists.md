# 0188. Redesign the card index lists

- Status: accepted
- Date: 2026-11-05

## Context and problem statement

The card index lists ([ADR-0040](0040-manage-category-values-in-a-card-index.md), [ADR-0158](0158-add-values-straight-from-the-card-index.md)) were found flat on review: the search row is squeezed between the tabs and the list, the sort select does not say it sorts, the add buttons are secondary with no primary button on the page, rows have no visible borders, the counts look like footnotes, the era years stand under the era name as "do 476", and the lead text repeats "opisujesz" and "opisywać". How should the lists look?

## Decision drivers

- The search, sort and add buttons belong to one tab, not to the whole view.
- Rows read as separate records without becoming file-explorer rows.
- The era years stand apart from the body text and read the same everywhere.
- Icons never repeat across contexts.

## Considered options

For the layout: the tools in the top bar like the Atelier bar; the tools in a framed panel joined to the active tab like a card-file divider; three other arrangements of the same row.

For the sort: an icon inside the select; a label before it; a sort button with a menu.

For the rows: hairlines between rows; zebra stripes; framed cards.

For the hover: an underline of the name; a background of the whole row.

For the era years: under the name; after the name as plain text, in bold, or in an outlined badge.

For the lead text: three versions.

## Decision outcome

Chosen by the owner in ATL-500.

- **Layout:** the active tab is drawn as a card-file divider joined to a framed panel holding the search, the sort, the add buttons and the list, on every tab. The tools in the top bar were rejected: the search would look global though it searches one tab, unlike the Atelier bar, which searches everything below it.
- The add buttons are primary.
- **Sort:** the select shows the `arrow-up-down` icon before the chosen order, on desktop and on a phone.
- **Rows:** hairlines between rows; the count is spelled out ("2 dzieła") and right-aligned. Hover gives the whole row a subtle background; the name is not underlined, because underlines next to the hairlines would draw too many horizontal lines.
- **Era years:** right after the era name in an outlined badge (thin border, no fill). Ranges use an en dash with a space on both sides and leave out "n.e." ("3000 p.n.e. – 476", "476 – 1492", "od 1945"). The same text is used wherever era years appear, the era tiles of the artwork form and the review included.
- **Lead text:** "Tu porządkujesz swoje epoki, okresy, style, autorów, miejsca i wydarzenia. Możesz też dodać własne pola, żeby dokładniej opisywać dzieła."
- **Icons after the name:** a place shows the icon of its type; an event shows `circle-dot` for a single year and `move-horizontal` for a range, both unused elsewhere; an own field shows the icons of its artwork types and a field for all types shows none ([ADR-0189](0189-scope-own-fields-to-artwork-types-and-give-them-pages.md)).

### Consequences

- Good: the tools read as part of their tab, and the page has one kind of primary action.
- Good: the records are separated and the counts read as counts.
- Bad: the framed panel takes a little more height than the current row.

## More information

Design issue ATL-500, build ATL-501. Mockups in the project files, `kartoteka-0-20/`.
