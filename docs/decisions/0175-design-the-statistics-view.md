# 0175. Design the statistics view

- Status: accepted; the look of the sections is superseded by [0239](0239-set-the-statistics-sections-apart-like-rooms.md)
- Date: 2026-11-03

## Context and problem statement

[ADR-0171](0171-show-statistics-of-the-collection-from-the-wall.md) decided what the statistics view shows, where it lives and where its numbers come from. How does it look: its layout, the names and order of its sections, its components, the phone, and its states?

## Decision drivers

- Plain statistics: nothing highlighted, no mood, no motivation ([ADR-0171](0171-show-statistics-of-the-collection-from-the-wall.md)).
- Reuse what the app already has, so one thing looks and is named the same everywhere.
- Sections appear and disappear with their thresholds without leaving holes.
- A light touch from the world of museums, as long as it stays clear ([voice and tone](../product/voice-and-tone.md)).

## Considered options

- Layout: one column at `--size-content-default`; a wide dashboard grid at `--size-content-wide`.
- Colour: the amber `--color-highlight` of the prototype; the monochrome theme tokens.
- Section names: plain labels (Podsumowanie, Rozkład, Do uzupełnienia, Rekordy, Powtórki, Jak rośnie atelier); names from the world of museums.
- The cross-section's start: nothing chosen, with a prompt; one dimension chosen.

## Decision outcome

Chosen by the owner, in the spike ATL-434 (step 10), on the prototype linked there.

**Layout.** A detail page: "← Atelier" (`BackLink`) in the top bar, then the `h1` "Statystyki" with the lead and the sections in one column at `--size-content-default`, each an `h2` over a hairline in `--color-tag`. A grid would leave holes where a section waits for its threshold.

**Sections, in this order**, renaming those of ADR-0171:

| Section             | Was                 |
| ------------------- | ------------------- |
| Stan zbiorów        | Podsumowanie        |
| Kompozycja          | Rozkład             |
| Na pierwszym planie | Na pierwszym planie |
| Białe plamy         | Do uzupełnienia     |
| Osobliwości         | Rekordy             |
| W pamięci           | Powtórki            |
| Nabytki             | Jak rośnie atelier  |

The collection comes first, then its curiosities, then learning and time. The wall filter that "Białe plamy" opens keeps its name "Do uzupełnienia". Names of modules (Kronika, Kalendarium, Ekspozycja) are avoided, so no section passes for a place of its own.

**Components**, in the monochrome theme tokens; only the review groups keep their shades:

- Stan zbiorów: a grid of four numbers in a row, the number bold (`xl`, `lg` on a phone) over its label (`sm`, `xs` on a phone, wrapping), not links.
- Kompozycja: two rows of `ToggleTag`, "Grupuj dzieła według" and "Dodatkowy wymiar grupowania" with "brak" first, side by side from 768 px and one under the other on a phone; the section starts with Epoka and "brak". Bars are rows of name, bar and number, the bar in `--color-fg` on a `--color-tag` track, the rows "pozostałe", "bez …" and "Autor nieznany" muted; on a phone the bar goes under the name and the number. The table shades its cells with a mix of `--color-fg` and the background, shows zero as "·", sets the totals bold behind a hairline, keeps its first column sticky and scrolls sideways in its own box; its headers are full names.
- Na pierwszym planie: the library `Tabs`, the same bars numbered.
- Białe plamy: the same bars, the bar muted, each gap measured against all artworks.
- Osobliwości: two columns from 768 px; a label in small capitals, the value (an artwork as `cite.artwork-title`, an author in plain text, both links) and a caption; no frames. An author links to the wall filtered by that author, since the wall's collection names authors without their ids (decided by the owner while building ATL-440).
- W pamięci: the group bar of the review start's panel, shared with `ReviewKnowledge`; the share of correct quiz answers as a large number; the lists as rows of a thumbnail, the title and the authors, like "Ostatnio sprawiały kłopot", with the count at the right.
- Nabytki: SVG columns in `--color-fg` with `--color-tag` grid lines and four ticks; an x label every 5th day, 4th week or 2nd month; a `Tooltip` with the date and the count on hover, focus or tap.

**States.** The page waits for the collection and the database function under the `ProgressLine` of any navigation, without section skeletons. A failed load shows `LoadFailure` for the whole page. A section below its threshold keeps its `h2` with one caption sentence saying when it will appear; "Białe plamy" with nothing missing is left out. An empty atelier, reached from the address, shows an `EmptyState` with "Dodaj dzieło" ([ADR-0130](0130-show-empty-views-in-one-centred-pattern.md)).

### Consequences

- Good: the view looks like the rest of the app and reuses its review bar, tags, tabs and empty state.
- Good: thresholds never break the layout.
- Bad: on a large screen the page is long; nothing stands side by side but the two tag rows and the records.
- Bad: "Białe plamy" and the wall's "Do uzupełnienia" are two names for the same gaps.

## More information

- Amends [ADR-0171](0171-show-statistics-of-the-collection-from-the-wall.md): the section names, and an author in Osobliwości leads to the wall filtered by that author instead of the value page; the rest stands.
- Spike ATL-434, step 10; built in ATL-437 to ATL-440.
