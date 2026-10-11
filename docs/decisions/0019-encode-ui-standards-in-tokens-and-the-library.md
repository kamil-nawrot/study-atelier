# 0019. Encode UI standards in design tokens and the component library

- Status: accepted
- Date: 2026-10-11

## Context and problem statement

The first views (sign-in, sign-up, password reset) set patterns that later views will copy. Some of them were encoded only in the view that used them: palette colours for the dark artwork stage, widths and a breakpoint as literal pixels, Polish labels passed to library components on every use, navigation done with buttons that call `goto`, and the same margin and heading styles repeated in each page. Each repetition is a chance for the next view to drift. Where should these patterns live so that new views follow them by default?

## Decision drivers

- A new view gets the standard without remembering it.
- Theme logic stays in tokens ([ADR-0010](0010-design-tokens-figma-sync.md)), shared look stays in the library ([ADR-0013](0013-component-library-with-storybook.md)), UI text stays in the dictionary ([ADR-0015](0015-typed-message-dictionaries-for-i18n.md)).
- No new tools or dependencies.

## Considered options

1. Write the patterns down as rules only, and keep encoding them in each view
2. Encode each pattern in the layer that owns it (tokens, library, base styles) and write the rules that remain

## Decision outcome

Chosen option: 2.

- Tokens: views and components use semantic tokens only. New semantic tokens `color.stage.bg`, `color.stage.fg` and `color.stage.fg-muted` (the same in both themes) describe the dark stage behind a featured artwork. `size.content.narrow` (400 px) and `size.content.default` (720 px) set content widths. The single breakpoint, 768 px, is written in the guidelines because CSS variables cannot be used in media queries.
- Library texts: `packages/ui` keeps English defaults and exports `setUiMessages`. The app sets its `m.ui` dictionary group once in the root layout; props still override a text in one place.
- Navigation: `Button` renders a link when it gets `href`. Going to another page is a link; `goto` is used only after an action.
- Forms: a generic `Form` in the library replaces the app's `AuthForm`. It prevents the page reload, turns off browser validation and focuses the first invalid field after submit.
- Base styles: `base.css` resets outer margins and styles the text roles (page, section and subsection titles, lead, caption, artwork title) once.

The rules that cannot be encoded are in [ui-patterns.md](../guidelines/ui-patterns.md) and [code-conventions.md](../guidelines/code-conventions.md).

### Consequences

- Good: a new view that uses the library and tokens gets the stage colours, widths, labels, form behaviour and text styles without extra code.
- Good: links behave like links (new tab, preload, screen readers).
- Bad: global text styles in `base.css` apply to every `h1`–`h3`, so a heading that needs another look must override them deliberately.
- Bad: new tokens go through the `design/tokens` branch first, which adds a step to changes like these.

## More information

- Enforcing the token rules with Stylelint is a separate issue (ATL-29).
- A shared helper for artwork image URLs with the widths each source supports, plus `srcset`, comes with the random artwork on the sign-in screens (ATL-26).
