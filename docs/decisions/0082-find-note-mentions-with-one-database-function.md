# 0082. Find note mentions with one database function

- Status: accepted
- Date: 2026-10-17

## Context and problem statement

"Wspomniane w" on an artwork or value page lists the notes that link to it, and "Pojawia się w notatkach" on a glossary entry lists the notes that contain the term. Both asked seven tables one by one: the six details tables and `artworks`, each filtered by `notes like '%…%'` (or every note, for the glossary). Opening one artwork view therefore sent seven requests that nearly always answered with an empty list, which showed in a HAR of the development app next to the hover preloading of [ADR-0081](0081-preload-page-data-on-tap.md) (ATL-203). How should the notes be searched?

## Decision drivers

- One request per page for something that is usually empty.
- No change to how notes are stored, and the exact matching in the app stays (a link to `/atelier/12` must not match `/atelier/120`, a term only as a whole word).
- The database rules of the project: `security invoker`, an empty `search_path`, no access for `anon`.

## Considered options

- One `security invoker` function over the seven tables.
- A view over the seven tables.
- Keep the seven requests.

## Decision outcome

Chosen option: "One function", by the owner after the HAR analysis in the ATL-197 session.

- `public.notes_mentions(needle text default null)` returns `kind`, `id`, `record_number`, `title` and `notes` for every note that is not empty in the six details tables and in the artworks outside the trash. With a needle it keeps the notes that contain it literally (`%`, `_` and `\` are escaped for `like`); without one it returns all of them. Row Level Security limits it to the learner's rows.
- `loadNotesMentions` calls it once through `fetchAll` (pages of 1000 rows) and keeps its own `test` on the notes and the mapping of values to card index subjects; the card index is still read only when a value matches.
- `supabase/tests/notes-mentions.sql` checks the matching, the trash and that another learner sees nothing; `security.sql` checks the grants.

### Consequences

- Good: an artwork or value page sends one request for its mentions instead of seven, and so does a glossary entry.
- Bad: a new details table with notes has to be added to the function as well as to the app.

## More information

- A view was not chosen because PostgREST would need the `like` filter on the view's column, which works, but the escaping of the needle would stay in the app and the trash condition in the view; the function keeps both in one place.
