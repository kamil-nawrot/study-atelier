# 0050. Store value pages in details tables and settle the details of the build

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

[ADR-0049](0049-give-every-category-value-a-page-of-its-own.md) gives every category value and era a page with the learner's summary, notes and kind-specific fields, and a form on its own page. Before the build (ATL-138, split into ATL-140 to ATL-143) a few details were still open: the shape of the details tables, the routes, the years of life of an author, the sort name, a limit for the summary, the texts that differ by kind, the location type tiles, the portrait search and the names of countries. What does the build follow?

## Decision drivers

- Nothing that works on `category_values` changes ([ADR-0049](0049-give-every-category-value-a-page-of-its-own.md)).
- The database refuses data of the wrong kind, as it does for the links of the era chain ([ADR-0038](0038-chain-era-period-and-style.md)).
- The portrait reuses the artwork image code: search, own image, display ([ADR-0007](0007-images-from-open-sources.md), [ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md)).
- The summary fits in the card in the artwork view, also on a phone.

## Considered options

Kind of a details row: a trigger that checks the category of the value, or a fixed `category_code` column in each details table with a composite foreign key to `category_values`.

Years of life: a year span as the date of creation (ADR-0049), a span with a "born" or "died" choice for a single year, or two optional columns, the year of birth and the year of death.

Sort name: a text column with a separate flag for the checkbox, or one nullable text column.

Summary: no limit, or a limit of 300 characters.

## Decision outcome

Chosen, decided by the owner in ATL-138 and ATL-140: the fixed `category_code` column with a composite foreign key, two columns for the years of life, one nullable sort name column, and a summary of at most 300 characters.

### Data

- Five tables, `period_details`, `style_details`, `material_details`, `author_details` and `location_details`, each keyed by `value_id`, with `owner_id`, a fixed `category_code` (`check (category_code = 'author')` and so on) and a foreign key `(value_id, owner_id, category_code)` to `category_values`, which cascades on delete. A row of the wrong kind or of another learner's value cannot be inserted. Merging deletes the merged value and so its details; deleting a value deletes them too.
- `era_details` is keyed by `owner_id` and `era_code`.
- Every table has `summary` (plain text, at most 300 characters, not empty when set), `notes` (Markdown) and `updated_at`.
- A row is created when the learner first saves the form. No row means an empty page, so existing values need no data migration.
- `author_details`:
  - the portrait in the columns the artwork image uses, with the same names and checks: `source_wikidata_id`, `source_image_file`, `source_image_licence`, `source_image_licence_url`, `source_image_attribution`, `own_image_path`, `own_image_url`, `own_image_source_url`, `image_width`, `image_height`;
  - `birth_year` and `death_year`, both optional signed years without a year 0 (negative before the common era), and one `years_approximate` flag for both, as the "ok." of the date of creation ([ADR-0046](0046-enter-the-date-of-creation-as-a-year-span.md)); the year of birth is not later than the year of death. This replaces the year span of ADR-0049 for the years of life;
  - `sort_name`, null when not used. The checkbox "Sortuj jako" is ticked when it is set; unticking clears it on save.
- `location_details`: `country_code`, an ISO 3166-1 alpha-2 code (two capital letters; the app checks it against its list), and `place_type`: `museum`, `private_collection` or `on_site`.
- An uploaded portrait is removed from Storage by the app after the value is deleted or merged, as the trash does for artwork images; the app reads its path first.
- `value_page_content` tells whether a value has page content and returns the path of an uploaded portrait. When the merged value has page content, the merge confirmation adds "Podsumowanie, notatki i pozostałe informacje o „{nazwa}” zostaną usunięte." before the sentence that the merge cannot be undone.
- Whatever a value page shows about other values (for example the styles of an author's artworks or the authors of an era) is derived from the artworks in the collection at that moment. There are no links between values kept by hand beyond the era chain.

### Routes

- The page of a value is `/atelier/values/[kind]/[id]` and its form `/atelier/values/[kind]/[id]/edit`, with the kind in English (`era`, `period`, `style`, `material`, `author`, `location`). An era uses its code as the id, for example `/atelier/values/era/early_modern`.

### Texts per kind

| Kind     | Heading of the artworks | No notes                                  | No artworks                                                      |
| -------- | ----------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| era      | Dzieła z tej epoki      | Nie masz jeszcze notatek o tej epoce.     | Nie posiadasz w swojej kolekcji żadnego dzieła z tej epoki.      |
| period   | Dzieła z tego okresu    | Nie masz jeszcze notatek o tym okresie.   | Nie posiadasz w swojej kolekcji żadnego dzieła z tego okresu.    |
| style    | Dzieła w tym stylu      | Nie masz jeszcze notatek o tym stylu.     | Nie posiadasz w swojej kolekcji żadnego dzieła w tym stylu.      |
| material | Dzieła z tego materiału | Nie masz jeszcze notatek o tym materiale. | Nie posiadasz w swojej kolekcji żadnego dzieła z tego materiału. |
| author   | Dzieła tego autora      | Nie masz jeszcze notatek o tym autorze.   | Nie posiadasz w swojej kolekcji żadnego dzieła tego autora.      |
| location | Dzieła z tego miejsca   | Nie masz jeszcze notatek o tym miejscu.   | Nie posiadasz w swojej kolekcji żadnego dzieła z tego miejsca.   |

The header of a page shows the kind and the number of artworks with the plural forms of the app ("Autor · 1 dzieło", "Okres · 5 dzieł").

### Form details

- The location type tiles show the names only: "Muzeum", "Kolekcja prywatna", "Na miejscu".
- "Znajdź portret" opens the artwork image search dialog unchanged; only the query differs: people (Wikidata `Q5`) found by the author's name, with an image (`P18`).
- "Kraj" lists today's countries by their ISO 3166-1 codes, kept in the app, with Polish names from `Intl.DisplayNames('pl', { type: 'region' })`.
- Where a mockup of ATL-19 differs from ADR-0049 or this record, these records win.

### Consequences

- Good: the database refuses details of the wrong kind or of another learner's value without a trigger.
- Good: the portrait shares its columns and checks with the artwork image, so the image code is reused.
- Good: no data migration; the new tables only add.
- Bad: the fixed `category_code` column repeats the kind in every row, and `category_values` gets one more unique key for the foreign key.
- Bad: removing an uploaded portrait after a delete or merge is a second step in the app; if it fails, the file stays in Storage, as an artwork image can after a permanent delete.
- Bad: unticking "Sortuj jako" loses the typed sort name.

## More information

- Issues ATL-138 (parent), ATL-140 (data), ATL-141 (page and form), ATL-142 (author), ATL-143 (location).
- Amends [ADR-0049](0049-give-every-category-value-a-page-of-its-own.md): the years of life are two optional years instead of a year span, and the summary has a limit. Updates R-64 and R-65.
