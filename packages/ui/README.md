# @study-atelier/ui

Shared Svelte components and styles for study-atelier, documented in Storybook ([ADR-0013](../../docs/decisions/0013-component-library-with-storybook.md)).

## Use in the app

```svelte
<script lang="ts">
	import '@study-atelier/ui/styles.css';
	import { Button } from '@study-atelier/ui';
</script>

<Button variant="primary">Save</Button>
```

`styles.css` loads the token variables, fonts and base styles once, in the root layout. Set `data-theme="light"` on the root element for the light theme; dark is the default.

## Components

| Component   | Purpose                                                                      |
| ----------- | ---------------------------------------------------------------------------- |
| `Button`    | Outline button with a heavier bottom edge; `primary` is filled, one per view |
| `Tag`       | Flat tag with `#` prefix; optional remove button                             |
| `TextField` | Labelled input with hint, error and password reveal                          |
| `Checkbox`  | Labelled checkbox                                                            |
| `Frame`     | Passe-partout frame for artworks: `list` or `view` size                      |
| `Section`   | Text section with a heavy left edge (spine)                                  |

## Commands

| Command          | What it does                                                     |
| ---------------- | ---------------------------------------------------------------- |
| `pnpm storybook` | Start Storybook at http://localhost:6006                         |
| `pnpm tokens`    | Regenerate `src/lib/styles/tokens.css` from `design/tokens.json` |
| `pnpm check`     | Check that `tokens.css` is current and type check                |
| `pnpm lint`      | Prettier check and ESLint                                        |
| `pnpm test`      | Run unit tests once (Vitest)                                     |
| `pnpm build`     | Build the static Storybook into `storybook-static`               |
