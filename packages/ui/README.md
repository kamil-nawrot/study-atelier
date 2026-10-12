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

Icons come from Lucide and are always drawn through `Icon` ([ADR-0017](../../docs/decisions/0017-ui-icons-from-lucide.md)):

```svelte
<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import { Icon } from '@study-atelier/ui';
</script>

<Icon icon={Search} size="sm" />
```

`styles.css` loads the token variables, fonts and base styles (margin reset and text roles) once, in the root layout. Set `data-theme="light"` on the root element for the light theme; dark is the default.

Components have English default texts. The app sets its own once, in the root layout:

```svelte
<script lang="ts">
	import { setUiMessages } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';

	setUiMessages(m.ui);
</script>
```

Patterns for using the components are in [ui-patterns.md](../../docs/guidelines/ui-patterns.md).

## Components

| Component    | Purpose                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `Alert`      | Status message with a coloured label bar: `danger`, `warning`, `success`                                    |
| `Button`     | Outline button with a heavier bottom edge; `primary` is filled, one per view; a link with `href`            |
| `Dialog`     | Modal over the scrim with title, body and footer actions; full screen on a phone; `small` for confirmations |
| `Form`       | Form without browser validation; focuses the first invalid field on submit                                  |
| `Tag`        | Flat tag with `#` prefix; optional remove button                                                            |
| `TextField`  | Labelled input with hint, error and password reveal                                                         |
| `ValueField` | Category values as removable tags with a suggestion list (combobox); one value with `single`                |
| `Select`     | Labelled single choice from a fixed list, styled like `TextField`, with hint and error                      |
| `Checkbox`   | Labelled checkbox                                                                                           |
| `Frame`      | Passe-partout frame for artworks: `list` or `view` size                                                     |
| `Icon`       | Lucide icon in the shared style: `sm` (20 px) or `md` (24 px)                                               |
| `Section`    | Text section with a heavy left edge (spine)                                                                 |

## Commands

| Command          | What it does                                                          |
| ---------------- | --------------------------------------------------------------------- |
| `pnpm storybook` | Start Storybook at http://localhost:6006                              |
| `pnpm tokens`    | Regenerate `src/lib/styles/tokens.css` from `design/tokens.json`      |
| `pnpm check`     | Check that `tokens.css` is current and type check                     |
| `pnpm lint`      | Prettier check and ESLint                                             |
| `pnpm test`      | Run unit tests (Node) and component tests (Chromium) once with Vitest |
| `pnpm build`     | Build the static Storybook into `storybook-static`                    |
