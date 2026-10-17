# 0074. Keep a glossary of terms with definitions from Wikipedia, highlighted in notes

- Status: accepted
- Date: 2026-10-17

## Context and problem statement

The learner meets words and people while studying (tympanon, sfumato, Lorenzo Medici) that are not the value of any artwork field, so the card index cannot hold them: its values are born from artworks and can be deleted only when no artwork uses them ([ADR-0040](0040-manage-category-values-in-a-card-index.md)). Version 0.6 adds a glossary ("Słowniczek"). The spike ATL-187 settled the scope with the owner: an own module in the menu with its own table, a fixed list of categories with one per entry, one definition field filled from Polish Wikipedia and freely editable, and highlighting of entries in notes by exact match on the name and on forms typed by hand, without generated inflection. This record settles how the glossary looks and behaves (ATL-188).

## Decision drivers

- The app otherwise holds only the learner's own words (R-6); a fetched definition is an exception, like the portrait from Commons, and must stay attributed (CC BY-SA 4.0).
- A list and a page that read like a catalogue, consistent with the card index and its value pages ([ADR-0049](0049-give-every-category-value-a-page-of-its-own.md)).
- Highlighting must not crowd the notes or be mistaken for the `@` and `#` links ([ADR-0053](0053-link-values-and-artworks-from-notes.md)).
- No new icon may repeat one already used in the app ([ADR-0066](0066-icons-for-artwork-types-shown-like-eras.md)).

## Considered options

Each question was decided by the owner on mockups (desktop and phone) in the ATL-188 thread.

- List: (A) alphabetical with letters, the category and the first sentence of the definition, category tags as a filter; (B) sections per category with names only; (C) a dense two-column index with categories as tabs.
- Entry page: (A) a plain column; (B) the definition beside a narrow column with the category, forms and source; (C) like a value page of the card index.
- Changing the Wikipedia article in the form: (A) a link under the definition that opens a dialog; (B) the candidates always listed above the definition; (C) the candidates' titles as tags.
- Look of an entry in notes: (A) a dotted underline; (B) a small glossary icon after the word; (C) a background like a tag.
- Whether to highlight every occurrence or the first one; whether `@` links can point to entries; three icon sets; two text sets ("pojęcie" or "hasło").

## Decision outcome

Chosen, decided by the owner in ATL-188: list A, page C, dialog A, background C, the first occurrence only, no `@` links to entries, icon set A and texts A.

### Module and data

- "Słowniczek" is a menu item after "Kartoteka", with the Lucide icon `book-a`, at `/atelier/glossary`. An entry has a name, one category, a definition, other forms and an optional source; it does not depend on artworks, and deleting it changes no artwork or note.
- The six categories are fixed, each with an icon used nowhere else: Osoba `person-standing`, Architektura `drafting-compass`, Malarstwo `paintbrush`, Rzeźba `cuboid`, Technika i materiał `pipette`, Pojęcie ogólne `lightbulb`.
- Names are unique in the learner's glossary, compared like card index values (letter case and diacritics ignored); a duplicate shows an error under the name ("Masz już pojęcie „{nazwa}”.").

### List

- The page title "Słowniczek" with the lead "Pojęcia i postacie, które chcesz rozumieć. Ich definicje podpowiadają się w twoich notatkach." The top bar has the way back to the atelier and "Dodaj pojęcie" (the view's `primary` button, "Dodaj" on a phone).
- Under the lead, the six categories as `ToggleTag`s with an icon and the number of entries; pressing one filters the list, like the filter panel. A `SearchField` ("Szukaj pojęcia") follows once the glossary has at least 20 entries, as in the card index.
- Entries are sorted by name in Polish alphabetical order and grouped under their first letter, set large in the title font: to the left of the entries from 768 px, above them over a hairline on a phone. Each entry shows its name (bold, `lg`), its category as a small icon with the name in `--color-fg-muted`, and the first sentence of the definition, at most two lines. The whole entry links to its page.

### Entry page

- Built like a value page: the category in small capitals with its icon, the name in the title font, the other forms in one caption line ("też: tympanonu, tympanonie, …"), and the definition as a quote with a bar, with the source line under it inside the bar: "Na podstawie: Wikipedia, „{artykuł}”, CC BY-SA 4.0", where the title links to the article and the licence to its text.
- "Pojawia się w notatkach" lists the artworks and card index values whose notes contain the entry, matched like the highlighting below; the section is hidden when there are none.
- "Edytuj" and "Usuń" sit in the top bar only ([ADR-0051](0051-load-and-save-a-value-page.md)). Deleting asks in a small `Dialog` "Usunąć „{nazwa}” ze słowniczka?" ("Słowo w notatkach straci tło i dymek. Tego nie da się cofnąć.", "Zostaw" and "Usuń") and ends with a `Toast` "Usunięto „{nazwa}”." on the list.

### Form

- One column of `--size-content-default`: Nazwa (`TextField`), Kategoria (`ChoiceTiles` with icons, three columns, two on a phone), Definicja (`TextArea`) and Inne formy (a `ValueField` of free text: each form is a tag confirmed with Enter, with the hint "Formy, w których piszesz to słowo w notatkach, np. „tympanonu”. Każdą zatwierdzasz Enterem."). Actions in `FormActions`; leaving with changes asks "Odrzucić zmiany?". The bar says "Nowe pojęcie" or "Edycja pojęcia".
- Once the name and the category are set and the definition is empty, the app searches Polish Wikipedia and fills the definition with the first paragraph of the best match; while it searches the field says "Szukam w Wikipedii…". The search is full text (`list=search`) with the category word as a hint: "architektura", "malarstwo" or "rzeźba"; Osoba adds no word and keeps only articles about people (Wikidata P31 = human); the other categories add nothing. An empty result searches again with the name alone. Nothing found: "Wikipedia nie zna tego słowa. Napisz definicję własnymi słowami."; a failed request: "Nie udało się połączyć z Wikipedią. Możesz napisać definicję własnymi słowami albo spróbować jeszcze raz."
- Under a fetched definition stands the source line with two text buttons, "Wybierz inny artykuł" and "Usuń źródło". The first opens a default `Dialog` "Który to artykuł?" ("Wyniki z Wikipedii dla „{nazwa}” w kategorii {kategoria}. Wybierz ten, o który ci chodzi."): the candidates as a radio list, each with its title and the start of its first paragraph, the current one chosen, with "Anuluj" and "Użyj tego artykułu". When the learner has changed the fetched text, using another article first asks in a small `Dialog` "Zastąpić twoją definicję?" ("Definicja ma już twoje zmiany. Tekst z nowego artykułu je zastąpi.", "Zostaw moją" and "Zastąp").
- The definition is the learner's to edit freely; the source stays under it after edits until "Usuń źródło" removes it. The source keeps the article title, its address, the date it was fetched and the licence.
- With the category Osoba, a name that matches an author of the card index shows a warning `Alert` under the name: "{nazwa} jest już w Kartotece jako autor. Możesz dodać ją także tutaj albo opisać na stronie autora.", with the name linking to the author's page. Saving still works.
- Saving ends on the entry page with a `Toast` "Zapisano „{nazwa}”."

### Entries in notes

- In the read-only notes of artworks and card index values, a word or phrase that matches an entry's name or one of its other forms exactly (letter case ignored, whole words only) gets the background of a tag (`--color-tag`) with a little side padding. Only the first occurrence of each entry in a note is marked. Matching skips `@` and `#` links and does not run in the editor; when two entries overlap, the longer match wins.
- The marked word is a `Popover` trigger ([ADR-0059](0059-value-summary-card-in-the-artwork-view.md)): the card shows the category with its icon in small capitals, the name in the title font, the definition and, when the entry has a source, "Na podstawie Wikipedii, CC BY-SA 4.0" as a caption. Like the value card, it holds nothing to click.
- `@` links do not offer glossary entries: the background and the card are the only link between notes and the glossary.

### Consequences

- Good: entries reuse the patterns of the card index (value page, `Popover`, `ValueField`, `ChoiceTiles`), so the glossary needs few new components.
- Good: the first sentence of the definition on the list works as a small review while browsing.
- Good: the other forms are the column a later automatic inflection can fill without changing the model.
- Bad: exact matching misses inflected forms the learner has not typed; a common noun is marked only in the forms listed.
- Bad: from a note there is no way to the entry's page, only to its card.
- Bad: the first definition comes from Wikipedia, not from the learner, which R-6 otherwise avoids; the source line keeps it visible.

## More information

- Issues: ATL-187 (spike, analysis in Linear), ATL-188 (this design), ATL-189 (build: table, menu, list, page, form with the Wikipedia search, the dialog and the author warning), ATL-190 (build: marking entries in notes, the card and "Pojawia się w notatkach").
- The cloud environment cannot reach `pl.wikipedia.org`, so the search was designed from the API documentation and mocked in the mockups. ATL-189 starts by checking it live on a few entries (nawa, łuk, Dawid).
- The mockups are in the project files under `atl-188/`.
