# 0054. Switch to the light theme from the menu

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

The tokens have had a light theme since ATL-4 (`[data-theme='light']` in `tokens.css`, [ADR-0013](0013-component-library-with-storybook.md)), and the library was reviewed in both themes in Storybook, but nothing in the app sets the theme: the learner always sees the dark one. Shown in the light theme as it is, the app works with two gaps: the passe-partout of a wall tile has the colour of the wall and disappears (left open in [ADR-0021](0021-collection-view-as-a-wall-of-framed-artworks.md)), and muted text on a tag background reaches only 3.9:1. Where does the learner switch, how is the choice kept, and how does the wall look?

## Decision drivers

- Dark stays the default (ATL-4); light is a choice.
- The page must not flash dark before the light theme is set.
- The passe-partout must stay visible on the wall in both themes.
- Text meets WCAG AA (4.5:1) in both themes.

## Considered options

For the passe-partout in the light theme (mockups in the ATL-148 issue):

1. Dark card, as in the dark theme.
2. A light card slightly darker than the wall (`#D4D1CA`).
3. A light card lighter than the wall (`#EEECE6`).

## Decision outcome

- The switch is an item at the bottom of the menu, between "Kosz" and "Wyloguj się": "Jasny motyw" with a sun in the dark theme, "Ciemny motyw" with a moon in the light theme. One click switches at once.
- The choice is kept on the device in `localStorage` (`study-atelier:theme`, only when light). A small script that the server hook puts into the head of the page shell sets `data-theme` on `<html>` before the first paint.
- Passe-partout: option 3, chosen by the owner, because it stays light and reads as a real paper card on the wall. The new palette colour `color.neutral.50` (`#EEECE6`) is the `color.mat.bg` of the light theme; the window stays `neutral.150`.
- Muted text in the light theme, `neutral.600`, goes from `#5E5952` to `#544F49`: 4.6:1 on the tag background, 6.1:1 on the page.
- The stage (artwork view, sign-in screens, loading screen) stays dark in both themes, as `color.stage.*` already defines.

### Consequences

- Good: the light theme needs no change in views; every colour already comes from tokens, and Stylelint keeps it so.
- Good: no flash of the dark theme on load.
- Bad: the choice is per device, not per account.
- Bad: on the dark stage of the artwork view the passe-partout is a little lighter in the light theme than in the dark one.
- Bad: `neutral.600` is also the muted text on the passe-partout in the dark theme, which gets slightly darker there too (more contrast).

## More information

- Implementation: ATL-148. Requirement R-73.
- Settles the open light theme question of ADR-0021.
- Figma: the new `neutral.50`, the changed `neutral.600` and the light `color.mat.bg` reach Figma with the next styles export ([design tokens](../guidelines/design-tokens.md)).
