# 0268. Add from the tabs of the glossary like the card index

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

Version 0.23 split the glossary into the tabs "Pojęcia" and "Symbole" ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)). Its add action stayed in the top bar ([ADR-0243](0243-name-the-view-in-the-top-bar.md)) and changed with the tab, while the card index puts the add buttons of a tab next to its search and order ([ADR-0158](0158-add-values-straight-from-the-card-index.md), [ADR-0188](0188-redesign-the-card-index-lists.md)). The two tabbed views also differed in spacing: the glossary panel had extra space above its tools, and its search was narrower than the row. On a phone the top bar hides its add action, so a symbol could only be added from the empty atlas. How should the glossary tabs add, and how should they be spaced?

## Decision drivers

- The library `Tabs` holds everything a tab shows, the add buttons included ([ADR-0188](0188-redesign-the-card-index-lists.md)).
- Two tabbed views of the app look and behave the same.
- Every kind can be added on a phone.

## Considered options

- Keep the add action in the top bar, switched by the tab.
- Put the add button of each tab in its tools, like the card index.

## Decision outcome

Chosen option: "Put the add button of each tab in its tools, like the card index", as the owner asked in ATL-696.

- "Pojęcia" and "Symbole" have a primary compact "Dodaj pojęcie" / "Dodaj symbol" with `plus` at the right of the row of the search and the order, the `plus` alone on a phone. The top bar of the glossary has no add action.
- The search fills the row before the order and the add button, and the tools start at the top of the panel without extra space, as in the card index. Both views share one component of the tools (`ListTools`).
- A glossary with fewer terms than the search needs keeps the order and the add button at the right of the row.
- The count of the view next to the lead stays ([ADR-0243](0243-name-the-view-in-the-top-bar.md)).

### Consequences

- Good: the tabs of the glossary and the card index look the same, and a symbol can be added on a phone.
- Good: one component of the tools instead of three copies.
- Bad: the glossary is now the one module of Słowniczek, Kronika and Kalendarium without the add action in the top bar.

## More information

Supersedes the add action of the glossary in the top bar from [ADR-0243](0243-name-the-view-in-the-top-bar.md) and [ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md). Issue: ATL-696.
