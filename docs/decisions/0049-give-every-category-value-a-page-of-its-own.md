# 0049. Give every category value a page of its own with the learner's notes

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

Since [ADR-0040](0040-manage-category-values-in-a-card-index.md) the card index ("Kartoteka") lists the learner's eras, periods, styles, materials, authors and locations, and a dialog renames, merges, links and deletes them. A value is still only a name. Version 0.4 is about what the learner knows about these values: what defines a style, who an author was, what a museum holds. [ADR-0047](0047-no-links-from-values-into-a-filtered-wall.md) kept the card index free for such pages. Where does that knowledge live, how is it entered, and how does it come back while the learner looks at an artwork?

## Decision drivers

- The content is the learner's own: they write it as part of learning. Nothing is generated or copied from ready-made sources, except a portrait image found the same way as an artwork image.
- Kinds differ: an author has a portrait and years of life, a location has a country and a type; the other kinds have only text.
- The shared `category_values` table ([ADR-0014](0014-artwork-collection-data-model.md)) carries saving an artwork, suggestions, merging, deleting, the trash and the filters; none of that should be rewritten for 0.4.
- The page reads like a page of a catalogue, not a list of records.
- Editing works like editing an artwork ([ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md)).

## Considered options

Data model:

1. Keep `category_values` as the shared list of names and add one details table per kind, one row per value
2. Split `category_values` into one table per kind, with its own link table to artworks

Layout of the value page: one column like a catalogue page (name, summary, notes, then the artworks); two columns with the text pinned on the left and the artworks on the right; or the artworks in the middle with the notes in a closable side panel.

Editing: the page turns into fields in place while the name, links and delete stay in the dialog; the dialog of ADR-0040 grows a summary and notes; or a form on its own page, like the artwork form, that replaces the dialog.

Author portrait: only the learner's own image; a search in Wikimedia Commons or an own image, as for an artwork; or no portrait.

Country of a location: a fixed list of countries; free text with suggestions; a fixed list plus a city.

Summary in the artwork view: a small tooltip with the summary only; a card with the kind, the name and the summary; or the summary unfolding under the value in the information panel.

A value without a summary in the artwork view: no popup; a card that says where to write it; or a card with the kind and the name only.

Texts: conversational (as in the card index today), matter-of-fact, or minimal.

## Decision outcome

Chosen, decided by the owner in ATL-19: data model option 1, the one-column page, a form on its own page, a portrait from Wikimedia Commons or an own image, a fixed list of countries, the card in the artwork view with no popup for a value without a summary, and the conversational texts with the owner's edits.

### Data

- `category_values` stays the shared list of names. Each kind gets its own details table with one row per value, keyed by the value, owned by the learner and dropped with it. The six eras are shared rows of `eras` without an owner ([ADR-0038](0038-chain-era-period-and-style.md)), so the learner's content about an era lives in its own table keyed by the learner and the era.
- Every kind, eras included: **Podsumowanie**, a short plain text, and **Notatki**, Markdown written in the same editor as artwork notes ([ADR-0029](0029-format-notes-with-a-visual-markdown-editor.md)).
- Author: a portrait, the years of life and an optional sort name.
  - The portrait is stored like the image of an artwork: a Commons file, an uploaded file in the `artwork-images` bucket or a link ([ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md)).
  - The years of life are a year span with "p.n.e." on each year and "ok." for the whole span, as the date of creation ([ADR-0046](0046-enter-the-date-of-creation-as-a-year-span.md)); a single year is allowed when only one is known.
  - The sort name ("Sortuj jako", for example "Vinci, Leonardo da") is used only when the learner ticks it on; otherwise authors sort by their name. The name stays one field, so "Fidiasz" needs nothing more and existing authors need no migration. "Autor nieznany" is a flag of the artwork, not a value, and has no page.
- Location: a country from a fixed list of today's countries, stored as its ISO 3166-1 code with Polish names in the app's texts, and a type: museum, private collection or on site. Both are optional.
- Merging two values ([ADR-0040](0040-manage-category-values-in-a-card-index.md)) keeps only the details of the remaining value; the merged value's summary, notes and fields are deleted with it, and the merge confirmation says so when it has any. Deleting a value deletes its details, and an uploaded portrait with them.

### The value page

- Opened by clicking a value in the card index: a period's name, a style tag, a material, author or location, and now also an era's name on the timeline. The dialog of ADR-0040 no longer opens there.
- One column. At the top the kind and the number of artworks ("Okres · 2 dzieła"), the name in the title font (Newsreader italic) and large, and under it the parent: the era of a period with its icon, the periods of a style. An era shows its icon and years. An author shows the portrait in a mat beside the name and the years of life under it; a location shows its type and country.
- Then the summary as a lead paragraph and the notes. A page without either says "Nie masz jeszcze notatek o tym okresie." followed by an "Edytuj" button.
- Below a rule, "Dzieła z tego okresu" (from this era, of this author, in this style and so on) with the number of artworks, and the artworks as wall tiles; a tile opens the artwork. Every kind has this part. A value no artwork uses says "Nie posiadasz w swojej kolekcji żadnego dzieła z tego okresu." in the matching form for its kind.
- The top bar has "← Kartoteka" on the left and "Edytuj" on the right.

### The form

- "Edytuj" opens a form on its own page with the layout of the artwork form: for an author the portrait in the left column with "Znajdź portret" and "Własny portret", the fields on the right; the other kinds have one column. "Anuluj" and "Zapisz" sit in the panel fixed to the bottom, as in the artwork form. Leaving with unsaved changes asks "Odrzucić zmiany?".
- Fields: "Nazwa" (not for an era), "Epoki" for a period and "Okresy" for a style, the fields of the kind, "Podsumowanie" and "Notatki". "Usuń" is at the end of the form. An era, which is not the learner's own value, has only "Podsumowanie" and "Notatki": no name, links or "Usuń". Renaming, merging, the links and deleting follow ADR-0040 unchanged; only their place moves from the dialog to the form.
- "Znajdź portret" searches Wikidata for people with the author's name and shows the candidates with their image (P18), as the artwork image search does ([ADR-0007](0007-images-from-open-sources.md)); "Własny portret" opens the own image dialog.
- "Kraj" is a select with search over the list of countries. "Typ miejsca" is three tiles like the era tiles: "Muzeum", "Kolekcja prywatna", "Na miejscu".
- Saving returns to the page with the toast "Zapisano zmiany.".

### The summary in the artwork view

- The era, period, styles, materials and location tags and each author's name in the line under the title show a card when the pointer rests on them or they get keyboard focus; on a phone a tap opens it and a tap elsewhere closes it.
- The card: the kind and the parent in small capitals ("Okres · nowożytność"), the name in the title font, the summary; for an author also the years of life. It has a border, no link and no actions.
- A value without a summary has no card and looks as it does today.

### Texts

Conversational, as in [voice and tone](../product/voice-and-tone.md):

- Card index lead: "Tu opisujesz i porządkujesz swoje epoki, okresy, style, autorów i miejsca. Kliknij nazwę, która cię interesuje, żeby zobaczyć szczegóły."
- Hint under "Podsumowanie": "Krótki opis do szybkiego podejrzenia przy oglądaniu dzieła."; placeholder of "Notatki": "Wszystko, co warto zapamiętać".
- Sort name: a checkbox that shows the "Sortuj jako" field with "Po tej wartości będą sortowani autorzy."
- Hint under "Kraj": "Wybierz kraj z listy."

### Consequences

- Good: the card index becomes the learner's own notes on art history, and the summary brings them back at the artwork without leaving it.
- Good: nothing that works on `category_values` changes; the new data sits beside it.
- Good: one way to edit a thing in the app, a form on its own page, for artworks and values alike.
- Bad: renaming or deleting a value takes one step more than the dialog did: open the page, then the form.
- Bad: six details tables, three of them (period, style, material) with the same two columns; they stay separate so each kind can grow its own fields.
- Bad: portraits found in Commons are the one piece of content not written by the learner, and uploaded portraits share the 1 GB of storage with artwork images.

## More information

- Design issue ATL-19; build issues ATL-138 (data, page, form, entry from the card index), ATL-131 (summary card in the artwork view) and ATL-127 (sort authors by the sort name). Requirements R-63 to R-69.
- Replaces the value dialog of [ADR-0040](0040-manage-category-values-in-a-card-index.md) by the page and the form; the rest of ADR-0040 stands. Settles the detail pages that [ADR-0047](0047-no-links-from-values-into-a-filtered-wall.md) left open; values in the artwork view stay without links.
- Mockups of the options are kept with the project files under `atl-19/`.
