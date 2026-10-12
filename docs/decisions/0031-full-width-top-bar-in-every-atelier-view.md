# 0031. Run the top bar of every atelier view across the full width of the page

- Status: accepted
- Date: 2026-10-12

## Context and problem statement

[ADR-0027](0027-artwork-view-refinements.md) ran the top bar of the artwork view across the full width of the page and kept the other views' bars aligned with the wall. After using the app, the owner found the views inconsistent: the add and edit forms show a narrow bar with a large title "Edytuj dzieło #0042", while the artwork view has a full-width bar with a small way back on the left and actions on the right. Buttons and the way back shift when the learner moves between views.

## Decision drivers

- Every view of the atelier has the same top bar, so its parts stay in place between views.
- The search field on the wall stays in line with the wall under it.

## Considered options

1. Keep the bar width per view as in ADR-0027
2. Run the bar across the full width in every view, with the way back and the title on the left and the actions on the right

## Decision outcome

Chosen option: 2, the owner's direction in ATL-70.

- `AtelierLayout` gives its top bar the page gutter in every view, not only in views that fill the screen.
- The way back and the view title sit on the left, the actions on the right. The title in the bar is small, like the way back on the artwork view, instead of a page heading.
- On the wall, the search field keeps its left edge in line with the wall and "Dodaj" moves to the right edge of the bar.

This replaces the part of ADR-0027 that kept the bar of the wall aligned with the wall.

### Consequences

- Good: the bar looks and behaves the same in every view; the menu button, the way back and the actions keep their places.
- Bad: on a wide screen the wall's search field and its "Dodaj" button stand far apart.
- Bad: the forms lose their large heading; the title is only in the bar and in the browser tab.

## More information

- Requested in the project thread "ATL-70 Spójne nagłówki widoków", 2026-10-12. Implementation: ATL-70.
