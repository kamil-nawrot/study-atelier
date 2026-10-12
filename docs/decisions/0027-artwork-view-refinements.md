# 0027. Label the closed artwork panel with vertical text, animate it and widen the top bar

- Status: accepted
- Date: 2026-10-12

## Context and problem statement

[ADR-0026](0026-artwork-view-as-a-stage-with-an-information-panel.md) gave the closed information panel a strip with a chevron and an info icon. After using the built view, the owner found that the icon does not say what the strip opens, that the panel jumps open and closed while the side menu slides, and that the top bar of the view stops at the width of the wall while the view itself fills the page.

## Decision drivers

- The strip says what it opens.
- The two panels of the screen, the side menu and the information panel, behave alike.
- The top bar matches the width of the content under it.

## Considered options

1. Keep ADR-0026 as it is
2. Change the strip, animate the panel and widen the top bar of the artwork view

## Decision outcome

Chosen option: 2, the owner's refinements after reviewing the built view.

- The strip shows the chevron and "Informacje" written vertically, instead of the info icon.
- The panel opens and closes with the same width animation as the side menu, and without it when the learner prefers reduced motion.
- The top bar of the artwork view runs across the full width of the page beside the side menu. The wall keeps its bar aligned with the wall and the search field unchanged.

### Consequences

- Good: the strip names what it opens, and both panels move the same way.
- Good: the bar lines up with the view under it.
- Bad: vertical text is harder to read than horizontal text; it is one short word.
- Bad: the bar of the artwork view and the bar of the wall have different widths, so "Atelier" and the buttons shift when the learner moves between them.

## More information

- Requested in the project thread "ATL-63 Widok szczegółów dzieła", 2026-10-12. Implementation: ATL-63.
