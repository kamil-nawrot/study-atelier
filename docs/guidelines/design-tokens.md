# Design tokens

Design tokens (colours, typography, spacing, radii and similar values) are the shared language between Figma and the code. See [ADR-0010](../decisions/0010-design-tokens-figma-sync.md) for why it works this way.

## Where tokens live

- File: `design/tokens.json`, a single file (the free Tokens Studio plugin cannot sync a folder).
- Format: [W3C Design Tokens Community Group](https://www.designtokens.org/) format (`$value`, `$type`, `$description`).
- Top-level keys are token sets (for example `core`). `$themes` and `$metadata` are managed by Tokens Studio.

## Branches

- `design/tokens` is a long-lived branch used only by the Tokens Studio plugin.
- Changes from Figma land on `design/tokens`. Claude opens a pull request from it into `develop`, with the issue key in the title.
- Token changes made in code also go to `design/tokens` first, so the plugin can pull them; then they follow the same pull request into `develop`.
- After a token pull request is merged, `develop` is merged back into `design/tokens` so the branch stays current.

## Kamil's flow in Figma

1. Make changes in Tokens Studio.
2. Push them to GitHub from the plugin, with a Conventional Commits message, for example `feat(design): add accent colour scale`.
3. Tell Claude (or create a Linear issue) so the change gets a pull request and the components are updated.

To get Claude's changes: pull from GitHub in the plugin.

## Claude's rules

- Never hand-edit `$themes` or `$metadata` without checking the Tokens Studio format; the plugin owns them.
- Keep tokens in DTCG format and validate the JSON before pushing.
- Components consume tokens through generated CSS custom properties, never hard-coded values. The build step that generates them will be set up together with the frontend.
