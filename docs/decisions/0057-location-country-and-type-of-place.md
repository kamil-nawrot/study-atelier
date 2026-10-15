# 0057. Give a location a country from a searchable list and a type of place as tiles

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

[ADR-0049](0049-give-every-category-value-a-page-of-its-own.md) and [ADR-0050](0050-store-value-pages-in-details-tables.md) give a location an optional country, chosen from a fixed list of today's countries with search, and an optional type of place: museum, private collection or on site. Building it (ATL-143) needs a field to pick one of about 250 countries, the list itself, the look of the type tiles and how both show on the page.

## Decision drivers

- About 250 countries are too many for a native select; the learner types part of the name.
- The list is kept in the app, with Polish names from `Intl.DisplayNames` ([ADR-0050](0050-store-value-pages-in-details-tables.md)).
- The type tiles look like the era tiles.

## Considered options

The country field: a native `Select` with all countries (the browser only jumps by first letters), or a new library field that filters a fixed list while typing.

## Decision outcome

Chosen, decided by the owner in ATL-143: the new field, and tiles with icons.

- **`SearchSelect`** in `packages/ui`: a combobox over a fixed list of `{ value, label }` that picks one value. Focus opens the whole list with the chosen value marked; typing filters it by labels, ignoring case and Polish diacritics; the arrows, Enter and Escape work as in `ValueField`; a clear button empties it; "Nic nie pasuje" says when nothing matches. It holds the code, not the name.
- **Countries**: the 249 codes of ISO 3166-1 alpha-2 live in `#lib/collection/countries.ts`, generated once from the regions ICU knows, without codes that are not countries today (the European Union, the United Nations, exceptionally reserved and withdrawn codes, old aliases and the user-assigned `XK`). Names come from `Intl.DisplayNames('pl', { type: 'region' })` and the list is sorted with `Intl.Collator('pl')`.
- **Form**: "Kraj" with the placeholder "Zacznij pisać nazwę kraju" and the hint "Wybierz kraj z listy.", then "Typ miejsca" as three `ChoiceTiles` that can be cleared: "Muzeum" with the `landmark` icon, "Kolekcja prywatna" with `house`, "Na miejscu" with `map-pin`, names only. A tile label may wrap to two lines on a phone; its note still does not wrap.
- **Page**: the type and the country stand under the name as "Muzeum · Francja", or only the one that is set.

### Consequences

- Good: the country is found by any part of its name and stored as a code the database checks.
- Good: `SearchSelect` serves any later long fixed list.
- Bad: names follow the ICU data of the learner's browser, so a renamed country shows its new name only after the browser updates.
- Bad: the code list has to be updated by hand when ISO adds or withdraws a country.

## More information

- Issue ATL-143; builds on [ADR-0049](0049-give-every-category-value-a-page-of-its-own.md) and [ADR-0050](0050-store-value-pages-in-details-tables.md).
