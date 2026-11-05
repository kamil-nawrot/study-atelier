# 0190. Show the relations of a value on its page

- Status: accepted
- Date: 2026-11-05

## Context and problem statement

A value page ([ADR-0049](0049-give-every-category-value-a-page-of-its-own.md)) shows the name, the parent, the summary and the notes, then the artworks. An era page does not show its periods and styles, which the card index list shows, a period page does not show its styles, and a page with only a summary looks poor. Events have no page at all: a row opens the event form. What else should a value page show?

## Decision drivers

- The page shows relations the learner cannot see elsewhere at a glance.
- Most of it is computed from what the page already loads; anything new is a narrow database read.
- Each section appears only where it means something for that kind of value.

## Considered options

Six sections, all chosen: the hierarchy, "Najczęściej razem" (co-occurring values with counts), a time span, "W tym samym czasie" (overlapping Kalendarium events), artwork types with counts, review progress.

For the layout: one column of sections under the header; a band under the header in two columns.

For collapsing: no collapsing; every section; the band and the artwork list, remembered or not.

## Decision outcome

Chosen by the owner in ATL-500: all six sections in a band of two columns under the header, stacked on a phone. The left column holds the time span and the hierarchy or "Najczęściej razem", the right column the review progress, the types and "W tym samym czasie".

| Kind      | Band on the time span | Hierarchy or together                 | W tym samym czasie |
| --------- | --------------------- | ------------------------------------- | ------------------ |
| Era       | era bounds            | periods and styles                    | yes                |
| Period    | none                  | styles and authors                    | yes                |
| Style     | none                  | periods and authors                   | yes                |
| Author    | years of life         | periods, styles, materials and places | yes                |
| Event     | event years           | authors and periods                   | other events       |
| Material  | none                  | authors, periods and types            | no                 |
| Place     | none                  | authors, periods and types            | no                 |
| Own value | none                  | authors, periods and types            | no                 |

- The time span marks the years of the artworks as ticks on every page.
- The types with counts and the review progress are on every page.
- The band and the artwork list can each be collapsed; both are open on every visit and the state is not remembered. The artwork list itself stays as it is.
- An event gets a page like other values. The card index and Kalendarium open it, and the event form opens from it. Its artworks are the artworks of its time, as on the event card of Kalendarium (R-118).

### Consequences

- Good: an era and a period no longer lose what the list shows, and every page tells more than its summary.
- Bad: two new reads per page, the overlapping events and the review progress.

## More information

Design issue ATL-500, builds ATL-504 (event page) and ATL-505 (band). Mockup `kartoteka-0-20/szczegoly-wzbogacone-B.png` in the project files.
