# 0200. Store an exhibition as one document with rows of its artworks

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

An exhibition ([ADR-0199](0199-tell-stories-in-exhibitions-of-the-learners-artworks.md)) is a document of blocks in rows, edited in TipTap. The app reads it whole to show it, and reads it in reverse for "Na wystawach" on the artwork page and for the cover on the list. An artwork in it can go to Archiwum, come back or be deleted for good. The export must carry it, and the import must restore it. The palette of an artwork image, new in 0.21 ([ATL-454](https://linear.app/kamil-nawrot/issue/ATL-454)), is shown in exhibitions and in the artwork view.

How are exhibitions stored, and where does the palette live? The model follows [ADR-0165](0165-model-the-database-from-the-app-access-patterns.md). The patterns are R22 to R25 and W18 to W22 in [access-patterns.yaml](../data-model/access-patterns.yaml), and the change is M5 in [coverage.yaml](../data-model/coverage.yaml).

## Decision drivers

- A relation the app reads in reverse is stored as rows when its source can be read exactly, like the note links (M1).
- References survive renames, Archiwum, export and import.
- The palette of an image looks the same on every visit.
- Limits keep one account from filling the database (R-158).

## Considered options

For the document: TipTap JSON in one `jsonb` column; Markdown with custom syntax; one row per block.

For "Na wystawach": rows of the artworks of each exhibition, written by the save; a search of every document.

For the palette: computed in the browser on every show; computed once and stored with the image.

## Decision outcome

Chosen: the JSON document with rows of its artworks, and the palette stored with the image.

- `exhibitions` holds the title, the document (`jsonb`, format 1), `format` for later changes of the JSON, `revision`, `deleted_at` for Archiwum and the dates. Markdown cannot express rows and block options cleanly. One row per block makes every move rewrite many rows, while the editor still works on JSON.
- The document refers to artworks and images by id: `artworkId` and `imageId` on artwork and close-up blocks. Import keeps the ids, so the references survive an export. A missing `imageId` means the first image. A deleted image falls back to the first image.
- `exhibition_artworks` holds one row per distinct artwork the document shows, with its position of first appearance (0 is the cover). `save_exhibition(id, title, document, revision)` checks the document against the block whitelist and the limits, refuses an artwork of another owner (an artwork in Archiwum is allowed), stores it and replaces the rows in the same transaction. A purge of an artwork cascades its rows, while the document keeps the id and shows the `NoImage` frame. An id that no longer exists gets no row and does not refuse the save, so an exhibition with a purged artwork still saves.
- A save with an older `revision` is refused, so a second tab never silently overwrites the first. The learner is told to reload.
- The exhibition texts mark Słowniczek terms in the browser from the cached term index. Nothing is stored for them.
- A close-up is cut by CSS from the image of the loupe, loaded lazily, and is not stored as a file. It uses the geometry of the pins (`x`, `y`, `viewWidth`).
- The palette is stored per image in `artwork_images.palette` (`jsonb`, up to six colours with their share). It is computed in the browser by k-means on a small canvas when the image is saved in the form. An older image gets it the first time it is shown, and it is then saved. A palette computed on every show could differ between visits, because k-means starts at random. A stored one is stable, goes into the export and could later allow a search by colour. An image whose host forbids reading its pixels has no palette.
- Limits: 200 exhibitions per account, Archiwum counted; 300 blocks, 100 distinct artworks and 512 KB of JSON per exhibition. The owner found them generous and agreed.
- The export adds `exhibitions`. The import inserts them and rebuilds `exhibition_artworks` from the documents at its end. An older export imports with no exhibitions.

### Consequences

- Good: "Na wystawach" and the list cover are indexed reads. The exhibition view is one exhibition and the few artworks it shows.
- Good: an exhibition survives renames, Archiwum, restores and export unchanged.
- Bad: an export holds JSON that is harder to read than the Markdown of a note.
- Bad: the whole document is sent on every autosave, which is fine below 512 KB.
- Bad: the format of the document lives in two places, the editor and the whitelist of `save_exhibition`. A new block kind needs both, and `format` exists for changes of the JSON.

## More information

Design issue [ATL-130](https://linear.app/kamil-nawrot/issue/ATL-130). The schema is in [target.dbml](../data-model/target.dbml), and the entities are in [conceptual.md](../data-model/conceptual.md). The palette column is built in ATL-454, and the tables in ATL-542.
