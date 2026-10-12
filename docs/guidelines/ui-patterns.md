# UI patterns

How views and components look and behave, so every new screen stays consistent with the existing ones. Components live in [`packages/ui`](../../packages/ui/README.md) and are documented in Storybook; tokens are described in [design-tokens.md](design-tokens.md); code layout and naming are in [code-conventions.md](code-conventions.md); texts follow [voice and tone](../product/voice-and-tone.md). Why the patterns are encoded this way: [ADR-0019](../decisions/0019-encode-ui-standards-in-tokens-and-the-library.md).

## Tokens

- Views and components use only semantic tokens: `--color-bg`, `--color-fg`, `--color-fg-muted`, `--color-line`, `--color-surface`, `--color-stage-*`, `--size-content-*`, `--duration-*` and the scales for spacing, type and borders. Palette tokens such as `--color-neutral-950` are used only inside `design/tokens.json`.
- When a view needs a colour or size with a new role, add a semantic token for that role instead of reaching for the palette or a literal value.
- Spacing is a multiple of 4 from the `--spacing-*` scale. Border widths come from `--border-width-*`; corners are square (`--border-radius-none`); there are no shadows.
- A literal value is fine only for something that belongs to one component and has no shared role, for example the height of the artwork stage on a phone.

## Layout

- Mobile first. There is one breakpoint, `@media (min-width: 768px)`. CSS variables cannot be used in media queries, so the number is written out and only this one is allowed.
- Content width: forms and single-column panels use `--size-content-narrow` (400 px); text and lists use `--size-content-default` (720 px); the artwork wall and its top bar use `--size-content-wide` (1280 px) and are centred.
- Spacing between elements comes from the parent (`display: grid` or `flex` with `gap`). Elements do not set their own outer margins; `base.css` resets them.
- Each route group has a layout component in its domain folder, for example `AuthLayout` for the sign-in screens. A view passes its content through snippets (`children`, `footer`).
- Views of the signed-in learner use `AtelierLayout`: the menu as an icon rail from 768 px and as a drawer opened from the top bar on a phone, and a sticky top bar whose content the view passes as the `bar` snippet.
- Motion is short and functional: a panel that opens or closes, such as the side menu, transitions over `--duration-short`. Every transition sits inside `@media (prefers-reduced-motion: no-preference)`.
- A search over a list is the library `SearchField` in the top bar. It filters as the learner types, and its accessible name comes from `label` because the bar has no room for a visible label. It is at most `--size-content-default` wide.
- An icon button inside a field (show password, clear search) fills the field's height and is separated from the text by a hairline vertical divider.

## Text roles

`base.css` styles each role once. Views use the role and do not restyle it.

| Role | Markup | Look |
| --- | --- | --- |
| Page title | `h1` | `xl`, bold |
| Section title | `h2` | `lg`, bold |
| Subsection title | `h3` | `md`, bold |
| Lead, one sentence under the page title | `p.lead` | `md`, muted |
| Body | `p` | `md` |
| Caption: metadata, hints, secondary details | `.caption` | `sm`, muted |
| Artwork title | `cite.artwork-title` | Newsreader italic, `lg` |

- Every page has one `h1`. The page title in the browser tab is built with `m.app.pageTitle(title)`.
- Newsreader is used only for artwork titles.

## Element defaults

- The default look of HTML elements (links, headings, paragraphs, focus outline) lives only in `packages/ui/src/lib/styles/base.css`.
- A style that two or more views repeat moves into a library component or `base.css`.

## Links and buttons

- Going to another page is always a link, `<a href>`. SvelteKit's router handles internal links without a page reload and preloads them. A link that should look like a button is `<Button href={...}>`.
- `Button` without `href` is for actions on the current page: submit a form, sign out, resend a message.
- `goto` is for navigation from code after an action, for example after a successful sign-in.
- Each view has at most one `primary` button.
- Sign out is shown in `--color-danger`, so it stands apart from the menu items that navigate.

## Messages

- `Alert` shows status: `danger` for errors, `warning` for something to check, `success` for a finished action. Its label (`BŁĄD`, `UWAGA`, `GOTOWE`) comes from the shared library texts, so views do not pass it.
- An error that belongs to one field is shown under the field (`TextField` `error`).
- An error that belongs to the whole form is an `Alert` at the top of the form, with a title that names what failed ("Nie udało się zalogować").
- A success that ends the task replaces the form with an `Alert`. A success that keeps the user on the same task stands above the action it confirms.
- Raw errors from Supabase or other services are never shown; they are mapped to dictionary messages (see [code-conventions.md](code-conventions.md#errors-from-services)).

## Forms

- A form is the library `Form`: it turns off browser validation, prevents the page reload and, after submit, moves focus to the first field marked invalid and scrolls it to the middle of the screen, so a sticky bar never hides it.
- Fields are `TextField`, `TextArea` (longer text such as notes), `Checkbox` and future library inputs, each with a visible label and the right `autocomplete` value.
- A single choice from a fixed list (for example the artwork type) is a `Select`, with an empty first option such as "Nie wybrano" passed as `placeholder` when the field is optional.
- A category value (authors, period, style, material, location) is a `ValueField`: the chosen values are tags inside the field, and the suggestion list under it shows what the app passes as `options`. Which values to suggest, and whether a new value may be created, is decided in the app, not in the component.
- On a phone, form fields take the full content width, and so do an image that belongs to the form and the buttons under it.
- The flow on submit:
  1. Validate every field and clear the form error.
  2. If a field is invalid, stop. Its error shows under it and focus moves to the first invalid field.
  3. Disable the submit button and switch its label to the running form ("Logowanie…", with the single `…` character).
  4. Call the domain function from `#lib/<domain>`.
  5. On failure, show the mapped message in the form `Alert` and enable the button again.
  6. On success, navigate with `goto` or replace the form with a success `Alert`.
- Fields are validated on submit, not while typing.
- A long form keeps its actions in a bar fixed to the bottom of the screen. The action that leaves without saving ("Anuluj") is a link back to where the learner came from.
- A form that holds work the learner could lose asks before any navigation inside the app: a small `Dialog` "Odrzucić zmiany?" with "Wróć do formularza" and "Odrzuć". Without changes it lets the learner leave without asking. Closing the tab shows the browser's own warning, whose text the app cannot set.
- Limits used by a validator (for example `MIN_PASSWORD_LENGTH`) are exported constants, and the field hint uses the same constant.

## Dialogs

- A dialog is the library `Dialog`: a modal over `--color-scrim` that keeps focus inside, stops the page behind it from scrolling, closes with Escape and returns focus to the element that opened it. The view controls it with `bind:open`.
- The default size is for a task inside the dialog, such as picking an image candidate. It has a close button, takes the full screen on a phone and is at most `--size-content-default` wide from 768 px. Its actions sit in the `footer` snippet.
- `size="small"` is for a confirmation such as "Odrzucić zmiany?": a short question as the title, the consequence as the `description`, and two buttons in the footer, the safe one first and the one that confirms as `primary`. It has no close button; Escape answers with the safe choice.
- A dialog does not close when the learner clicks the scrim, so a choice is never lost by a stray click.

## Artwork images

- An artwork image sits in `Frame`: `list` in lists, `view` in a detail view or on a stage. The image keeps its proportions and never fills a thumbnail slot at the side.
- In the collection each artwork is an `ArtworkTile`: the image on a solid paper passe-partout, 8 px on the top and sides, with the title, authors and date on the wider bottom edge and the record number on the image. The passe-partout stays paper in both themes (`--color-mat-*`).
- After an artwork is saved, the wall opens at the top and its tile carries an outline in `--color-fg` for about two seconds, which then fades over `--duration-short`.
- The `alt` text of an artwork is "Title, Author". A decorative copy of the same image (for example a blurred backdrop) has `alt=""` and `aria-hidden="true"`.
- A caption uses `figure`, `figcaption` and `cite.artwork-title`, with author and date as a caption and the image credit below. The credit names Wikimedia Commons; when the image is not public domain or CC0 (a CC BY or CC BY-SA photo of an old work), it also names the photographer and the licence.
- A featured artwork sits on the stage: `--color-stage-bg` behind it and `--color-stage-fg` and `--color-stage-fg-muted` for its caption. The stage is dark in both themes.

## Logo

- The brand is the library `Logo` (mark and wordmark) or `LogoMark` (mark only), never text styled to look like a logo. Both follow the text colour. Why it looks this way: [ADR-0020](../decisions/0020-logo-passe-partout-mark-and-wordmark.md).
- `Logo` takes its accessible name from `m.app.name`. `LogoMark` is decorative unless it gets a `label`.
- Content or animation inside the mark (for example a loader) is passed as SVG children of `LogoMark`.

## Library texts

The library has English defaults for its own words (alert labels, show and hide password, remove tag). The app sets the Polish texts once in the root layout with `setUiMessages(m.ui)`. A view passes a text prop such as `label` only when one place needs different wording.

## Storybook

Every library component has stories for each variant and state, including error and disabled. Components that belong to the app (for example `AuthLayout`) are not in Storybook.
