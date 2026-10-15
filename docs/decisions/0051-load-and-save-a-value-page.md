# 0051. Load a value page from the collection and save its form in steps

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

[ADR-0049](0049-give-every-category-value-a-page-of-its-own.md) and [ADR-0050](0050-store-value-pages-in-details-tables.md) describe the value page and its form. Building them (ATL-141) left a few questions open: which artworks the page counts and shows and in what order, whether the parent under the name leads anywhere, what happens to the summary and notes typed in a form that ends in a merge, and how the form saves the name, the links and the details.

## Decision drivers

- What a value page shows comes from the collection as it is now ([ADR-0050](0050-store-value-pages-in-details-tables.md)).
- The number in the header matches the artworks shown under it.
- The rename, merge, link and delete rules of [ADR-0040](0040-manage-category-values-in-a-card-index.md) stay as they are.
- A failed save can be repeated without leaving the value in a broken state.

## Considered options

Saving the form:

1. One database function per details table kind that inserts or updates the details row, called before the existing link, rename and merge functions
2. One database function that saves the details, the links and the name or merge in one transaction

## Decision outcome

Chosen, decided by the owner in ATL-141: option 1, and the rules below.

- **Artworks.** The page loads the whole collection outside the trash, as the wall does ([ADR-0041](0041-load-the-whole-collection-in-pages-of-1000.md)), and picks the artworks of the value in the browser: by name for a category value (names are unique per kind), by era code for an era. The header counts these artworks, so artworks in the trash are not counted there, unlike the numbers in the card index. They are shown in chronological order by the end year of their date ([ADR-0046](0046-enter-the-date-of-creation-as-a-year-span.md)), artworks without a date last.
- **Parent.** The eras of a period and the periods of a style under the name are links to their own value pages. Values in the artwork view stay without links ([ADR-0047](0047-no-links-from-values-into-a-filtered-wall.md)).
- **Merge.** When the new name matches another value and the form ends in a merge, the summary and notes typed in the form are not saved; the remaining value keeps its own (R-69), and the merge confirmation already says the merged value's page content is deleted. After the merge the app opens the page of the remaining value.
- **Saving.** `save_value_details(target_value, details)` inserts or updates the details row of a category value and `save_era_details(target_era, details)` that of an era; `details` is a JSON object with the fields of the kind, so ATL-142 and ATL-143 add fields without a new function. Both run as the learner (`security invoker`). The form saves the details first, then the links (`set_period_eras`, `set_style_periods`), then the name or the merge. Each step can be repeated, so after an error the learner saves again.

### Consequences

- Good: no new query by value; the page reuses the wall's loading, image resolution and tiles.
- Good: the existing link, rename and merge functions stay unchanged.
- Bad: the save is not one transaction; an error after the first step leaves the details saved and the name unchanged until the learner saves again.
- Bad: a value page loads the whole collection, which costs as much as opening the wall.

## More information

- Issue ATL-141. Builds on [ADR-0049](0049-give-every-category-value-a-page-of-its-own.md) and [ADR-0050](0050-store-value-pages-in-details-tables.md).
