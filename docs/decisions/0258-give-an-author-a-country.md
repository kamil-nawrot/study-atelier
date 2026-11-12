# 0258. Give an author a country

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

An author has a portrait and years of life ([ADR-0056](0056-author-portrait-years-of-life-and-sort-name.md)), a location has a country ([ADR-0057](0057-location-country-and-type-of-place.md)), but the learner cannot note where an author comes from. The consistency audit (ATL-596) asked for it as one more field (ATL-618), and the owner agreed on 2026-11-12 to add it as a plain extra field.

## Decision drivers

- Authors of antiquity and of historical lands (Sumer, Byzantium) do not fit a list of today's countries; the owner rejected reusing the list of a location (2026-11-12).
- The country is optional and carries no logic yet; filters and statistics are not part of this decision.
- Existing authors keep working without a value.

## Considered options

- A column `country_code` on `author_details`, with the list of countries of ADR-0057.
- A column `country` of free text.
- The list of countries plus a free entry: two columns and a more complex form.
- A custom field of the learner ([ADR-0104](0104-let-the-learner-define-own-artwork-fields.md)): it belongs to artworks, not to authors.

## Decision outcome

Chosen by the owner: the column `author_details.country`, free text of 1 to 60 characters without surrounding spaces, filled through `save_value_details` like the other author columns.

- **Form**: "Kraj autora", a `TextField` after the years of life, with the hint "Wpisz kraj lub krainę."; an empty field stores nothing.
- **Page**: the country follows the years of life under the name, separated by "·", or stands alone when there are no years.
- **Page content**: an author with only a country counts as a page with content.
- **Not decided**: the meaning of the country (birthplace, nationality or place of work) is the learner's; filtering or grouping authors by country would need a list or normalised names and is a later idea.

### Consequences

- Good: one nullable column; any land or period name fits; no data to migrate.
- Bad: the same country may be spelled differently across authors, so it cannot be used for filters or statistics without cleaning.

## More information

- Issue ATL-618; release 0.23.
