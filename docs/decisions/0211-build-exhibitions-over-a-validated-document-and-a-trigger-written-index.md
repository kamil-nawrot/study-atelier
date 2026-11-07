# 0211. Build exhibitions over a validated document and a trigger-written index

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

[ADR-0200](0200-store-an-exhibition-as-one-document-with-rows-of-its-artworks.md) fixes how an exhibition is stored: one TipTap document in `exhibitions.document` and one row per distinct artwork in `exhibition_artworks`, both replaced by `save_exhibition`. Building it ([ATL-542](https://linear.app/kamil-nawrot/issue/ATL-542)) needs a few choices that the ADR leaves open or that the database does not allow as written: who writes the rows, what counts as an artwork "of another owner", how the list is read and how the page shows the document without an editor.

## Decision drivers

- A client must not be able to write an exhibition that the app cannot show, or rows that disagree with the document.
- Row Level Security hides the artworks of other owners, so the function cannot tell a foreign artwork from a purged one.
- The list, the page and "Na wystawach" must stay narrow reads ([ADR-0165](0165-model-the-database-from-the-app-access-patterns.md)).
- Reading an exhibition must not load an editor.

## Considered options

For the rows: written by `save_exhibition`, or written by a trigger on `exhibitions.document`.

For an artwork of another owner: refused with an error, or left without a row like a purged artwork.

For the list: one RPC `exhibition_list`, or the table with its rows embedded.

For the page: the editor in read-only mode, or the document rendered by the existing note components.

## Decision outcome

- A `before` trigger validates the document against a whitelist of nodes, children and attributes (`private.exhibition_children`, `private.exhibition_attributes`) and the limits of 300 blocks and 100 artworks. An `after` trigger, a `security definer` function in the `private` schema, rebuilds the rows. `save_exhibition` (`security invoker`) only checks the revision and writes the title, the document and the revision. The client has no `insert` or `update` grant on the rows, and no write path to the table skips the checks.
- An artwork the owner cannot see gets no row, whether it was purged or belongs to someone else, and the save succeeds. The error that ADR-0200 describes for another owner's artwork cannot be told from a purge under Row Level Security, and the document shows the `NoImage` frame in both cases.
- A title may be empty. The list and the page call it "Wystawa bez tytułu". "Dodaj wystawę" saves an empty exhibition under a new id at once, so the page always opens an exhibition that exists.
- The list reads `exhibitions` with `exhibition_artworks(artwork_id, position)` embedded, then the covers by id. It stays at two requests; the `exhibition_list` RPC of the target model waits until the list is slow.
- Viewing renders the JSON with `GlossaryNotes`, so Słowniczek terms are marked as in a note. TipTap loads only in edit mode.
- The panel searches with `note_link_suggestions('#', phrase)`, capped at 20 artworks, and lists the 12 artworks added last. It never loads the whole collection.
- Editing on a phone, with the panel as a sheet from the bottom ([R-210](../product/requirements.md)), is a separate step after the desktop editor.

### Consequences

- Good: no client can store a document that the page cannot show or rows that disagree with it, and the tests of the database cover the whitelist and the limits.
- Good: the page loads in few requests and no editor code for a reader.
- Bad: the whitelist lives in SQL and in the editor schema and changes in both. ATL-543 extends it for rows and close-ups.
- Bad: a save of a document that names an artwork of someone else succeeds silently.

## More information

[ATL-542](https://linear.app/kamil-nawrot/issue/ATL-542), [ATL-543](https://linear.app/kamil-nawrot/issue/ATL-543).
