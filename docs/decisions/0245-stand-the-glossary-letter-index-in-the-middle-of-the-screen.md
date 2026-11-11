# 0245. Stand the glossary letter index in the middle of the screen

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

The letter index of Słowniczek started beside the first letter group and moved up with the page until it reached the top bar ([ADR-0192](0192-refresh-the-glossary-list-and-show-the-fragments-of-a-term.md): on a phone it starts at the list). A column that travels while the learner scrolls is not a fixed control to reach for (ATL-626). Where does it stand still?

## Decision drivers

- The index does not move while the page scrolls.
- It is easy to reach with the thumb and the pointer.

## Considered options

- **A:** right below the top bar, where it stopped after scrolling.
- **B:** in the middle of the screen's height below the top bar, like the index of contacts on a phone.

## Decision outcome

Chosen option: "B", by the owner. From 768 px `LetterIndex` is fixed at the right edge and centred in the height between the top bar and the bottom of the screen. On a phone it keeps the rule of ADR-0192: it starts at the list and moves up to the top bar, because centred it covers the search field, the sort select and the hairlines of the filters (the owner, after a screenshot).

### Consequences

- Good: on a computer the index stays in one place from the first screen.
- Bad: on a computer it stands beside the lead and the filters on the first screen rather than beside the first letter; a phone still moves it.

## More information

ATL-626.
