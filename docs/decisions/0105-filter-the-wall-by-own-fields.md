# 0105. Filter the wall by the learner's own fields

- Status: accepted
- Date: 2026-10-22

## Context and problem statement

[ADR-0104](0104-let-the-learner-define-own-artwork-fields.md) lets the learner define their own artwork fields: lists, texts and ticks ("Zaznaczenie"). Filtering by them was one of the reasons for own fields instead of notes, and was left to a separate issue (ATL-261). The filter of the wall ([ADR-0042](0042-filter-the-collection-in-the-browser.md)) has every field, and its address parameter ([ADR-0102](0102-name-the-address-parameters-in-english.md)), fixed in code. How does the wall filter by fields that exist only in the learner's data?

## Decision drivers

- An own field filters like the built-in field it resembles, so the panel needs nothing new to learn.
- The filter stays in the browser and in the address, as in ADR-0042.
- A link to a filtered wall survives renaming a field in Kartoteka.

## Considered options

- Which kinds filter: lists and ticks only, or also texts through a search.
- Several chosen ticks: all of them, or any of them.
- The field in the address: by its id, or by its name.

## Decision outcome

Chosen with the owner in ATL-261: every kind filters, several ticks must all be ticked, and the address names a field by its id.

- **Lists:** a section per field, headed by the field's name, with its values as toggle tags with the number of artworks, the most frequent first, and a search field, as "Materiał" and "Miejsce". Several values of one field match any of them.
- **Texts:** a section per field with a search field ("Szukaj w polu „Źródło”"). An artwork matches when its text contains the typed text anywhere, ignoring letter case and diacritics, as the search of the wall does.
- **Ticks:** one section "Zaznaczone" with a toggle tag per tick field and the number of artworks; several chosen ticks must all be ticked.
- **Place:** after "Miejsce" and before "Do uzupełnienia", in Kartoteka's order, "Zaznaczone" last. A field that no artwork has filled in is not shown.
- **Tags above the wall:** the field's name in small capitals and the value ("MOTYWY portret", "ŹRÓDŁO gomb"); a tick shows only its name. Removing a tag clears that choice.
- **Address:** `field.<id>` for each chosen list value, `text.<id>` for a text and `ticked=<id>` for each tick. On load, choices of fields that no longer exist, or values no artwork has, are dropped, as for the built-in values.
- Kalendarium's filters ([ADR-0095](0095-filter-the-timeline-with-period-and-style-lanes.md)) do not offer own fields.

### Consequences

- Good: own fields are as useful on the wall as the built-in ones, and a field renamed in Kartoteka keeps its links.
- Good: the wall loads own entries with the artworks, so filtering stays instant.
- Bad: the address of a filtered wall carries long field ids.
- Bad: with many own fields the panel grows long; it has no way to hide sections yet.

## More information

- Issue ATL-261; requirement R-129.
