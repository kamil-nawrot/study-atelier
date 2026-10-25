# 0131. Call the trash "Archiwum" and describe work in progress impersonally

- Status: accepted
- Date: 2026-10-25

## Context and problem statement

In the review of every UI text before 0.12 (ATL-341) the owner rewrote the dictionary. Two changes go beyond wording and contradict earlier decisions: the module for deleted artworks, "Kosz" since [ADR-0028](0028-trash-as-a-list-with-confirmed-deletes.md), is now "Archiwum", and the messages shown while the app searches or works no longer speak in the first person ("Szukam w Wikidata…", "Nie znalazłem…"), as [ADR-0089](0089-one-search-button-and-the-word-obraz-in-the-image-field.md) asked, but name the activity ("Wyszukiwanie w Wikidata…", "Nie udało się odnaleźć…"). The artwork type "Rzemiosło artystyczne" from [ADR-0066](0066-icons-for-artwork-types-shown-like-eras.md) became "Sztuka użytkowa".

What do the module and these messages say?

## Decision drivers

- An artwork moved out of the atelier is kept, not thrown away, until the learner deletes it for good.
- The app is not a person; a status line says what is happening.
- One voice across every status message of the app.

## Considered options

1. Keep "Kosz" and the first person
2. "Archiwum" and impersonal status messages

## Decision outcome

Chosen option: 2, chosen by the owner while editing the texts.

- The module, its menu item, its page and every message about it say "Archiwum" ("Przenieść #0012 do Archiwum?", "Archiwum jest puste"); the code and the docs keep the English concept "trash" (`/atelier/trash`, the `trash` messages).
- A status line while the app works names the activity with a verbal noun ("Wyszukiwanie…", "Zapisywanie…", "Pakowanie pliku…"), and a failure says "Nie udało się…" instead of "Nie znalazłem…" or "Nie mogę…".
- The artwork type `applied_arts` is shown as "Sztuka użytkowa".

### Consequences

- Good: the name says that the artworks are kept and can come back.
- Good: the status messages read the same everywhere.
- Bad: "Archiwum" may suggest a place for finished, not deleted, artworks; "Usuń na zawsze" in it still deletes for good.

## More information

- Partly supersedes ADR-0028 (the name "Kosz"), ADR-0089 (messages about a search in the first person) and ADR-0066 (the label "Rzemiosło artystyczne").
- Issue ATL-341, milestone 0.12.
