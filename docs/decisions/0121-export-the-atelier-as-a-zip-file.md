# 0121. Export the atelier as a ZIP file

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

The learner's atelier lives only in the database and the image bucket. The learner needs a copy they can keep and, later, load into an empty atelier (ATL-294). What does an export contain, in which format, and where is it built?

## Decision drivers

- A copy must be complete, including the trash and the review history, so a restore does not reset the learner's progress.
- Own photos cannot be carried as links: signed URLs expire and the files belong to the learner.
- No server code: everything the learner may read is reachable through the browser client and row-level security.

## Considered options

- One JSON file with image references only
- A ZIP with `atelier.json` and the own image files
- The ZIP plus a CSV for a spreadsheet

## Decision outcome

Chosen by the owner in the spike ATL-292: a ZIP with `atelier.json` and the own image files, and no CSV.

- `atelier.json` has `format` ("study-atelier"), `version` (1), `exportedAt` and `data`, which holds the rows of each table of the atelier under the table's name, without `owner_id`. The records keep their ids inside the file only so that references between them can be followed.
- The files of own images (artwork images, author portraits, the avatar) go to `images/<path in the bucket>`, with the thumbnail next to each artwork image. Images from Wikimedia Commons and from links stay references.
- The browser builds the file: it reads every table in pages ordered by key, downloads the own files one by one and streams them into the archive with `fflate` (exact version, no other dependency). The file name is `study-atelier-YYYY-MM-DD.zip`.
- Reading a table in full follows the rows the learner can see, so the export needs no new database function.

### Consequences

- Good: one self-contained, readable file; no server code and no new secrets.
- Good: the import can restore dates, record numbers and review history from the same format.
- Bad: the whole archive is held in memory while it is built, so a large atelier with many photos may fail on a phone; the text recommends a computer.
- Bad: a table added later must be added to the export list, or it is missing from the copy.

## More information

- Issues ATL-292 (spike), ATL-293 (export), ATL-294 (import).
- [ADR-0117](0117-settings-view-in-tabs-opened-from-the-avatar.md) puts the export in the settings tab "Dane".
