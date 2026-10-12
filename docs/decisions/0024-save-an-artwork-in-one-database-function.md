# 0024. Save an artwork with its values in one database function

- Status: proposed
- Date: 2026-10-12

## Context and problem statement

The add and edit form ([ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md)) saves an artwork together with its category values: authors, periods, styles, materials and the location ([ADR-0014](0014-artwork-collection-data-model.md)). With plain table requests this takes several calls (the artwork, any new values, the links), which are not one transaction, so a failure in between leaves an artwork without some of its values. "An author or author unknown" (R-4) also spans two tables, so the database cannot check it. ADR-0014 lists both as known drawbacks. How does the app save an artwork so that a failure never leaves half of it?

## Decision drivers

- A failed save changes nothing: no artwork without its values, no used record number, no stray new values.
- R-4 holds whatever the client sends.
- No custom backend ([ADR-0005](0005-no-custom-backend.md)); access control stays in Row Level Security.
- Migrations stay backward compatible, because `develop` and `main` share the database ([ADR-0012](0012-database-migrations-from-github-actions.md)).

## Considered options

1. A Postgres function `save_artwork` called through Supabase RPC
2. A sequence of Supabase requests, with the app undoing the earlier ones when a later one fails

## Decision outcome

Chosen option: 1, because only a database transaction makes the save all or nothing. With option 2 a lost connection between two requests still leaves half an artwork, and the undo needs as many requests again.

- Migration: [`20261012060000_save_artwork.sql`](../../supabase/migrations/20261012060000_save_artwork.sql).
- `save_artwork(artwork jsonb, values_by_category jsonb, existing_id uuid default null)` returns the artwork's `id` and `record_number`. Without `existing_id` it inserts a new artwork; with it, it updates that artwork and replaces all its value links.
- `artwork` carries the artwork's own columns; `values_by_category` maps a category code to the value names in order, for example `{"author": ["…"], "location": ["…"]}`. A name the learner already has in that category, ignoring letter case, is reused; any other name becomes a new value. The app decides which names may be new (R-9, R-25) before it calls the function.
- The function raises `check_violation` unless the artwork has either at least one author or "author unknown", and `no_data_found` when `existing_id` is not one of the learner's artworks.
- It runs as the caller (`security invoker`), so Row Level Security and the column grants of ADR-0014 apply as for direct requests; `owner_id` and the record number still come from their defaults and the trigger. Only `authenticated` may execute it.
- The app calls it from `#lib/collection/artwork-record.ts`, which also validates the fields first and maps errors to dictionary messages.

### Consequences

- Good: a save is one request and one transaction; a failed one leaves no trace, and the record counter rolls back with it.
- Good: R-4 is checked in the database, which removes one of ADR-0014's drawbacks.
- Bad: the list of artwork columns is written in the function as well as in the grants; a new artwork field also changes the function (a `create or replace` migration).
- Bad: value links are replaced on every edit, so their rows are new each time; nothing depends on their identity.

## More information

- Values no longer linked to any artwork still stay, as in ADR-0014.
- Implementation: ATL-42.
