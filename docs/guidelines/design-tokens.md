# Design tokens

Design tokens (colours, typography, spacing, radii and similar values) are the shared language between Figma and the code. See [ADR-0010](../decisions/0010-design-tokens-figma-sync.md) for why it works this way.

## Where tokens live

- File: `design/tokens.json`, a single file (the free Tokens Studio plugin cannot sync a folder).
- Format: [W3C Design Tokens Community Group](https://www.designtokens.org/) format (`$value`, `$type`, `$description`).
- Top-level keys are token sets (for example `core`). `$themes` and `$metadata` are managed by Tokens Studio.

## From tokens to CSS

`pnpm tokens` turns `design/tokens.json` into CSS custom properties in `packages/ui/src/lib/styles/tokens.css` ([ADR-0013](../decisions/0013-component-library-with-storybook.md)):

- A token path becomes a variable name: `color.neutral.100` is `--color-neutral-100`, `spacing.4` is `--spacing-4`.
- References stay references: `{color.neutral.950}` becomes `var(--color-neutral-950)`.
- The `dark` theme is the default on `:root`; the `light` theme applies under `[data-theme='light']`.
- Percentage line heights become unitless numbers and percentage letter spacing becomes `em`.

## Branches

- `design/tokens` is a long-lived branch used only by the Tokens Studio plugin.
- Changes from Figma land on `design/tokens`. Claude opens a pull request from it into `develop`, with the issue key in the title.
- Token changes made in code also go to `design/tokens` first, so the plugin can pull them; then they follow the same pull request into `develop`.
- After a token pull request is merged, `develop` is merged back into `design/tokens` so the branch stays current.

## The owner's flow in Figma

1. Make changes in Tokens Studio.
2. Push them to GitHub from the plugin, with a Conventional Commits message, for example `feat(design): add accent colour scale`.
3. Tell Claude (or create a Linear issue) so the change gets a pull request and the components are updated.

To get Claude's changes: pull from GitHub in the plugin.

To preview dark or light in Figma on the free plan: activate the `core` set plus either `dark` or `light`, deactivate the other, and export styles again. Theme switching is a Pro feature.

## Claude's rules

- Never hand-edit `$themes` or `$metadata` without checking the Tokens Studio format; the plugin owns them.
- Keep tokens in DTCG format and validate the JSON before pushing.
- Components consume tokens through generated CSS custom properties, never hard-coded values.
- After any change to `design/tokens.json`, run `pnpm tokens` and commit the regenerated `packages/ui/src/lib/styles/tokens.css`. `pnpm check` fails when it is out of date.
