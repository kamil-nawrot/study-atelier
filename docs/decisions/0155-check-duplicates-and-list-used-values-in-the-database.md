# 0155. Check duplicates and list used values in the database

- Status: accepted
- Date: 2026-10-28

## Context and problem statement

The duplicate check before saving an artwork ([ADR-0039](0039-confirm-saving-a-duplicate-artwork.md)) and the value suggestions of the artwork form read the titles, authors and values of every artwork outside the trash in one request. Above 1000 artworks Supabase's row limit cut them silently ([ADR-0041](0041-load-the-whole-collection-in-pages-of-1000.md)), and every save and every opening of the form cost more as the collection grew. How do they stay correct and cheap for a large collection?

## Decision drivers

- A save and a form cost the same however many artworks the learner has.
- The duplicate rules stay as they are: the same title key and the same set of author keys.

## Considered options

- Read every artwork in pages of 1000, as the wall does
- Ask the database for the few candidates and the values in use

## Decision outcome

Chosen: the database answers, as planned in ATL-111 and taken into the release 0.14 by the owner.

- `search_key(text)` normalises a text the way `valueKey` does in the app: lower case, no diacritics, "ł" as "l", single spaces, trimmed. An index on `artworks (owner_id, search_key(title))` outside the trash keeps the lookup fast.
- `duplicate_candidates(title)` returns the learner's artworks outside the trash with the same title key, with their authors; `duplicateNumbers` still compares the authors in the app.
- `used_category_values()` returns the category values (built-in and own lists) used by an artwork outside the trash or, for places, by a visit; the app reads it in pages of 1000.

### Consequences

- Good: no request reads the whole collection for a save or for the form, and nothing is cut above 1000 artworks.
- Bad: the title key exists twice, in SQL and in TypeScript; a change to one must change the other.

## More information

- Issue ATL-111. The paged stop-gap (branch `bugfix/atl-111-paged-queries`) was dropped earlier for this fix.
