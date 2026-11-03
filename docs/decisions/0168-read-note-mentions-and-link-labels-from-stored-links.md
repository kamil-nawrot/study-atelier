# 0168. Read note mentions and link labels from stored links

- Status: accepted
- Date: 2026-11-02

## Context and problem statement

"Wspomniane w" on an artwork or value page called `notes_mentions(needle)` ([ADR-0082](0082-find-note-mentions-with-one-database-function.md)), which scans the notes of eight tables with `like` on every opening and sends back whole notes for the browser to test again. A page whose notes contain a link loaded the card index and the whole collection only to name its links ([ADR-0053](0053-link-values-and-artworks-from-notes.md)). The data model review (ATL-403, [ADR-0165](0165-model-the-database-from-the-app-access-patterns.md)) planned M1: keep each link as a row in `note_links`, filled by triggers (ATL-419, first pull request). How should the pages read it?

## Decision drivers

- A page asks for its own mentions and its own link labels, not for every note or every artwork ([ADR-0167](0167-load-the-whole-collection-only-in-views-that-show-it.md)).
- One request each, under Row Level Security, with the trash filtered in the database.
- The editor still needs every artwork and value to suggest links, so only the views change.
- A deployed bundle of the previous release may still call `notes_mentions` while the new one loads ([ADR-0139](0139-ask-the-learner-to-reload-after-a-new-release.md)).

## Considered options

- Two `security invoker` functions over `note_links`, keyed by the page's subject.
- PostgREST selects on `note_links` with embedded targets and sources.
- Keep `notes_mentions` and the whole collection for the labels.

## Decision outcome

Chosen option: "Two functions", by the owner together with the M1 plan (2026-11-02).

- `note_link_mentions(artwork_number, value_id, era_code)` gives the notes that link one subject: `kind`, `id`, `record_number` and `title` of each source (the artworks outside the trash, the values with their names, the eras, the visits with the place and date), in the order of `notes_mentions`. The app drops the page itself and names an era from its texts.
- `note_link_labels(artwork_number, value_id, era_code, visit_id)` gives the targets of the note of one subject, with the same columns; an artwork in the trash has no label, as before. A view builds its `NoteLinks` from them (`suggest` gives nothing), and only when its note contains a link.
- Artworks are addressed by record number, so the artwork page asks in parallel with the artwork itself.
- `notes_mentions` stays in the database for this release and is dropped in a later one, when no deployed bundle calls it.

### Consequences

- Good: an artwork, value or visit page with links no longer reads the card index and the whole collection; mentions come as a few small rows instead of every matching note.
- Good: a link to a record number is resolved once, when the note is saved, and the trash is filtered in one place.
- Bad: a link written before its target existed counts only after its note is saved again (see M1 in `docs/data-model/coverage.yaml`).
- Bad: a new notes table needs a trigger as well as a branch in both functions.

## More information

- Embedded selects were not chosen because the five source and target kinds would need five embeddings each, with the trash filter and the visit title rebuilt in the app.
