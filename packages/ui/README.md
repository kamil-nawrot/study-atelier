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

Components have English default texts. The app sets its own once for the whole app, in the root layout (and in the setup file of its tests):

```svelte
<script lang="ts">
	import { setUiMessages } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';

	setUiMessages(m.ui);
</script>
```

Patterns for using the components are in [ui-patterns.md](../../docs/guidelines/ui-patterns.md).

## Components

Every exported component has a row here; a pull request that adds a component adds its row.

### Actions and forms

| Component      | Purpose                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`       | Outline button with a heavier bottom edge; `primary` is filled, one per view; `danger` for deletes; a link with `href`                            |
| `TextButton`   | Small underlined text action without a frame, read as part of a line ("Wyczyść filtry", "Zwiń wszystkie")                                         |
| `Form`         | Form without browser validation; focuses the first invalid field on submit                                                                        |
| `FormActions`  | Bar fixed to the bottom of the screen with a form's actions                                                                                       |
| `TextField`    | Labelled input with hint, error, password reveal and an `action` button beside the input                                                          |
| `TextArea`     | Labelled multi-line input with hint and error                                                                                                     |
| `SearchField`  | Search input with a clear button, labelled for assistive technology only                                                                          |
| `Select`       | Labelled single choice from a fixed list on the native `select`, with hint and error; `compact` hides the label and shrinks to an icon on a phone |
| `SearchSelect` | Labelled single choice from a long list, filtered as the learner types (combobox)                                                                 |
| `ValueField`   | Category values as removable tags with a suggestion list (combobox); one value with `single`, at most `max`, `labelHidden`                        |
| `Checkbox`     | Labelled checkbox                                                                                                                                 |
| `Switch`       | Labelled on/off switch (a native checkbox with `role="switch"`), for a setting that governs other fields                                          |
| `ChoiceTiles`  | Single choice shown as tiles with an icon (era, artwork type), as a radio group; `clearable`                                                      |
| `ToggleTiles`  | Several choices shown as tiles with a count, for filters                                                                                          |
| `ToggleTag`    | Pressable tag with an optional count, for filters and options                                                                                     |
| `StepSelect`   | Levels chosen in steps ("Epoka › Okres › Styl"); a step presses every step above it; `lg` tiles                                                   |
| `FilePicker`   | Button over a hidden native file input, with `accept`, handing over the picked file                                                               |
| `FieldMessage` | Hint or error line under a field, optionally a polite live region                                                                                 |
| `NotesEditor`  | Notes with formatting and links to values and artworks, edited as Markdown (TipTap)                                                               |

### Messages and overlays

| Component       | Purpose                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `Alert`         | Status message with a coloured label bar: `danger`, `warning`, `success`                                     |
| `Toast`         | Short confirmation floating above the content; disappears after 5 s; the newest message replaces the old one |
| `Dialog`        | Modal over the scrim with title, body and footer actions; full screen on a phone; `small` for confirmations  |
| `Popover`       | Text-like trigger that opens a card on click, hover or focus                                                 |
| `PopoverCard`   | The card of a `Popover` or of a glossary term in notes; `interactive` holds a link                           |
| `PopupButton`   | Button that opens a panel under it (role `dialog`), closed by a click outside or Escape; optional tooltip    |
| `Tooltip`       | One short line above or below a control, on hover and keyboard focus                                         |
| `LoadingScreen` | Full-screen first load: the logo mark with strokes in its window                                             |
| `ProgressLine`  | Thin stroke along the bottom of the top bar while a navigation loads                                         |
| `Primer`        | Faint strokes laid across an image window while the image loads                                              |

### Text and structure

| Component    | Purpose                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `Section`    | Text section with a heavy left edge (spine)                                                          |
| `Disclosure` | Collapsible group with a heading, a count and a chevron (native `details`); `muted`, `plain`, `lazy` |
| `Tabs`       | Row of text tabs under a hairline that switch what a view lists                                      |
| `Tag`        | Flat tag with `#` prefix; optional remove button                                                     |
| `Count`      | Number in a small filled box; `outlined` is the muted form                                           |
| `Notes`      | Read-only notes from Markdown, with links to values and artworks and marked glossary terms           |
| `Icon`       | Lucide icon in the shared style: `sm` (20 px) or `md` (24 px)                                        |

### Artworks and brand

| Component      | Purpose                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `ArtworkTile`  | An artwork on the wall: image or placeholder, title, authors, date, record number, era mark and heart |
| `ArtworkImage` | Artwork image with `srcset`, loading primer and a message when it fails                               |
| `NoImage`      | Placeholder for an artwork without an image: the catalogue cross                                      |
| `Frame`        | Passe-partout frame for artworks: `list` or `view` size                                               |
| `Logo`         | The mark with the wordmark                                                                            |
| `LogoMark`     | The passe-partout mark alone, with content for its window                                             |

## Commands

| Command              | What it does                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm storybook`     | Start Storybook at http://localhost:6006                                                             |
| `pnpm tokens`        | Regenerate `src/lib/styles/tokens.css` from `design/tokens.json`                                     |
| `pnpm check`         | Check that `tokens.css` is current and type check                                                    |
| `pnpm lint`          | Prettier check and ESLint                                                                            |
| `pnpm test`          | Run unit tests (Node) and component tests (Chromium) once with Vitest                                |
| `pnpm test:coverage` | Run the tests once and measure coverage of `src/` into `coverage/` (report in `coverage/index.html`) |
| `pnpm build`         | Build the static Storybook into `storybook-static`                                                   |
