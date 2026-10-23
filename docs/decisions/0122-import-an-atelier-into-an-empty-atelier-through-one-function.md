# 0122. Import an atelier into an empty atelier through one function

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

The export ([ADR-0121](0121-export-the-atelier-as-a-zip-file.md)) gives the learner a ZIP with the whole atelier. How is it read back, into which atelier, and who writes the rows, given that record numbers, dates and the review state cannot be written by the learner's own column grants?

## Decision drivers

- A restore must bring back record numbers, dates, the trash, notes with their links, pins, own fields and the review history.
- The same file must work in another account of the same database, so ids cannot be kept.
- All or nothing: a failed import must leave no half-filled atelier.

## Considered options

- Import into an empty atelier only, replace the atelier, or merge into an existing one
- Insert from the browser table by table, or in one database function

## Decision outcome

Chosen by the owner in the spike ATL-292: import only into an empty atelier, with one database function.

- The browser reads the ZIP, refuses a file that is not an export or comes from a newer format version, gives every record a new id (also inside the notes' links to values and in the category of a list field), moves the own image files to `<new owner>/<new uuid>.<ext>` and uploads them with their thumbnails.
- `public.import_atelier(payload jsonb)` is `security definer` with an empty `search_path`. It requires a signed-in learner and an empty atelier (no artworks, values, glossary entries, events or own fields, the trash included), and inserts the tables in a fixed order in one transaction, with the owner always taken from `auth.uid()`. The columns of each table come from the catalogue, so a column added later needs no change of the function; identity columns are left to the database.
- The trigger that numbers artworks keeps a given record number and moves the counter to the highest number; the learner cannot give one, because the column grants do not allow it.
- The profile and the preferences are not imported; the learner's profile belongs to the account.
- If the function fails, the files uploaded before are removed by the browser, and otherwise by the clean-up of unused images after 24 hours.

### Consequences

- Good: a restore keeps numbers, dates, links and the review history, and works across accounts.
- Good: all or nothing, and the function needs no change when a column is added to a table.
- Bad: a table added later must be added to the list in the function and in the export.
- Bad: the whole file is held in memory while it is read.

## More information

- Issues ATL-292 (spike), ATL-294 (import). Merge and replace stay ideas for later.
