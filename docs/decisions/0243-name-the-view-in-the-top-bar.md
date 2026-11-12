# 0243. Name the view in the top bar

- Status: accepted; the lead on a phone is superseded by [0252](0252-overhaul-the-app-on-a-phone.md)
- Date: 2026-11-10

## Context and problem statement

The consistency audit (ATL-596) left the top bar of several modules empty: Kartoteka, Powtórki and Ekspozycja had nothing in it, while the name of every view stood as the `h1` of `PageHeader` at the top of the content (ATL-597, recorded in [ui-patterns.md](../guidelines/ui-patterns.md#layout)). The idea in ATL-616 was to name the view in the bar and keep its search at hand on long lists. Mockups tried two ways of swapping the name for a compact search once the toolbar scrolls away, and a third way without any swap.

## Decision drivers

- Every view of the menu looks the same from the top: its name, then what it lists.
- The bar does not change under the learner while they scroll or type.
- One `h1` per page.
- The phone bar has room for the menu button, the name and one action.
- Forms and detail pages keep the back link that names the place it leads to ([ADR-0106](0106-name-where-the-arrow-of-a-form-leads.md)).

## Considered options

- **A:** the name is the bar's `h1`, and past the toolbar a compact search with a filter button takes its place.
- **B:** the `h1` stays in the content; the bar shows the name once the `h1` scrolls out, then the search once the toolbar does.
- **C:** the name is the bar's `h1`, with no swap on scroll.

## Decision outcome

Chosen option: "C", settled with the owner on the mockups. The swaps of A and B unmount the field the learner types in, crowd the phone bar (a field of 140–190 px beside the filter and the add button), and in B leave the top bars empty at the top of the page.

- Kartoteka, Słowniczek, Kalendarium, Kronika, Wystawy, Powtórki (on the start screen only), Ekspozycja, Statystyki, Archiwum and Ustawienia show their name in the top bar as the page's `h1`, in the look of a page title (`xl`, bold). `AtelierLayout` renders it from its `title` with `heading`.
- Statystyki and Ustawienia, which are not items of the menu, start the bar with an arrow-only back link to Atelier (`BackLink` with `arrowOnly`, the name kept for assistive technology), then the name.
- The content starts with the lead and its hairline: `PageHeader` no longer has a title. A count stands level with the lead from 768 px and under it on a phone; "Filtry" in Kalendarium stays at the top right of the content, level with the lead.
- The Atelier wall stays as it is: its tools fill the bar, without a name.
- On a phone the add action of the bar (Słowniczek, Kronika, Kalendarium) is the "+" alone, its label kept as the accessible name and shown in a tooltip. This replaces "+ Dodaj" on a phone (ATL-597). Wystawy keeps no add action in the bar on a phone ([ADR-0238](0238-hide-adding-an-exhibition-on-a-phone.md)).
- Forms and detail pages are unchanged.

### Consequences

- Good: no top bar of a module is empty, and every module names itself in the same place.
- Good: the content starts one line higher, with what the view is for.
- Good: one library pattern, `AddButton`, for the add action of a bar.
- Bad: the search of a long list is only at the top of the list, as before.
- Bad: on a phone a count no longer stands beside a title and takes a line under the lead.

## More information

- Amends the header rules recorded with ATL-597 in [ui-patterns.md](../guidelines/ui-patterns.md#layout): the `h1` of `PageHeader`, the small title in the bar and "Dodaj" on a phone.
- Mockups and the owner's notes: ATL-616.
