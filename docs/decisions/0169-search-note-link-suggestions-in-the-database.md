# 0169. Search note link suggestions in the database

- Status: accepted
- Date: 2026-11-03

## Context and problem statement

The notes editor suggests values after `@` and artworks after `#` ([ADR-0053](0053-link-values-and-artworks-from-notes.md)). To do that every form with a notes field (an artwork, a value, a visit) loaded the card index and the whole collection before the learner typed anything, and matched both in the browser. [ADR-0168](0168-read-note-mentions-and-link-labels-from-stored-links.md) took that load out of the views; the editor kept it. The data model plan of ATL-403 lists this as Z3. How does the editor find its suggestions?

## Decision drivers

- A form does not wait for, nor download, every artwork and value to offer a few rows ([ADR-0167](0167-load-the-whole-collection-only-in-views-that-show-it.md)).
- The list keeps the behaviour of ADR-0053: two characters before it opens, at most eight rows, the same rows and order, case and diacritics ignored.
- Typing stays smooth: no request per keystroke, no list flickering while the next rows load.
- Eras are app texts, not rows, so their names are only known in the browser.

## Considered options

- One `security invoker` function `note_link_suggestions(link_trigger, phrase)` called after a short pause in typing.
- PostgREST selects on `category_values` and `artworks` with `ilike` filters.
- Keep loading everything once per form, cached between forms.

## Decision outcome

Chosen option: "One function", by the owner with the ATL-403 plan (Z3, 2026-11-02).

- `note_link_suggestions(link_trigger, phrase)` returns at most eight rows of `kind`, `id`, `record_number`, `title`, `authors` and `parents`. For `#` it searches the artworks outside the trash by the start of the record number or by title and authors; for `@` the periods, styles, materials, authors and locations by name, a period with its era codes and a style with its periods as parents. Both compare `search_key` of the text, so case and diacritics do not matter, and rank rows that start with the phrase first.
- The browser adds the eras matching the phrase to the `@` rows, sorts them together and keeps eight.
- The editor asks after a pause of 150 ms in typing and drops an answer that a later keystroke has overtaken; while the next rows load it keeps the previous list.
- The labels of the links already in the note come from `note_link_labels`, as in the views, and a picked suggestion keeps its label for the rest of the editing.

### Consequences

- Good: an artwork, value or visit form no longer loads the collection, the card index and the value details for the editor; on the sample data an artwork edit form went from 20 requests and 38 kB to 16 requests and 9 kB, and the collection part grows with the atelier.
- Good: one small request per pause in typing, under Row Level Security.
- Bad: suggestions need the network; offline the list says nothing matches.
- Bad: the `#` search reads every artwork of the account with its authors per request; acceptable at the row limits of [ADR-0133](0133-limit-the-storage-and-the-rows-of-one-account.md), to be indexed if a measurement shows it.
- Bad: a link in a saved note to a target created after the note was saved shows as missing in the editor until the note is saved again, since its label comes from `note_links`.

## More information

- Amends ADR-0053 (where the suggestions come from) and completes ADR-0168 for the editor. Build issue ATL-420.
