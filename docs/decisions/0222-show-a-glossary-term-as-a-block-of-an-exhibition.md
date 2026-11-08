# 0222. Show a glossary term as a block of an exhibition

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The texts of an exhibition already mark Słowniczek terms as notes do ([ADR-0218](0218-place-blocks-and-show-notes-from-the-block-toolbox.md)). The owner asked how a definition from Słowniczek could stand in an exhibition as a block of its own, for example "Sfumato" beside a portrait by Leonardo ([ATL-573](https://linear.app/kamil-nawrot/issue/ATL-573)). He left the design to the thread and asked for it to be built and shipped if it made sense.

## Decision drivers

- The editor stays hard to break, with few options ([ADR-0217](0217-show-block-tools-on-hover-over-a-quiet-edit-mode.md)).
- Every block works the same way and differs only in its toolbox.
- Słowniczek stays the one place where a definition is written.
- What a card shows may load as one row read by id ([ADR-0165](0165-model-the-database-from-the-app-access-patterns.md)).

## Considered options

- Copy the definition into the document when the block is added.
- Keep a reference to the term and show its current definition.

## Decision outcome

Chosen: a reference, because a definition corrected in Słowniczek then shows everywhere, and the document stays small.

- **Storage:** a new node `term` with the attribute `termId` (the id of a glossary entry) and the position attributes `align` and `valign`. It holds nothing. It may stand in the document or in a column, not in a set. The database rejects any other shape, and the block counts against the limit of 300.
- **Look:** a framed card with a hairline border, at most 720 px wide, made from the term card of the notes: the category with its icon, the name in the title typeface, the definition and, when it comes from Wikipedia, the line "Na podstawie Wikipedii, CC BY-SA 4.0". Viewing adds "Otwórz w Słowniczku". The definition loads by id when the block is shown; the name and the category come from the index of terms the exhibition page already loads.
- **Missing term:** a term deleted from Słowniczek shows "Tego hasła nie ma już w Słowniczku." and is removed like any block.
- **Adding:** a section "Słowniczek" at the end of the panel "Dodaj do wystawy": "Szukaj hasła" by name or synonym, ignoring case and Polish letters, and up to six terms, from A to Z or with names that start with the phrase first. A click adds the term at the end, a drag puts it where it is dropped. "Otwórz Słowniczek…" opens the glossary in a new tab.
- **Toolbox:** only what every block has: "Położenie", "W górę", "W dół" and "Usuń z wystawy". The block is named "Hasło".

### Consequences

- Good: an exhibition can explain a technique or a style right beside the artwork that shows it, without copying text.
- Good: the import and export of the atelier keep the ids of glossary entries, so the references survive a round trip.
- Bad: one point fetch per term block when the exhibition is shown.
- Bad: one migration more, because the database lists the nodes a document may hold.

## More information

Issue [ATL-573](https://linear.app/kamil-nawrot/issue/ATL-573), migration `20261107170000_exhibition_terms.sql`. Adds R-232 and R-233 and updates R-207.
