# 0053. Link values and artworks from notes with @ and #

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

Notes on artworks ([ADR-0029](0029-format-notes-with-a-visual-markdown-editor.md)) and on values ([ADR-0049](0049-give-every-category-value-a-page-of-its-own.md)) often name an author, a place, a style or another artwork. Since 0.4 every value and every artwork has a page, but a note can only name them as plain text; ADR-0029 left links out of the editor. How does the learner link a value or an artwork from a note, how is the link stored so it survives renaming, merging and deleting, and how does it look?

## Decision drivers

- Typing a link is as quick as typing the name; the learner does not write Markdown link syntax or copy addresses.
- A note stays Markdown text that reads well outside the app.
- A link survives renaming and merging values; a link to something that is gone does not lead nowhere.
- It works on a phone, where `@` and `#` sit on the second layer of the keyboard.
- The rendered note still runs no script and accepts no markup of its own.

## Considered options

Trigger characters: one character for values (`@`) and one for artworks (`#`); a separate character for each kind of value.

What a link points at: the value's or artwork's id; its name.

Text of the link: a fixed token showing the current name; text the learner can change, for example to inflect it ("w Luwrze").

Look in the note: a thin muted underline; the title font in italics with a dotted underline; an underline with a small icon of the kind.

Place of the suggestion list: a small list at the cursor; a list under the whole notes field, like the suggestions of value fields; at the cursor on a computer and above the keyboard on a phone.

Toolbar: no button; one button for `@`; buttons for `@` and `#`.

## Decision outcome

Chosen, decided by the owner in ATL-145: `@` for values and `#` for artworks, links by id, a fixed token with the current name, the thin underline, the list under the field, and both buttons in the toolbar.

### Writing a link

- In the notes editor `@` opens a list of the learner's values of every kind (eras, periods, styles, materials, authors, locations) matching the text typed after it; `#` opens a list of the learner's artworks matching a record number or a title. Picking a row replaces the typed text with the link.
- The list sits under the notes field across its whole width and looks like the suggestion list of a value field. A row shows the name on the left and the kind on the right ("Okres · nowożytność", "Autor", "Miejsce"); an artwork row shows "#0007 Dama z gronostajem" and its authors. Arrow keys move, Enter picks, Escape closes; a tap picks on a phone.
- The toolbar gets two icon buttons after a hairline separator: `@` (Lucide `AtSign`) and `#` (Lucide `Hash`). Each types its character at the cursor and opens the list, with the same accessible name, `aria-pressed` handling and roving focus as the other buttons.
- A link is one token: the cursor moves over it as one character and Backspace deletes it whole. Its text is always the current name of the value, or "#0007 Title" of the artwork, and cannot be edited or inflected.
- Summaries ("Podsumowanie") stay plain text without links.

### Storing a link

- A link is stored in the note as a plain Markdown link to the page in the app, so the note stays readable outside it: `[Caravaggio](/atelier/values/author/<id>)`, `[nowożytność](/atelier/values/era/early_modern)`, `[#0012 Powołanie św. Mateusza](/atelier/12)`. A value is identified by its id (an era by its code), an artwork by its record number, which never changes and is never reused.
- The text in brackets is only a fallback. The editor and the read-only view show the current name, and saving a note writes the current name back.
- Merging two values ([ADR-0040](0040-manage-category-values-in-a-card-index.md)) rewrites links to the merged value into links to the remaining one in artwork notes and value notes, in the same database function.
- Other Markdown links stay plain text, as ADR-0029 has it; only links to `/atelier/` pages of the shapes above become links.

### Showing a link

- In the notes of the artwork view and of a value page a link is the text in the foreground colour with a thin underline in the muted colour, and opens the page in the app.
- A link to a deleted value, to an artwork deleted for good or to an artwork in the trash shows as plain text with the last saved name, without the underline. Restoring the artwork from the trash brings the link back, because the address stays in the note.
- The same look applies in the editor.

### Texts

Conversational, as in the card index ([voice and tone](../product/voice-and-tone.md)):

- Hint under "Notatki": "Wpisz @, żeby dodać odnośnik do autora, epoki albo miejsca, albo #, żeby dodać odnośnik do dzieła."
- Toolbar buttons: "Dodaj odnośnik do autora, epoki, miejsca…" (`@`) and "Dodaj odnośnik do dzieła" (`#`).
- Nothing found: "Nie masz jeszcze takiej wartości w Kartotece." (`@`) and "Nie masz w kolekcji dzieła o takim numerze ani tytule." (`#`).
- "Wspomniane w" on a value page and in the artwork view (ATL-147): the heading "Wspominasz o tym w notatkach"; the section is left out when nothing links there.

### Consequences

- Good: a note becomes part of the learner's network of knowledge; a value page and an artwork are one tap away from where they are mentioned.
- Good: notes stay plain Markdown; nothing in the database changes except the merge function.
- Good: renaming a value never breaks or outdates a link.
- Bad: a link cannot be inflected; the learner writes "w muzeum Luwr" rather than "w Luwrze".
- Bad: the editor grows by two TipTap extensions (Mention and Suggestion) and a link token with its own Markdown parsing.
- Bad: bold or italics applied over a link are lost when the note is saved, since the token is a single atom.
- Bad: on a phone with the keyboard open the list under a long note can sit below the visible area until the page scrolls.

## More information

- Design issue ATL-145; build issues ATL-146 (links) and ATL-147 ("Wspomniane w"). Requirements R-70 to R-72.
- Allows links in notes, which [ADR-0029](0029-format-notes-with-a-visual-markdown-editor.md) left out; the rest of ADR-0029 stands. Values in the artwork view and the card index stay without links ([ADR-0047](0047-no-links-from-values-into-a-filtered-wall.md), ADR-0049).
- The Markdown round trip was checked on a throwaway branch with TipTap's Mention extension: its own Markdown form (`[@ id="…" label="…"]`) is not readable outside the app, so the build writes plain links instead.
- Mockups are kept with the project files under `atl-145/`.
