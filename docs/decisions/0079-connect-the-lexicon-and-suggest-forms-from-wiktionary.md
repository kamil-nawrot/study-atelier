# 0079. Connect the lexicon with learning and suggest the forms of a term from Wiktionary

- Status: accepted
- Date: 2026-10-17

## Context and problem statement

Version 0.6 added a glossary of terms and people ([ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md), [ADR-0077](0077-trim-the-wikipedia-lead-and-polish-the-glossary-list.md)). After its first use the owner planned version 0.6.1 around two themes, connections and inflection: a marked term in a note should lead to its page, terms should be marked in other terms' definitions and on review flashcards, and the inflected forms of a term should be suggested from Polish Wiktionary instead of typed by hand. The owner also asked to rename the module to "Leksykon", give its list more air and a count of terms, add an optional sort name, and keep the "też: …" line under the name for synonyms only. Today one `forms` column mixes synonyms and inflected forms. This record settles how all of that looks and behaves (ATL-196).

## Decision drivers

- Exact matching in notes stays: no ending rules and no stem matching ("łuk" would match "Łukasza", ATL-187). Wiktionary only fills the list of forms, and the learner confirms it by saving.
- A phone has no hover: a tap on a marked word already opens its card, so the way to the term's page must be a separate, deliberate tap.
- A review session should not be left by accident.
- The form must not grow by ten tags of inflection for every term.
- The same patterns as the card index wherever one exists (the author's sort name, [ADR-0056](0056-author-portrait-years-of-life-and-sort-name.md)).

## Considered options

Each question was decided by the owner on mockups (desktop and phone) or on a card in the ATL-196 thread.

- The list: (A) the search field and the category tags as one block under the header, a hairline, then the list; (B) the search field in the top bar like on the wall; (C) the search and the tags in a side column on a computer.
- From the popover to the term's page: (A) a link under the definition; (B) the whole card as a link; (C) the term's name as a link.
- On a review flashcard: (A) a popover without the link; (B) the same popover with the link; (C) only the background, no popover.
- Inflection in the form: (A) a collapsed frame with the number of forms, expanding into tags; (B) a grey line of forms with "Edytuj formy"; (C) a read-only table of cases.
- When forms are fetched: (A) by themselves, like the definition; (B) only with a button; (C) by themselves, also when an old term is edited.
- The forms saved before: (A) all become inflected forms; (B) all become synonyms.
- The sort name: (A) a checkbox like for authors, in every category; (B) an always visible field for people only.
- Where the forms come from: the Polish Wiktionary declension tables, the Wikidata lexemes (no Polish lexeme for nawa, tympanon, kapitel or krzyżowy), or ending rules (rejected in ATL-187).

## Decision outcome

Chosen by the owner in ATL-196: list A, link A, flashcard A, form A, fetching A, saved forms A, sort name A, Polish Wiktionary, and texts A with the owner's changes (no source in the collapsed frame, no example in the synonyms hint, the sort hint of B, and the owner's own texts for a skipped and a missing word).

### Name

- The module is "Leksykon" in the menu, the titles, the way back and every text that named "słowniczek" ("Nie udało się wczytać Leksykonu", "Nie ma takiego pojęcia w Leksykonie. Może zostało usunięte.", "Usunąć „{nazwa}” z Leksykonu?", "Wróć do Leksykonu"). The route `/atelier/glossary`, the table and the code keep the name `glossary`.

### List

- The title row has the count of all terms on the right, like the count of artworks on the wall: `--font-size-sm`, `--color-fg-muted`, "1 pojęcie", "3 pojęcia", "21 pojęć". It counts every term, whatever the filter shows.
- The lead stays under the title. Under it, with more space, the search field (from 20 terms, as before) and then the category tags form one block; a hairline (`--color-line`) closes the block, and the list starts below it.
- The list has more air: `--spacing-12` between letters (and above the hairline between letters from 768 px) and `--spacing-8` between terms.
- A term with a sort name is sorted and grouped under its letter by that name; the list still shows the name.

### Entry page

- The "też: …" line under the name shows only the synonyms; it is hidden when there are none. Inflected forms are never shown on the page.
- Terms are marked in the definition of another term with the rules of notes: the first occurrence of each term, the longer match first, never the term itself in its own definition. The marked word opens the same popover as in notes.

### Popover in notes

- Under the definition and the source, after a hairline, the card has a link "Otwórz w Leksykonie" with an arrow (`arrow-right`), to the term's page.
- The card stays open while the pointer moves from the word onto it, and its content can be clicked; it closes as before on Escape, on a click outside and when the pointer leaves both the word and the card.
- On a phone the first tap on the word opens the card and a tap on the link opens the page.

### Review flashcards

- The notes on a flashcard, shown only after the card is revealed, mark terms like any notes. A marked word opens the popover without the link, so the popover is not a way out of the session.

### Form

- Under "Nazwa", in every category, a checkbox "Sortuj inaczej niż po nazwie" shows the field "Sortuj jako" (placeholder "np. Medici, Lorenzo", hint "Według tego pojęcie trafi pod właściwą literę."), as for authors. Unticked or empty, no sort name is saved.
- After "Definicja" comes "Synonimy": a `ValueField` of free text, always visible, with the hint "Inne nazwy tego samego. Pokażą się pod nazwą. Każdą zatwierdzasz Enterem.".
- Under it comes "Odmiana", collapsed by default: a frame with the number of forms ("1 forma", "3 formy", "10 form") and the text button "Pokaż formy" (`chevron-down`); expanded, the frame says "Zwiń" (`chevron-up`) and the forms below it are a `ValueField` the learner can remove from and add to. Without forms the frame holds the state of the search below instead of a number, and the empty `ValueField` stays open for typing. Under the frame stands the hint "Formy nie pokazują się pod nazwą. Dzięki nim pojęcie znajdzie się w notatkach także odmienione.".

### Forms from Wiktionary

- When a new term has a name and a category and its forms are empty, the app fetches them from Polish Wiktionary, the same way the definition is fetched from Wikipedia; while it fetches the frame says "Szukam odmiany w Wikisłowniku…". It does not fetch for the category Osoba nor for a name of more than two words; the frame then says "Odmianę tego pojęcia musisz dopisać samodzielnie.".
- One word: the app reads the forms from the Polish section of the word's page (`action=parse&prop=wikitext`): every parameter of every `odmiana-rzeczownik-polski` template, variants split on "/", references removed, the name itself and duplicates left out.
- Two words: the app first looks for the whole phrase as one page, read as above ("perspektywa powietrzna" has one). Without it, it looks up both words and, when one is a noun and the other an adjective, combines them case by case and number by number: the noun's forms from its template, the adjective's from the generated table (`action=expandtemplates` of `odmiana-przymiotnik-polski` on the adjective's page) in the column of the noun's gender, keeping the word order of the name ("sklepienie krzyżowe" gives "sklepienia krzyżowego", "sklepieniu krzyżowemu", …). Anything else gives no forms.
- Nothing found: "Nie udało się odszukać tego hasła w słowniku. Możesz dopisać jego formy samodzielnie."; a failed request: "Nie udało się połączyć z Wikisłownikiem. Spróbuj jeszcze raz albo dopisz formy samodzielnie." with the text button "Szukaj jeszcze raz". The learner can type forms by hand in every case.
- An old term with empty forms has "Pobierz z Wikisłownika" in the frame; it does not fetch by itself when its form opens. After the name of a term changes, the frame offers "Pobierz ponownie", which replaces the forms.
- Requests go from the browser with `origin=*` and the app's `Api-User-Agent`, and retry after a 429 like the image search.

### Data

- `glossary_entries` gets two columns: `synonyms` (a list of text, empty by default) and `sort_name` (optional text). The existing `forms` column keeps the inflected forms; the migration leaves every saved form there, so synonyms start empty and the learner moves them by hand.
- Marking in notes, in definitions and on flashcards, and "Pojawia się w notatkach", match the name, the synonyms and the forms together.

### Consequences

- Good: a term is found in notes in all its cases without the learner typing them, and still without stem matching.
- Good: the popover, the entry page and the review become one web: from a note to the term, from a term to the terms in its definition.
- Good: the form stays short; inflection is out of sight until needed.
- Bad: many art terms of two words are missing in Wiktionary or have an adjective without a page ("ołtarz szafowy"), and people and foreign terms (sfumato) are not there at all; those keep forms typed by hand.
- Bad: reading adjectives depends on the HTML of a generated Wiktionary table, which can change.
- Bad: after the migration, synonyms typed before show only as inflected forms until the learner moves them, so their "też" line disappears.

## More information

- Issues: ATL-196 (this design), ATL-199 (name, list and count), ATL-200 (sort name, synonyms and the migration), ATL-197 (link in the popover, marking in definitions and on flashcards), ATL-198 (forms from Wiktionary).
- The Wiktionary check, with sample pages and the extraction rules, is in the project files under `atl-196/` (`wiktionary-test.md`); the mockups are there too.
- Wiktionary text is CC BY-SA; the forms of a word are facts of the language, so the app shows no source line for them.
