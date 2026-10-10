# 0010. Keep the design system in code and sync design tokens with Figma through Tokens Studio

- Status: accepted
- Date: 2026-10-10

## Context and problem statement

The owner wants a design system that both the owner and Claude can edit and that Claude can read reliably. The owner would prefer to work visually in Figma, but the project must stay free.

On the free Figma Starter plan the Figma MCP server allows only 6 read calls per month, so Claude cannot read a Figma file directly in practice. Full MCP access needs a paid Dev or Full seat.

## Decision drivers

- Zero cost.
- Claude must be able to read and change the design system without limits.
- The owner wants to design visually.

## Considered options

1. Design system only in the repository: design tokens in JSON plus component documentation in Storybook
2. Option 1 plus free Figma with the Tokens Studio plugin syncing tokens with the repository through GitHub
3. Paid Figma seat with full MCP access

## Decision outcome

Chosen option: 2.

- The source of truth for the design system is the code: design tokens in `design/tokens.json` and Svelte components documented in Storybook.
- The owner works in a Figma draft (not one of the three Starter team files) with the free Tokens Studio plugin, which syncs the token file with GitHub.
- Details of the workflow: [design tokens guideline](../guidelines/design-tokens.md).

Free Tokens Studio limits, checked on 2026-10-10 against the plugin's [Pro licence documentation](https://github.com/tokens-studio/tokens-studio-for-figma-plugin-docs/blob/main/get-started/pro-licence.md):

- Git sync is free, but only as a single file.
- Creating and switching Git branches is Pro, so the plugin is pinned to one branch (`design/tokens`).
- Themes are Pro: the Themes feature, including switching themes and [exporting styles by theme](https://docs.tokens.studio/figma/export/themes), needs a Pro licence ([source](https://docs.tokens.studio/manage-themes/simple-switch-guide)). Themes are still defined in `$themes` in the JSON file, so the code and a future Pro licence can use them.
- On the free plan the plugin uses the active token sets instead, and the set lowest in the list wins. To switch between dark and light, activate `core` + `dark` or `core` + `light` and export styles from those sets.

### Consequences

- Good: no cost; Claude reads tokens from the repository; the owner keeps a visual tool.
- Bad: only tokens sync. Components in Figma are sketches and are not kept in sync with the Svelte components automatically.
- Bad: the plugin writes to its own branch, so token changes reach `develop` through an extra pull request.
- Verified on 2026-10-10: the plugin works in a Figma draft on the free plan and pushes token changes to `design/tokens`.
- Bad: switching between dark and light in Figma means toggling token sets by hand and exporting styles again (checked against the Tokens Studio docs on 2026-10-10).
