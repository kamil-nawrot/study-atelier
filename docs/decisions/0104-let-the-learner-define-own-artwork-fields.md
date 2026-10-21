# 0104. Let the learner define their own artwork fields

- Status: accepted
- Date: 2026-10-21

## Context and problem statement

The fields of an artwork are fixed in code ([ADR-0014](0014-artwork-collection-data-model.md)). For the single learner of today a new field is one migration, but the owner designs the app for many learners in the long run. Beyond the basic fields, what each of them wants to record cannot be foreseen. Many of these fields are about how they study ("Na egzamin", "Wykład", "Widziane na żywo", "Źródło") or a special interest ("Fundator", "Inskrypcja"). Adding every possible field for everyone would bloat the form for those who do not use them. How can a learner add their own fields, and how are they stored without rebuilding the data model?

The spike ATL-259 started with an adversarial discussion of whether the idea is worth it and then settled the details with the owner.

## Decision drivers

- An own field gives more than a line in the notes: suggested values, filtering later, a rename in one place for every artwork, validated input.
- The form stays short for a learner without own fields.
- The data model is extended, not rebuilt. The owner accepts limits that keep it so.
- Correctness and ownership are enforced in the database ([ADR-0014](0014-artwork-collection-data-model.md)), and an artwork is still saved in one call ([ADR-0024](0024-save-an-artwork-in-one-database-function.md)).

## Considered options

Instead of own fields:

1. Own fields defined by each learner
2. Optional built-in fields that each learner switches on (for example technique, motifs, dimensions)
3. Notes only

Where the values of a list field are kept:

1. In the existing `categories`, `category_values` and `artwork_values`, with one learner-owned category per list field
2. In separate tables for own fields

Where text and "Tak / nie" values are kept:

1. A table `artwork_field_entries` with one row per artwork and field
2. A `jsonb` column on `artworks`

## Decision outcome

Chosen: own fields defined by each learner, list values in the existing category tables, and text and "Tak / nie" values in the table `artwork_field_entries`.

- Optional built-in fields cover only fields that can be foreseen. They are kept as an idea for later (ATL-260), not as a replacement.
- The category tables already work for any category code: `save_artwork` takes the values keyed by the category code, and the merge, the one-value check, the unique names and the suggestions do not depend on the category. Separate tables would repeat all of that.
- A table keeps the database's checks (kind, length, ownership) and deletes the entries of a deleted field by a foreign key. A `jsonb` column checks nothing and leaves keys behind when a field is deleted.

### Fields

- Own fields belong to artworks only. Authors and other values get none.
- A field has a name of at most 60 characters, an optional description of at most 150 characters, a kind and a place in the order. Every field is optional on an artwork.
- Kinds, fixed when the field is created:
  - "Tekst": one line of at most 200 characters.
  - "Lista": values with suggestions, created while filling in an artwork as authors and styles are (R-9, R-25). One or several values per artwork, chosen when the field is created and fixed afterwards.
  - "Tak / nie": one checkbox. Unticked counts as empty; there is no third state, and a learner who needs one makes a list.
- The name is required and unique among the learner's own fields and the labels of the built-in fields of the form (Obraz, Tytuł, Autorzy, Rok powstania, Typ, Epoka, Okres, Styl, Materiał, Miejsce, Notatki), ignoring letter case only. There are no singular or plural variants.
- Deleting a field deletes its values on every artwork, after a confirmation.

### Managing fields in Kartoteka

- Kartoteka gets a fifth tab, "Własne pola". It is the only place where fields are created, renamed, reordered and deleted; the artwork form has no link to it.
- Empty tab: "Nie masz jeszcze żadnych własnych pól. Dodaj pole, aby zobaczyć je przy wszystkich swoich dziełach." with the button "Dodaj pole".
- Dialog "Nowe pole":
  - "Nazwa", required. A clash is an error: "Dzieło ma już wbudowane pole „Autorzy”. Wybierz inną nazwę." or "Masz już pole „Wykład”.".
  - "Opis (opcjonalnie)" with the hint "Co wpisywać w tym polu. Zobaczysz to w formularzu dzieła.".
  - "Rodzaj" as tiles: "Tekst" (jedna linia, dowolna treść), "Lista" (wartości z podpowiedziami), "Tak / nie" (jedno pole do zaznaczenia), with the note "Rodzaju nie zmienisz po utworzeniu pola.".
  - For a list only, the checkbox "Dzieło może mieć kilka wartości".
  - "Anuluj" and "Dodaj".
- The tab shows a section per field in the form's order: its name, its description, its kind in small text ("Lista · kilka wartości", "Tak / nie · 5 dzieł") and a "…" menu with "Zmień nazwę", "Przesuń wyżej", "Przesuń niżej" and "Usuń". A list field lists its values with their number of artworks, artworks in the trash included, as the tab "Materiały" does.
- Delete: "Usunąć pole „Wykład”?" with "Pole zniknie z formularza i z 12 dzieł, które mają je uzupełnione. Usunięcia nie będzie można cofnąć." and the button "Usuń pole".
- A list value opens a small dialog with "Nazwa" only. A new name that matches another value of the field merges the two after a confirmation, as in [ADR-0040](0040-manage-category-values-in-a-card-index.md). A list value has no value page and cannot be deleted; a value no artwork uses drops out of the suggestions ([ADR-0014](0014-artwork-collection-data-model.md)).
- The texts may change once the owner sees them in the app.

### Own fields in the artwork form and view

- The form shows the own fields after "Miejsce" and before "Notatki", in the order of Kartoteka, without a heading. A field's description is the hint under it.
- The artwork view shows them in the information panel at the same place and in the same order. Empty fields are hidden, list values are separated by commas without links, and a ticked "Tak / nie" field reads "Widziane na żywo · Tak".
- Filtering the wall by own fields is a separate issue (ATL-261). Search, reviews, Kalendarium and duplicate detection do not use own fields.

### Data

- `artwork_fields`: `id`, `owner_id`, `name`, `description`, `kind` (`text`, `list` or `flag`), `multiple` (only for a list), `position`, timestamps. Names are unique per learner ignoring letter case; the clash with built-in labels is checked in the app, which holds the labels in its i18n texts.
- A list field has its own row in `categories`, whose code is the field's id. `categories` gets an optional `owner_id` (empty for the built-in categories) and a link to the field that is deleted with it; the read policy shows the built-in categories and the learner's own; the global uniqueness of `position` goes, because the order of own fields is kept in `artwork_fields`. Values of a list field are rows of `category_values` and `artwork_values` as for any category, and the database refuses a value in another learner's category.
- `artwork_field_entries`: `artwork_id`, `field_id`, `owner_id`, the field's kind and `text_value`. A "Tak / nie" field has a row without text only when ticked, a text field a row with its text. Foreign keys to the artwork and to the field (with `owner_id` and the kind, as the details tables of [ADR-0050](0050-store-value-pages-in-details-tables.md)) delete the entries with either and refuse an entry of the wrong kind.
- `save_artwork` gets the list values in its existing `values_by_category`, keyed by the field's id, and the text and "Tak / nie" entries in a new argument, so an artwork is still saved in one transaction. It now replaces only the categories named in `values_by_category`, and leaves the entries alone when the new argument is not given, so a caller that does not know the own fields does not erase them.
- The app no longer assumes that every category is one of five codes: values of other categories are the artwork's own fields.

### Consequences

- Good: a learner records what matters to their study without anything new for other learners.
- Good: list fields get suggestions, near-duplicate hints, the one-value check and merging from the code that already does this for authors and styles.
- Good: the database keeps checking ownership, kinds and lengths, and removes the data of a deleted field itself.
- Bad: `categories` stops being a fixed list of five rows, and every query that reads it must allow for own categories.
- Bad: a learner's field may duplicate a built-in one under another name ("Nurt" next to "Styl", "Technika" next to "Materiał"); that is the cost of the freedom.
- Bad: a new built-in field may later clash with a learner's field of the same name (ATL-260).
- Bad: a "Tak / nie" field cannot tell "no" from "not filled in".

## More information

- Spike ATL-259 with the discussion; related ideas ATL-21 (which this record covers) and ATL-260; filters ATL-261.
- The product vision now names many learners as the long-term direction.
