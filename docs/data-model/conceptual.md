# Conceptual model

Step 2 of the [data model](README.md). The entities and relations the learner works with, taken from the [access patterns](access-patterns.yaml) and drawn without regard to today's tables. Every entity belongs to one learner; the owner is left out of the diagram.

```mermaid
erDiagram
  ARTWORK ||--o{ IMAGE : "shows"
  IMAGE ||--o{ PIN : "carries"
  PIN }o--o| TERM : "explains with"
  PIN }o--o| SYMBOL : "shows"
  PIN }o--o| MEANING : "means here"
  SYMBOL ||--o{ MEANING : "has, in order"
  MEANING ||--o{ CONTEXT_LABEL : "is narrowed by"
  CONTEXT_LABEL }o--o| VALUE : "names"
  CONTEXT_LABEL }o--o| ERA : "names"
  CONTEXT_LABEL }o--o| ARTWORK : "names"
  CONTEXT_LABEL }o--o| TERM : "names a person"
  ARTWORK }o--o{ VALUE : "has"
  ARTWORK }o--o| ERA : "belongs to"
  VALUE }o--o{ ERA : "period in era"
  VALUE }o--o{ VALUE : "style in period"
  ARTWORK ||--o{ OWN_FIELD_ENTRY : "fills"
  OWN_FIELD ||--o{ OWN_FIELD_ENTRY : "defines"
  VISIT }o--|| VALUE : "at place"
  VISIT }o--o{ ARTWORK : "saw"
  NOTE }o--|| SUBJECT : "is written about"
  NOTE }o--o{ SUBJECT : "links to"
  NOTE }o--o{ TERM : "mentions"
  TERM ||--o| NOTE : "is defined by"
  ARTWORK ||--o{ REVIEW_CARD : "is reviewed as"
  REVIEW_CARD ||--o{ REVIEW_ANSWER : "logs"
  LEARNER ||--o{ EXHIBIT_TIER : "unlocks"
  EXHIBIT ||--o{ EXHIBIT_TIER : "is unlocked as"
  EXHIBIT_ROOM ||--|{ EXHIBIT : "holds"
  TIMELINE_EVENT }o--o{ SUBJECT : "is placed beside"
  EXHIBITION ||--o{ BLOCK : "is told in"
  BLOCK }o--o| ARTWORK : "shows"
  BLOCK }o--o| IMAGE : "shows which image"
  EXHIBITION }o--o{ ARTWORK : "shows (stored as rows)"
```

## Entities

| Entity         | What it is                                                                           | Kept today in                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| ARTWORK        | a record with a number, title, year range, type, era, favourite flag, trash state    | `artworks`                                                                                                        |
| IMAGE          | one of up to five images of an artwork, from Commons or uploaded                     | `artwork_images`                                                                                                  |
| PIN            | a point on an image with a text, optionally explained by a term                      | `artwork_pins`                                                                                                    |
| VALUE          | an author, period, style, material or place the learner named, with page details     | `category_values` + one `*_details` table per kind                                                                |
| ERA            | one of the fixed eras, with the learner's summary and notes                          | `eras` + `era_details`                                                                                            |
| OWN_FIELD      | a field the learner added to the artwork card                                        | `artwork_fields`, `categories` (own value lists)                                                                  |
| VISIT          | a dated visit to a place, with the artworks seen                                     | `visits`, `visit_artworks`                                                                                        |
| TERM           | a glossary entry with name, synonyms, word forms, category, definition and source    | `glossary_entries`                                                                                                |
| SYMBOL         | a recurring motif with a name unique for the learner and an ordered list of meanings | `symbols` (0.23, [ADR-0257](../decisions/0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)) |
| MEANING        | one meaning of a symbol, a short text; general when it has no context label          | `symbol_meanings`                                                                                                 |
| CONTEXT_LABEL  | narrows a meaning: a value, an era, an artwork, a glossary person or a free text     | `symbol_meaning_contexts`                                                                                         |
| NOTE           | free text written about one subject; may link to subjects and mentions terms         | a `notes` column in `artworks`, the five `*_details` tables, `era_details` and `visits`                           |
| SUBJECT        | anything a note can be about or link to: artwork, value, era, visit                  | not an entity of its own                                                                                          |
| TIMELINE_EVENT | a dated event on the timeline                                                        | `timeline_events`                                                                                                 |
| REVIEW_CARD    | the scheduling state of one artwork facet                                            | `review_cards`                                                                                                    |
| REVIEW_ANSWER  | one logged answer                                                                    | `review_log`, `free_review_days`                                                                                  |
| EXHIBIT_ROOM   | a room of the display case, shared by all learners, in a fixed order                 | `exhibit_rooms`                                                                                                   |
| EXHIBIT        | an exhibit of the catalogue, shared by all learners: room, order, tiers, hidden      | `exhibits`; the value of each is computed in `private.exhibit_values`                                             |
| EXHIBIT_TIER   | an unlocked tier of the museum career                                                | `exhibit_tiers`, `point_events`                                                                                   |
| EXHIBITION     | a learner's story: a title and one document of blocks, Archiwum state                | `exhibitions`                                                                                                     |
| BLOCK          | a text, heading, quote, artwork or close-up of an exhibition, alone or in a row      | a node of `exhibitions.document` (TipTap JSON)                                                                    |

## Relations

Each relation of [access-patterns.yaml](access-patterns.yaml) `relations`, with where it lives today and whether a view needs to read it in the reverse direction.

| Relation                       | Stored today                                               | Read in reverse by                        |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------- |
| artwork has value              | `artwork_values`                                           | value page (R07), card index counts (R08) |
| period in era, style in period | `period_eras`, `style_periods`                             | card index (R08)                          |
| visit at place, visit saw      | `visits.place_id`, `visit_artworks`                        | value page (R07), artwork page (R03)      |
| pin explained by term          | `artwork_pins.glossary_entry_id`                           | glossary entry (R10)                      |
| pin shows symbol, with meaning | `artwork_pins.symbol_id`, `artwork_pins.symbol_meaning_id` | symbol page (R27), atlas (R26)            |
| meaning labelled by subject    | `symbol_meaning_contexts`                                  | value page and person page (R29)          |
| exhibition shows artwork       | `exhibition_artworks`                                      | "Na wystawach" (R25), list cover (R22)    |
| note links to subject          | only as Markdown text `](/atelier/…)`                      | "Wspomniane w" on R03, R07, R13           |
| note mentions term             | nowhere; matched in the browser                            | "Pojawia się w notatkach" on R10          |

The last two rows are the only relations that are not stored. Today the views that read them in reverse load whole tables for names or every note of the atelier, which is the main finding of [ATL-403](https://linear.app/kamil-nawrot/issue/ATL-403). The model stores note links as rows (M1) and keeps term mentions computed, filtered in the database by the term's phrases (Q2).

## What the model must keep

- A note stays plain Markdown the learner can read in an export.
- A term matches on its name, synonyms and explicit word forms, case-insensitively, between non-letter characters, in notes, in other terms' definitions and on review flashcards.
- A link survives a rename of its target; a merge of two values points it at the value that stays.
- An artwork in the trash keeps its links and mentions and gets them back on restore.
- Every older export imports.
