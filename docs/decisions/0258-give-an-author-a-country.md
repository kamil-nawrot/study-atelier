# 0258. Give an author a country

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

An author has a portrait and years of life ([ADR-0056](0056-author-portrait-years-of-life-and-sort-name.md)), a location has a country ([ADR-0057](0057-location-country-and-type-of-place.md)), but the learner cannot note where an author comes from. The consistency audit (ATL-596) asked for it as one more field (ATL-618), and the owner agreed on 2026-11-12 to add it as a plain extra field.

## Decision drivers

- The same list of countries and the same field as for a location, nothing new to learn.
- The country is optional and carries no logic yet; filters and statistics are not part of this decision.
- Existing authors keep working without a value.

## Considered options

- A column `country_code` on `author_details`, with the field of ADR-0057.
- A custom field of the learner ([ADR-0104](0104-let-the-learner-define-own-artwork-fields.md)): it belongs to artworks, not to authors.

## Decision outcome

Chosen: the column `author_details.country_code`, a two-letter uppercase code that the database checks, filled through `save_value_details` like the other author columns.

- **Form**: "Kraj autora" with the hint "Wybierz kraj, z którym kojarzy się autor.", the `SearchSelect` of a location, after the years of life.
- **Page**: the country follows the years of life under the name, separated by "·", or stands alone when there are no years.
- **Page content**: an author with only a country counts as a page with content.
- **Not decided**: the meaning of the country (birthplace, nationality or place of work) is the learner's, hence "z którym kojarzy się"; filtering authors by country is a later idea.

### Consequences

- Good: one nullable column and the existing country list; no data to migrate.
- Bad: a stored code that leaves the list is shown as no country until the list is updated.

## More information

- Issue ATL-618; release 0.23.
