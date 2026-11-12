# 0259. Relate artworks and authors with typed relations

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

A textbook draws arrows between artworks: a sketch and the painting it prepares, a Roman copy and its Greek original, a wing and its altarpiece, a painting and the one it answers. It draws them between artists too: a pupil and a teacher, an influence. The atelier keeps such links only as untyped links in notes, which say that two records are connected but not how, and show on one side only as "Wspominasz o tym w notatkach". On 2026-11-12 the production atelier of the owner had 25 artworks linking to other artworks in their notes (28 links) and no author linking to another author. How should the learner record and see these arrows ([ATL-458](https://linear.app/kamil-nawrot/issue/ATL-458))?

## Decision drivers

- A relation is written once and read from both ends, each end in its own words.
- Most artworks will have no relation, so the feature costs nothing on their card and their form.
- A fixed list keeps the relations comparable; the list covers what textbooks draw and leaves the rest to one catch-all type.
- A subject or a style shared by two records is not a relation: a subject is the learner's own field and a style is already in the card index.
- The database keeps a relation consistent with its two records: deleting, trashing or merging a record handles its relations.

## Considered options

- Where the types come from: a fixed list; a fixed list and the learner's own types; only the learner's own types.
- What a relation is used for: shown on both cards; also asked in review; also a separate graph view.
- Where an artwork shows its relations: a "Powiązania" section in the Informacje panel; more rows in the field table; a strip of thumbnails under the title.
- What a relation shows: a thumbnail, title, author, year and a note; the title alone.
- Whether a relation has a note: no note; a note shown on hover.
- Where a relation is added: in the edit form; from the view; both.
- Where an author page shows its relations: in the header under the years of life; in the "Powiązania" band.
- How the form lists relations: a row per relation with its type; groups as in the view with an add row at the bottom.
- How they are stored: a table for artworks and a table for authors; one table for both.

## Decision outcome

Chosen by the owner in ATL-458, one question at a time.

**Types.** A fixed list, with no types of the learner's own. Each type has a name for each end, written from the record whose card shows it; a symmetric type has one name for both.

| Code            | Records  | One end (`from`)                          | Other end (`to`)                        |
| --------------- | -------- | ----------------------------------------- | --------------------------------------- |
| `study`         | artworks | study or design: "Studium lub projekt do" | finished work: "Ma studium lub projekt" |
| `copy`          | artworks | copy: "Kopia lub reprodukcja"             | original: "Ma kopię lub reprodukcję"    |
| `version`       | artworks | "Inna wersja" (symmetric)                 |                                         |
| `part`          | artworks | part: "Część"                             | whole: "Składa się z"                   |
| `reference`     | artworks | "Nawiązuje do"                            | "Jest punktem odniesienia dla"          |
| `related`       | artworks | "Powiązane z" (symmetric)                 |                                         |
| `pupil`         | authors  | pupil, shows the teacher: "Nauczyciel"    | teacher, shows the pupil: "Uczeń"       |
| `influence`     | authors  | influenced: "Pod wpływem"                 | influencer: "Wpływ na"                  |
| `collaboration` | authors  | "Współpraca" (symmetric)                  |                                         |
| `family`        | authors  | "Rodzina" (symmetric)                     |                                         |
| `related`       | authors  | "Powiązani z" (symmetric)                 |                                         |

A pendant (two works made as a pair) is a `part` of the pair; a building replacing an older one was left out as useful almost only for architecture. The names are the texts of the [requirements](../product/requirements.md#relations) and may change there without a new decision.

**Use.** Relations are shown on both cards and nothing else in this version. Review questions on relations ("Do jakiego dzieła powstało to studium?") are an idea for later; a graph view was rejected, because with hundreds of artworks it stops being readable and looks unlike the rest of the app.

**Artwork card.** A "Powiązania" section in the Informacje panel, under the fields and above "Widziane na żywo", shown only when the artwork has a relation and open by default. It groups the relations by the name of their type, in the order of the table, and lists each related artwork by its title alone, as a link to its card. A relation has no note: a comment on it is written in the notes of either artwork, where a link to the other one already works.

**Author page.** A block of the "Powiązania" band ([ADR-0190](0190-show-the-relations-of-a-value-on-its-page.md)), in its left column above "Najczęściej razem", with the same grouping and links to author pages. The band shows when the author has a relation even if it would show nothing else.

**Editing.** Relations are added and removed in the edit form, of the artwork and of the author, and saved with the rest of the form. The form has a "Powiązania" section above the notes: one row per relation with a select of its type (both directions, named from this record), the title of the other record and a remove button. Without a relation the form shows only a small "+ Dodaj powiązanie" link, which also stays under the rows; it adds a row with an empty type and a search of artworks (or authors). The search leaves out the record itself, the records already related and, for artworks, the trash. A relation saved from either record is the same relation, so the other record shows it at once.

**Storage.** Two tables, `artwork_relations` and `author_relations`, each with `owner_id`, `from_id`, `to_id`, `kind` and `created_at`.

- `from_id` and `to_id` are foreign keys with `owner_id` to the records of the same owner (`artworks (id, owner_id)`; `category_values (id, owner_id, category_code)` with the code fixed to `author`), deleted with them.
- `kind` is one of the codes above, checked in the table.
- A symmetric relation is stored with `from_id < to_id`; a pair of records has at most one relation (a unique index on the two ids in order) and no record relates to itself.
- An index on `to_id` serves the reverse read; the primary key serves the forward one.
- `save_artwork` and `save_value_details` take the full list of relations of the record and replace them in the same transaction as the rest of the form.
- `merge_category_values` moves the relations of the merged author to the kept one, drops those that would duplicate a relation or relate the author to itself.
- An artwork in the trash keeps its relations; the other card leaves it out until it is restored.
- The export writes both tables and the import reads them; an older export without them imports with no relations.

### Consequences

- Good: an arrow from the textbook is one row, read from both cards, in words that fit each end.
- Good: an artwork or author without relations shows nothing new, apart from one small link in the form.
- Good: the database keeps both ends valid through deletion, merging and import.
- Bad: one relation per pair: two works that are both a study and a part of each other keep the one the learner finds more telling.
- Bad: the note links stay as they are; turning them into relations is left to the learner, because a link has no type.

## More information

Design issue [ATL-458](https://linear.app/kamil-nawrot/issue/ATL-458); requirements R-250 to R-254; access patterns R31, R32, W25 and W26 of the [data model](../data-model/access-patterns.yaml). Mockups `atl-458/miejsce-a-zwiezle-both.png`, `atl-458/autor-band-both.png` and `atl-458/formularz2-*.png`, texts `atl-458/teksty.md` in the project files.
