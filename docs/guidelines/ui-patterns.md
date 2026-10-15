# UI patterns

How views and components look and behave, so every new screen stays consistent with the existing ones. Components live in [`packages/ui`](../../packages/ui/README.md) and are documented in Storybook; tokens are described in [design-tokens.md](design-tokens.md); code layout and naming are in [code-conventions.md](code-conventions.md); texts follow [voice and tone](../product/voice-and-tone.md). Why the patterns are encoded this way: [ADR-0019](../decisions/0019-encode-ui-standards-in-tokens-and-the-library.md).

## Tokens

- Views and components use only semantic tokens: `--color-bg`, `--color-fg`, `--color-fg-muted`, `--color-line`, `--color-surface`, `--color-stage-*`, `--size-content-*`, `--duration-*` and the scales for spacing, type and borders. Palette tokens such as `--color-neutral-950` are used only inside `design/tokens.json`.
- When a view needs a colour or size with a new role, add a semantic token for that role instead of reaching for the palette or a literal value.
- Spacing is a multiple of 4 from the `--spacing-*` scale. Border widths come from `--border-width-*`; corners are square (`--border-radius-none`); there are no shadows.
- A literal value is fine only for something that belongs to one component and has no shared role, for example the height of the artwork stage on a phone.

## Layout

- Mobile first. There is one breakpoint, `@media (min-width: 768px)`. CSS variables cannot be used in media queries, so the number is written out and only this one is allowed. Where a phone-only counterpart is needed, it is `@media (max-width: 767.98px)`, so the two ranges neither overlap at 768 px nor leave a gap for fractional widths.
- Content width: forms and single-column panels use `--size-content-narrow` (400 px); text and lists use `--size-content-default` (720 px); the artwork wall uses `--size-content-wide` (1280 px) and is centred.
- Spacing between elements comes from the parent (`display: grid` or `flex` with `gap`). Elements do not set their own outer margins; `base.css` resets them.
- Each route group has a layout component in its domain folder, for example `AuthLayout` for the sign-in screens. A view passes its content through snippets (`children`, `footer`).
- `AuthLayout` (the start page and the sign-in screens) shows the artwork twice from 768 px: as the background under `--color-scrim` and in a `Frame` on top. On a phone the stage shows only the background with the caption, because a framed image that small is hard to see.
- Views of the signed-in learner use `AtelierLayout`: the menu as an icon rail from 768 px and as a drawer opened from the top bar on a phone, and a sticky top bar whose content the view passes as the `bar` snippet. The top bar runs across the full width of the page beside the menu in every view ([ADR-0031](../decisions/0031-full-width-top-bar-in-every-atelier-view.md)): the way back, the view title or both on the left, the actions on the right. A title in the bar is small (`--font-size-sm`, medium weight), like the way back. The bar has the same height in every view, `--size-control` plus its padding, whatever the view puts in it.
- Motion is short and functional: a panel that opens or closes, such as the side menu, or a toast that appears and fades, transitions over `--duration-short`. Every transition sits inside `@media (prefers-reduced-motion: no-preference)`.

## Loading

- Something that loads shows it only after `--duration-loading-delay` (300 ms), so a fast load shows nothing. With reduced motion a loading indicator stands still. Why it looks this way: [ADR-0030](../decisions/0030-loading-states-for-the-first-load-and-images.md).
- The first app load is the full-screen `LoadingScreen`: the logo mark on the stage background, with one horizontal and one vertical stroke in its window. `hooks.server.ts` renders it into the page shell, `hooks.client.ts` takes it over, and the root layout removes it on its first mount.
- An image that loads is primed: `Primer` lays two coats of faint strokes across its window, horizontal then vertical, in the muted text colour of the surface.
- A navigation that is still loading shows a thin stroke travelling along the bottom edge of the top bar (the library `ProgressLine`, a `progressbar` named "Wczytywanie", placed by `AtelierLayout`), after the same 300 ms delay; the content is `aria-busy`. The back arrow of the artwork view and the forms does nothing while a navigation is in progress, so a second click cannot leave the app.
- A form's running state stays in its submit label ("Zapisywanie…"); it does not get a loading indicator.
- A search over a list is the library `SearchField` in the top bar. It filters as the learner types, and its accessible name comes from `label` because the bar has no room for a visible label. It is at most `--size-content-default` wide. On the wall its left edge stays in line with the wall and "Dodaj dzieło" stays right next to it, so the field sets a start margin of half the space left beside `--size-content-wide`; this is the one element allowed its own outer margin.
- The order of the wall is a `Select` with `compact` and an `icon` in the top bar, after the search field and before "Dodaj dzieło". `compact` hides the visible label (the name stays for assistive technology) and, on a phone, shrinks the select to its icon; the native picker still opens on tap ([ADR-0033](../decisions/0033-order-the-wall-by-period-with-a-period-rail.md)).
- While the wall is ordered by era, the current era is shown by the `PeriodRail` fixed to the right edge when the margin beside the wall is at least 128 px wide, and by the `PeriodStrip` sticky under the top bar when it is not. The choice follows the measured margin, not a media query, because the side menu changes the margin. `AtelierLayout` publishes the bar's height as `--bar-height` for both.
- While the wall is ordered by author, the same rail and strip show the authors, without an era icon. The rail names only the current author when its rows are shorter than 18 px, and the strip drops its marks when there are more than 12 blocks, so a long list of authors never overlaps or overflows.
- An icon button inside a field (show password, clear search) fills the field's height and is separated from the text by a hairline vertical divider.
- Every single-line control (`Button`, `TextField`, `Select`, `SearchField`, and `ValueField` while its values fit on one line) is `--size-control` high, so a button next to a field lines up without extra styling. A new control sets `min-height: var(--size-control)` on its outlined box and no vertical padding of its own.
- A button that acts on what was typed in one field (for example "Użyj" next to an image URL) is passed to `TextField` as its `action`, so it stands next to the input under the label and stays there when an error shows under the field.

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
- Library controls build on native HTML elements (`dialog`, `select`, `input`), which bring their behaviour, accessibility and the phone's own pickers. Their look comes from tokens. Styling that only some browsers support (for example `appearance: base-select`) sits inside `@supports`, so the other browsers keep the plain native look.
- The one exception is `NotesEditor`: a `contenteditable` region driven by TipTap, because formatted notes cannot be edited in a native element ([ADR-0029](../decisions/0029-format-notes-with-a-visual-markdown-editor.md)). It keeps the `TextArea` look and exposes `role="textbox"` and a labelled `role="toolbar"`.

## Links and buttons

- Going to another page is always a link, `<a href>`. SvelteKit's router handles internal links without a page reload and preloads them. A link that should look like a button is `<Button href={...}>`.
- `Button` without `href` is for actions on the current page: submit a form, sign out, resend a message.
- `goto` is for navigation from code after an action, for example after a successful sign-in.
- Each view has at most one `primary` button.
- Text cut with an ellipsis shows its full content in the library `Tooltip`, on hover and on keyboard focus, and only when it is actually cut.
- Sign out is shown in `--color-danger`, so it stands apart from the menu items that navigate.
- A button that deletes is `variant="danger"`: an outline and text in `--color-danger`. The button that confirms the delete in its dialog stays `primary`.

## Messages

- `Alert` shows status: `danger` for errors, `warning` for something to check, `success` for a finished action. Its label (`BŁĄD`, `UWAGA`, `GOTOWE`) comes from the shared library texts, so views do not pass it.
- An error that belongs to one field is shown under the field (`TextField` `error`).
- An error that belongs to the whole form is an `Alert` at the top of the form, with a title that names what failed ("Nie udało się zalogować").
- A success that ends the task replaces the form with an `Alert`. A success that keeps the user on the same task stands above the action it confirms.
- A short confirmation that must not move the layout is a `Toast`, for example "Zapisano dzieło #0012." after "Zapisz i dodaj kolejne" empties the form for the next artwork. It floats above the content, centred, at most `--size-content-narrow` wide from 768 px and full width with side gutters on a phone. It disappears after 5 seconds, waits while the pointer is over it and has no close button. A new message replaces the one on screen.
- A view places one `Toast` and calls its `show(text)`. On a page with an action bar fixed to the bottom, the view passes the bar's height as `offset`, so the toast stands 16 px above the bar.
- Errors and warnings are never toasts: they stay in an `Alert` or under the field until the learner acts on them, because a toast can disappear before it is read.
- Raw errors from Supabase or other services are never shown; they are mapped to dictionary messages (see [code-conventions.md](code-conventions.md#errors-from-services)).

## Forms

- A form is the library `Form`: it turns off browser validation, prevents the page reload and, after submit, moves focus to the first field marked invalid and scrolls it to the middle of the screen, so a sticky bar never hides it.
- Fields are `TextField`, `TextArea` (longer plain text), `NotesEditor` (formatted notes, [ADR-0029](../decisions/0029-format-notes-with-a-visual-markdown-editor.md)), `Checkbox` and future library inputs, each with a visible label and the right `autocomplete` value.
- A single choice from a short fixed list that the learner should see all at once (the era) is `ChoiceTiles`: one row of tiles, three by two when the field is narrower than 600 px, each with an optional icon above the name and a note under it that never wraps. It is a native radio group, so the arrow keys move the choice. When the choice is optional the app sets `clearable` and clicking the chosen tile, or pressing the space bar on it, clears it. The chosen tile is filled like a primary button ([ADR-0038](../decisions/0038-chain-era-period-and-style.md)).
- A single choice from a longer fixed list (for example the artwork type) is a `Select`, with an empty first option such as "Nie wybrano" passed as `placeholder` when the field is optional.
- A category value (authors, period, style, material, location) is a `ValueField`: the chosen values are tags inside the field, and the suggestion list under it shows what the app passes as `options`. Which values to suggest, and whether a new value may be created, is decided in the app, not in the component.
- A field that depends on the one above it (Okres on the era, Styl on the Okres) is a `ValueField` with `locked` until that field is filled; the reason is its placeholder ("Najpierw wybierz epokę."). A locked field looks disabled but, when it still holds a value, lets the learner remove it. The fields below are cleared when the one above changes or is cleared, but not when it is first filled in.
- A setting that governs the fields below it is a `Switch` (a native checkbox with `role="switch"`, square, label first), placed above those fields on the right of the label row, together with any option that applies to all of them. The date of creation is the example: "ok." and the switch "Od – do" stand beside the title of the field, and the "p.n.e." of each year stays under its input. A group of inputs that share one title hides their individual labels (`TextField` `hideLabel`: the name stays for assistive technology and the placeholder says which is which, for example "Od" and "Do"), and the group is named by the title with `role="group"` ([ADR-0046](../decisions/0046-enter-the-date-of-creation-as-a-year-span.md)).
- A disabled field looks the same in every library input: a flat `--color-tag` fill instead of the outline, with the label and the text in `--color-fg-muted`.
- After a value is picked in a `ValueField` that takes many values, the suggestion list stays open for the next one. Removing a value with the mouse leaves focus where it was; with the keyboard, focus moves to the next remove button, or to the field without opening the list. In a `ValueField` that takes one value, picking with the mouse or a finger leaves focus alone, so the remove button shows no focus ring; picking with the keyboard moves focus to the remove button.
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
- A form that holds work the learner could lose asks before the learner leaves it, by any navigation inside the app or by signing out: a small `Dialog` "Odrzucić zmiany?" with "Wróć do formularza" and "Odrzuć". Without changes it lets the learner leave without asking. Closing the tab shows the browser's own warning, whose text the app cannot set.
- Limits used by a validator (for example `MIN_PASSWORD_LENGTH`) are exported constants, and the field hint uses the same constant.

## Dialogs

- A dialog is the library `Dialog`: a modal over `--color-scrim`, with the page behind it blurred by `--blur-scrim` (inside `@supports`, so other browsers keep the plain scrim), that keeps focus inside, stops the page behind it from scrolling, closes with Escape and returns focus to the element that opened it. The view controls it with `bind:open`.
- The default size is for a task inside the dialog, such as picking an image candidate. It has a close button, takes the full screen on a phone and is at most `--size-content-default` wide from 768 px. Its actions sit in the `footer` snippet.
- `size="small"` is for a confirmation such as "Odrzucić zmiany?": a short question as the title, the consequence as the `description`, and two buttons in the footer, the safe one first and the one that confirms as `primary`. It has no close button; Escape answers with the safe choice.
- A dialog that edits one item of a list (a value in the card index) is the default size: the item's name as the title, its kind and use as the `description`, its fields in the body, and in the footer the danger action on the left with the safe and the primary action on the right. A change that touches other records, such as merging two values, asks again in a small `Dialog` that names how many records change ([ADR-0040](../decisions/0040-manage-category-values-in-a-card-index.md)).
- A dialog does not close when the learner clicks the scrim, so a choice is never lost by a stray click.

## Filters

- The wall's filters follow [ADR-0042](../decisions/0042-filter-the-collection-in-the-browser.md). A choice of several values from a fixed list (the eras) is `ToggleTiles`: the tiles of `ChoiceTiles` as native checkboxes, each with an optional count. A choice of several values from a list that grows with the learner's data is a row of `ToggleTag` buttons: a tag that is pressed (`aria-pressed`) when chosen and shows the number of artworks next to it.
- On a larger screen the filters open in a side panel at the right edge, under the top bar, that narrows the wall and changes it at once. On a phone the order and the filters share a full-screen `Dialog` ("Widok") that closes with a button naming the number of artworks left.
- Active filters sit above the wall as `Tag`s with a remove button, followed by a text button that clears them all. In a tag the field name is in `--color-fg-muted` and the value in `--font-weight-medium`, so "Typ Rzeźba" reads as a field and its value at a glance.

## Tabs

- Kinds of one list that share a view are shown with the library `Tabs`: a row of text tabs under a hairline, the selected one underlined, with `tablist` roles, the arrow keys, Home and End. A tab changes only what the view lists; it does not change the address.
- A tag whose removal is not allowed is a `Tag` with `removeDisabled`, and the reason is written under the tags.

## Global shortcuts

- A keyboard shortcut that works anywhere in a view never takes over a text field. When the focus is in an `input`, a `textarea`, a `select` or an editable element such as the notes editor, the browser's own behaviour wins, even when the shortcut would otherwise apply to what the learner is doing.
- A shortcut is not the only way to a function: the same action has a visible control, because a phone has no keyboard.
- When a shortcut is mentioned in the interface, the keys are shown for the learner's system (⌘ on a Mac, Ctrl elsewhere).

## Artwork images

- An artwork image sits in `Frame`: `list` in lists, `view` in a detail view or on a stage. The image keeps its proportions and never fills a thumbnail slot at the side. The exception is the trash list, where the thumbnail is cropped to 4:5 on the paper passe-partout, so every row has the same height ([ADR-0028](../decisions/0028-trash-as-a-list-with-confirmed-deletes.md)).
- Every artwork image is the library `ArtworkImage`, with the image's stored width and height. It holds the image's place until it loads, primes the window while it loads, tries once more after 3 seconds when it fails, and then shows "Nie udało się wczytać obrazu" with the `image-off` icon. Pass `surface="frame"` inside a `Frame` and `surface="stage"` directly on the stage, such as the full-screen view; the default is the paper passe-partout. A view styles the image through `:global(img)` inside its own container. A decorative copy of an image (a blurred backdrop) and the small cropped thumbnails of the trash list stay a plain `img`.
- In the collection each artwork is an `ArtworkTile`: the image on a solid paper passe-partout, 8 px on the top and sides, with the title, authors and date on the wider bottom edge the record number in the top right corner of the image and the icon of the artwork's era in the top left corner. Each sits on its own translucent badge, and the icon badge keeps vertical padding (`--spacing-1`) so it never touches the badge edge. The passe-partout stays paper in both themes (`--color-mat-*`).
- An artwork without an image shows the library `NoImage` in the place of the image: the 4:5 window on `--color-mat-window` with a hairline rectangle inset by `--spacing-6` and both of its diagonals, drawn in `--color-mat-fg-muted` at reduced opacity, like the cross a catalogue prints for a picture without a photograph. It has no visible text and the accessible name "Brak zdjęcia". The wall tile, the stage of the artwork view (above "Dodaj zdjęcie") and the image field of the form use it, so they never draw their own empty window. It is not the loading state, which is the primed window ([ADR-0034](../decisions/0034-catalogue-cross-for-artworks-without-an-image.md)). An artwork whose own image exists but could not be fetched is not an artwork without an image: its tile shows the failed state of `ArtworkImage` (the image-off icon and the text "Nie udało się wczytać obrazu", the same as for an image that did not load) instead of the cross, and the wall offers one retry above it.
- From three columns up, an artwork at least twice as wide as it is high spans two columns, and the tile caption has a fixed height: the title in up to two lines, then authors and date in one line, where the authors are cut and the date stays. A cut caption shows its full text in a `Tooltip`. On a phone the caption stays full ([ADR-0035](../decisions/0035-wide-artworks-span-two-wall-columns.md)).
- The wall renders its tiles in parts of 60 and loads the images of tiles near the screen in batches, so a tile may show the primed window of `ArtworkImage` for a moment before its image arrives; it never shows the `NoImage` cross for that ([ADR-0044](../decisions/0044-load-wall-images-near-the-screen.md)).
- After an artwork is saved, the wall opens at the top and its tile carries an outline in `--color-fg` for about two seconds, which then fades over `--duration-short`.
- Saving an artwork whose title and authors match another one asks first with a small `Dialog` "Masz już takie dzieło": "W atelier jest już #0005 o tym samym tytule i autorach. Jeśli to inne dzieło, po prostu je zapisz.", with "Wróć do formularza" and "Zapisz mimo to". Its title is a statement, not a question ([ADR-0039](../decisions/0039-confirm-saving-a-duplicate-artwork.md)). Restoring an artwork from the trash asks the same question with the same `DuplicateDialog`, saying "Jeśli to inne dzieło, po prostu je przywróć.", with "Zostaw w koszu" and "Przywróć mimo to".
- After an edited artwork is saved, its page opens in place of the edit form in the browser history, so going back never returns to the form, and a `Toast` confirms "Zapisano zmiany w #0012.".
- A record number is always shown as `#` and at least four digits, padded with zeros: `#0012`, and `#12345` past 9999. This holds for tiles, page titles and messages. The app builds it with `formatRecordNumber` from `#lib/collection/format.ts`, and `ArtworkTile` formats its own `number`. Only the URL uses the bare number, `/atelier/12` ([ADR-0023](../decisions/0023-atelier-routes-and-commons-thumbnails.md)).
- In the add and edit form, the image actions sit under the passe-partout. "Dodaj własne" (or "Zmień własne" once an own image is set) opens a default-size `Dialog` titled "Dodaj własne zdjęcie" (or "Zmień własne zdjęcie"). It opens with a highlighted paste area on `--color-surface`: a clipboard icon, the hint "Masz obraz w schowku? Po prostu naciśnij Ctrl+V." with the keys drawn as boxes (⌘V on a Mac), the buttons "Wklej ze schowka" and "Wybierz plik z dysku" side by side, and under them the allowed formats and size. Below the area, a URL field labelled "Jeśli wolisz, podaj po prostu adres obrazka" has "Użyj"; Enter in that field uses the URL instead of saving the form. Errors show under the buttons or the field. The dialog closes once an image is set; closing it without one leaves the image as it was and clears what was typed. The file picker's `accept` lists both the allowed types and their extensions, so the system dialog filters files even where it does not know a type; the app still checks the picked file. With an image set, "Usuń zdjęcie" clears it, and an own image is captioned "Twoje zdjęcie, widoczne tylko dla Ciebie.".
- An image can be pasted from the clipboard ([ADR-0032](../decisions/0032-paste-the-own-image-from-the-clipboard.md)). Ctrl+V in the form takes an image, or an `https` address, only when the focus is not in a field the learner types in; a paste in a text field or the notes editor is left to that field. When the form already has an image, a small `Dialog` asks "Zastąpić obecne zdjęcie?" with "Zostaw obecne" and "Zastąp"; pasting inside the open own image dialog replaces without asking. A rejected pasted image shows its message under the image actions. The hint "Obraz ze schowka możesz też wkleić tutaj: Ctrl+V." sits under the image actions and shows only on devices with a fine pointer.
- The `alt` text of an artwork is "Title, Author". A decorative copy of the same image (for example a blurred backdrop) has `alt=""` and `aria-hidden="true"`.
- A caption uses `figure`, `figcaption` and `cite.artwork-title`, with author and date as a caption and the image credit below. The credit names Wikimedia Commons; when the image is not public domain or CC0 (a CC BY or CC BY-SA photo of an old work), it also names the photographer and the licence.
- A featured artwork sits on the stage: `--color-stage-bg` behind it and `--color-stage-fg` and `--color-stage-fg-muted` for its caption. The stage is dark in both themes.
- The artwork view ([ADR-0026](../decisions/0026-artwork-view-as-a-stage-with-an-information-panel.md)) puts the image on the stage, over a blurred copy of the same image under `--color-scrim`, with the information panel beside it. The panel lists every field in the order of the form; an empty field shows a muted dash, with "Nie wpisano" for screen readers. A view that fills the screen below the top bar, like this one, passes `fill` to `AtelierLayout`.
- A panel that the learner can close leaves a narrow strip with a chevron and the panel name written vertically, which open it again. The panel opens and closes with the same width animation as the side menu, off under `prefers-reduced-motion`.
- Moving an artwork to the trash and deleting it permanently each ask first with a small `Dialog` ("Przenieść #0012 do kosza?", "Usunąć #0012 na zawsze?"); restoring does not. A `Toast` confirms each of the three ("Przeniesiono #0012 do kosza.", "Przywrócono #0012.", "Usunięto #0012 na zawsze."). An error stays in an `Alert` in the dialog, or above the list for restoring.
- Clicking an artwork image in a detail view opens it full screen on the stage background; Escape or the close button returns.
- The artwork view flips through the artworks the wall showed last in this tab, in its order ([ADR-0048](../decisions/0048-flip-through-the-wall-from-the-artwork-view.md)): chevrons in `--color-stage-fg` at the edges of the stage, without a frame and semi-transparent until hover or focus, the one at either end of the list dimmed and inert; the arrow keys when the focus is not in a field or a dialog; a horizontal swipe on the stage. Flipping replaces the history entry, so the back arrow returns to the wall in one step. An artwork the wall did not show has no arrows.

## Logo

- The brand is the library `Logo` (mark and wordmark) or `LogoMark` (mark only), never text styled to look like a logo. Both follow the text colour. Why it looks this way: [ADR-0020](../decisions/0020-logo-passe-partout-mark-and-wordmark.md).
- `Logo` takes its accessible name from `m.app.name`. `LogoMark` is decorative unless it gets a `label`.
- Content or animation inside the mark (for example the strokes of `LoadingScreen`) is passed as SVG children of `LogoMark`.

## Library texts

The library has English defaults for its own words (alert labels, show and hide password, remove tag). The app sets the Polish texts once in the root layout with `setUiMessages(m.ui)`. A view passes a text prop such as `label` only when one place needs different wording.

## Storybook

Every library component has stories for each variant and state, including error and disabled. Components that belong to the app (for example `AuthLayout`) are not in Storybook.
