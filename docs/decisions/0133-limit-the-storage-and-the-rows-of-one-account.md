# 0133. Limit the storage and the rows of one account

- Status: accepted
- Date: 2026-10-26

## Context and problem statement

One file is capped at 5 MB, but an account could upload any number of files and insert any number of rows, so one learner or a script could fill the storage or the database of the project for everyone. The Supabase Free plan gives 1 GB of file storage and 500 MB of database to the whole project. How much may one account use, and where is the limit enforced?

## Decision drivers

- An honest learner never meets a limit; the owner's own atelier (174 artworks, 8.7 MB of files on 2026-10-26) leaves a wide margin.
- One account cannot take a large part of the 1 GB of the project.
- The limits hold whatever client calls the API, so they live in the database.
- The import of an atelier ([ADR-0122](0122-import-an-atelier-into-an-empty-atelier-through-one-function.md)) respects the same limits.

## Considered options

- Storage quota of 100 MB, 200 MB or 500 MB per account
- Row limits checked per row or once per statement

## Decision outcome

Chosen by the owner: 200 MB of files per account and these row limits.

| Rows                        | Limit                     |
| --------------------------- | ------------------------- |
| Artworks, the trash counted | 5000                      |
| Category values             | 5000                      |
| Glossary entries            | 2000                      |
| Timeline events             | 2000                      |
| Visits                      | 1000                      |
| Own artwork fields          | 100                       |
| Review answers              | 1000 in the last 24 hours |
| Feedback entries            | 20 in the last 24 hours   |

Images and pins are not limited on their own: they are already capped per artwork and per image.

- `public.storage_usage()` gives the bytes the learner's files take and the quota. The insert and update policies of `storage.objects` refuse a file when the used bytes plus the size the request declares would pass the quota. Storage gives the policy only the declared size, so a request that declares none is checked against the used bytes alone and can pass the quota by one file at most.
- `private.limit_rows` runs once per insert statement and counts the rows of each owner in the statement, so an import of thousands of rows counts once per table. A refused insert fails with SQLSTATE `53400` and the table name in the hint, which the app maps to a message.
- The windows of review answers and feedback are the last 24 hours, not the calendar day, so they do not depend on a time zone.

### Consequences

- Good: one account takes at most a fifth of the project's file storage, and a script cannot add rows without end.
- Good: the limits hold for the app, the REST API and the import alike.
- Bad: the quota does not protect the total of all accounts; that is watched with the usage limits of the project and solved with a paid plan.
- Bad: the limits are written in the database and repeated in the app for its messages, so a change touches both.

## More information

- Issue ATL-329. The numbers come from a read-only query of production on 2026-10-26.
