# 0060. Order authors by their sort name on the wall, in the filters and in the card index

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

Authors were ordered by the name as stored, usually first name first, so "Andy Warhol" came before "Gustav Klimt". [ADR-0050](0050-store-value-pages-in-details-tables.md) gave an author an optional sort name ("Sortuj jako", `author_details.sort_name`) and R-66 says authors are put in A to Z order by it, or by their name when it is not set. Where is it used and how is it read (ATL-127)?

## Decision drivers

- No migration: an author without a sort name keeps sorting by the name.
- No extra request where a query already reads the authors.

## Decision outcome

Chosen in ATL-127, following R-66 as the owner scoped it in ATL-19.

- **Sort key**: an author's sort name when set, otherwise the name, compared with `Intl.Collator('pl')` (`#lib/collection/author-sort.ts`).
- **Wall, order "Według autorów"**: the groups follow the sort key of the first author; "Autor nieznany" stays last. The wall query embeds `author_details(sort_name)` under each author value, so no request is added.
- **Filter panel, authors**: the list still puts the authors with the most artworks first; among authors with the same count the sort key decides. "Autor nieznany" stays last.
- **Card index, "Autorzy"**: the list follows the sort key. The card index reads the sort names of the authors that have one in one more request next to the usage functions; `value_usage` stays as it is.
- The author's name is shown as written everywhere; the sort name is only the key.

### Consequences

- Good: "Gustav Klimt" now comes before "Andy Warhol" once the learner gives them sort names, and nothing changes for authors without one.
- Bad: the card index makes one more request, also when no author has a sort name.

## More information

- Issue ATL-127; R-66; [ADR-0033](0033-order-the-wall-by-period-with-a-period-rail.md) for the wall orders.
