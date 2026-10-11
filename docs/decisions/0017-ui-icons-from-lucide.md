# 0017. Use Lucide icons through a shared Icon component

- Status: accepted
- Date: 2026-10-11

## Context and problem statement

Views need interface icons: navigation, actions on the collection, fields of an artwork record and status messages. The password field already shows an eye icon. One icon set and one way of drawing it keeps the interface consistent with the two-tone, sharp-edged design system ([ADR-0010](0010-design-tokens-figma-sync.md), [ADR-0013](0013-component-library-with-storybook.md)).

## Decision drivers

- One consistent line style that matches square corners and thick borders.
- Free, open licence and no requests to external servers.
- Only the icons a view uses reach the app bundle.
- Icons follow the text colour, so both themes work without extra tokens.

## Considered options

1. Lucide (`@lucide/svelte`) wrapped in an `Icon` component in `packages/ui`
2. Lucide components used directly in views
3. Hand-drawn SVG icons kept in the repository

## Decision outcome

Chosen option: 1, because Lucide is an open (ISC) outline set with icons for everything the MVP needs, its per-icon imports keep the bundle small, and a wrapper fixes the style in one place.

- Views import an icon from `@lucide/svelte/icons/<name>` and render it with `Icon` from `@study-atelier/ui`, never the Lucide component on its own.
- Two sizes: `sm` (20 px) next to text, for example in buttons, tags and inputs, and `md` (24 px) for icons on their own.
- Stroke width 2 px with square line caps and mitred joins, matching radius 0.
- Icons use `currentColor`. Without a `label` an icon is hidden from assistive technology; with a `label` it is announced as an image. An icon-only button carries its accessible name on the button.
- Storybook shows the basic set on the `Icon` gallery page.

### Consequences

- Good: changing size or stroke for the whole app is a change in one component.
- Good: the owner reviewed and accepted the basic set in both themes.
- Bad: icons Lucide lacks need a custom SVG that copies its 24 px grid and stroke.

## More information

- Lucide: https://lucide.dev
