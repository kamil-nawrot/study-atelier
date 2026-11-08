# 0227. Turn an artwork over to its note

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

An artwork block can show the artwork's note under its image, switched on with "Notatka" in its toolbox ([ADR-0218](0218-place-blocks-and-show-notes-from-the-block-toolbox.md)). The owner wants every artwork with a note to turn over to it instead, in the same frame, without changing the layout of the exhibition ([ATL-578](https://linear.app/kamil-nawrot/issue/ATL-578)). How does the view know which artworks have notes without loading every note?

## Decision drivers

- The layout of an exhibition never moves when the visitor reads a note.
- Few requests: a note is read only when someone wants it ([ADR-0165](0165-model-the-database-from-the-app-access-patterns.md)).

## Considered options

- A flip button on every artwork, loading the note on the first turn and saying when there is none.
- One query of the ids of the exhibition's artworks whose notes are not empty, then a flip button only on those, loading the note on the first turn.

## Decision outcome

Chosen: the query of ids, because a button that turns over to "no note" is a dead end, and the query returns only ids.

- **Data:** `loadArtworksWithNotes(ids)` selects `id` of the artworks among `ids` that are not in the trash and whose `notes` are neither null nor empty. It runs once when an exhibition is viewed. The note itself is read by id on the first turn, with the labels of its links when it has any, as before.
- **Look:** a 32 px button with the sticky-note icon in the top right corner of the frame, muted until hovered, pressed while the note shows. The back takes the exact box of the frame (image hidden, not removed), on the surface colour, and scrolls inside.
- **Where:** viewing only. Edit mode shows the image.
- **Removed:** the note under the image and "Notatka" in the toolbox. The stored attribute `note` stays allowed by the database and is ignored, so no migration is needed.

### Consequences

- Good: notes are at hand on every artwork that has one, and the page keeps its shape.
- Bad: one extra request when an exhibition opens.

## More information

Issue [ATL-578](https://linear.app/kamil-nawrot/issue/ATL-578). Adds R-236 and updates R-201 and R-208; partly supersedes ADR-0218.
