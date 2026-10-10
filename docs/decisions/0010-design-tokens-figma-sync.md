# 0010. Keep the design system in code and sync design tokens with Figma through Tokens Studio

- Status: accepted
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

Kamil wants a design system that both he and Claude can edit and that Claude can read reliably. Kamil would prefer to work visually in Figma, but the project must stay free.

On the free Figma Starter plan the Figma MCP server allows only 6 read calls per month, so Claude cannot read a Figma file directly in practice. Full MCP access needs a paid Dev or Full seat.

## Decision drivers

- Zero cost.
- Claude must be able to read and change the design system without limits.
- Kamil wants to design visually.

## Considered options

1. Design system only in the repository: design tokens in JSON plus component documentation in Storybook
2. Option 1 plus free Figma with the Tokens Studio plugin syncing tokens with the repository through GitHub
3. Paid Figma seat with full MCP access

## Decision outcome

Chosen option: 2.

- The source of truth for the design system is the code: design tokens in `design/tokens.json` and Svelte components documented in Storybook.
- Kamil works in a Figma draft (not one of the three Starter team files) with the free Tokens Studio plugin, which syncs the token file with GitHub.
- Details of the workflow: [design tokens guideline](../guidelines/design-tokens.md).

Free Tokens Studio limits, checked on 2026-10-10 against the plugin's [Pro licence documentation](https://github.com/tokens-studio/tokens-studio-for-figma-plugin-docs/blob/main/get-started/pro-licence.md):

- Git sync is free, but only as a single file.
- Creating and switching Git branches is Pro, so the plugin is pinned to one branch (`design/tokens`).
- Creating and editing themes is Pro; applying and toggling existing themes is free. Themes can be defined in the JSON file in the repository instead.

### Consequences

- Good: no cost; Claude reads tokens from the repository; Kamil keeps a visual tool.
- Bad: only tokens sync. Components in Figma are sketches and are not kept in sync with the Svelte components automatically.
- Bad: the plugin writes to its own branch, so token changes reach `develop` through an extra pull request.
- To verify: that the plugin works in a Figma draft on the free plan, and that themes defined in JSON can be toggled in the free plugin.
