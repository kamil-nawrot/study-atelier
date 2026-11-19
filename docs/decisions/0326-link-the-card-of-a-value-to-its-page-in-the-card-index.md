# 0326. Link the card of a value to its page in the card index

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

The card of a value in the artwork view ([ADR-0059](0059-value-summary-card-in-the-artwork-view.md)) shows its kind, parent, name and summary and holds nothing to click, while the card of a glossary term ends with "Otwórz w Słowniczku". To read more about an author or a period, the learner has to leave the artwork and find the value in the card index. The owner asked for a link in the card ([ATL-813](https://linear.app/kamil-nawrot/issue/ATL-813)).

## Decision drivers

- The card of a value works like the card of a term.
- Every kind of value that shows a card has a page ([ADR-0049](0049-give-every-category-value-a-page-of-its-own.md)), so no card is left without a target.
- The arrow back on the value page returns to the artwork.

## Considered options

- Leave the cards without a link.
- A link at the bottom of every card, after a hairline, as on the card of a term.

## Decision outcome

Chosen by the owner on 2026-11-18: the card of a value ends, after a hairline, with the link "Otwórz w kartotece" (`arrow-right`) to the page of the value: an author, period, style, material, place or era.

The card is interactive like the card of a term: a non-modal `dialog` named by the value, kept open while the pointer moves from the trigger onto it. `Popover` takes `interactive` and `cardLabel` for it. A summary loads the id of its value, and the era opens by its code.

### Consequences

- Good: one step from the artwork to everything the card index holds about a value.
- Bad: the card now catches clicks, so it can cover a neighbouring trigger while it is open.

## More information

- Linear: ATL-813. Changes R-68 and the cards of [ADR-0059](0059-value-summary-card-in-the-artwork-view.md), which holds nothing to click.
