# 0013. Build Svelte components in a workspace package documented in Storybook

- Status: accepted
- Date: 2026-10-10

## Context and problem statement

[ADR-0010](0010-design-tokens-figma-sync.md) keeps the design system in code: tokens in `design/tokens.json` and Svelte components documented in Storybook. The first views (sign-in and registration) need ready components, so three questions need answers: where the components live, how tokens become CSS, and whether Storybook is published.

## Decision drivers

- Views are built from shared components, never from one-off styles.
- Tokens stay the single source of truth; components never hard-code values.
- Zero cost and few dependencies.
- Storybook and its dependencies must not reach the app bundle.

## Considered options

Location:

1. A workspace package `packages/ui` (`@study-atelier/ui`)
2. A folder inside the app, `apps/web/src/lib/ui`

Tokens to CSS:

1. A small script in the package that writes CSS custom properties
2. Style Dictionary

Storybook publishing:

1. Local only (`pnpm storybook`), built in CI as a check
2. A separate Cloudflare Pages project deployed from `develop`

## Decision outcome

- Location: option 1. `packages/ui` holds the components, the generated token CSS, fonts and base styles. The app imports it as `@study-atelier/ui` from source; there is no separate build step for the package.
- Tokens to CSS: option 1. `packages/ui/scripts/build-tokens.ts` reads `design/tokens.json` and writes `src/lib/styles/tokens.css`: source sets and the first theme (dark) on `:root`, every other theme under `[data-theme='<id>']`. Only CSS is needed, so a dependency-free script is enough. The generated file is committed and `pnpm check` fails when it is out of date.
- Storybook: option 1. Storybook runs locally and CI builds it to catch broken stories. Publishing it can be decided later.

### Consequences

- Good: Storybook stays out of the app; the token CSS is readable in review; no extra build tool.
- Good: switching the theme is setting `data-theme` on the root element, the same in the app and in Storybook.
- Bad: the script supports only the token types used today; new types need a small change to it.
- Bad: Storybook is visible only to someone who runs it locally.

## More information

- Fonts (Schibsted Grotesk, Newsreader italic) are self-hosted from Fontsource packages, so no request goes to Google Fonts.
- Style Dictionary can replace the script if more platforms than CSS are ever needed.
