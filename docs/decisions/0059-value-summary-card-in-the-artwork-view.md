# 0059. Show a value's summary in a card that opens from the artwork view

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

[ADR-0049](0049-give-every-category-value-a-page-of-its-own.md) decided that in the artwork view a value with a summary shows a card with its kind, parent, name and summary (an author also the years of life) when the pointer rests on it or it gets focus, and on a phone after a tap; a value without a summary shows nothing (R-68). Building it (ATL-131) leaves open the component, which parent the card names, what the learner hovers or taps, how the card closes and how the summaries are read.

## Decision drivers

- The card has several lines and its own layout; `Tooltip` holds one short text and does not react to a tap.
- The card names what the learner sees next to it, without data the view does not have.
- No request per hover (ATL-131).

## Decision outcome

Chosen, decided by the owner in ATL-131.

- **`Popover`** in `packages/ui`: a button as the trigger with the card beside it. A click or a tap opens the card and a second one closes it; on a computer the card also opens while the pointer rests on the trigger and closes when it leaves the trigger, unless a click opened it; the card holds nothing to click and lets clicks through, so it never blocks the tags under it; keyboard focus opens it. A click or a tap anywhere else and Escape close it. The card stays inside the window: below the trigger, above it when there is no room, and moved sideways to fit. The trigger is described by the card while it is open. It is named for what it is, not for hovering, because it opens on a click too.
- **Trigger**: a value with a summary is the button (the tag of the era, period, styles, materials and location, and each author's name in the line under the title), looking as before; a value without a summary stays plain text.
- **Card** (`ValueSummaryCard`): the kind in small capitals with the parent ("Okres · nowożytność"), the name in the title font, the years of life of an author, and the summary. The parent comes from the artwork itself: the artwork's era for a period, the artwork's period for a style, none for the other kinds.
- **Data**: the artwork page loads the summaries next to the artwork in one request for its values with their details tables embedded, and one for the learner's era summaries (`loadValueSummaries` in `#lib/collection/value-summaries.ts`); a failed request leaves the badges plain.

### Consequences

- Good: the card is a library component that any later view can use for a short note.
- Good: the artwork record and its query stay as they were.
- Bad: two more requests when an artwork opens, also when none of its values has a summary.

## More information

- Issue ATL-131; builds on [ADR-0049](0049-give-every-category-value-a-page-of-its-own.md). Values in the artwork view still have no links ([ADR-0047](0047-no-links-from-values-into-a-filtered-wall.md)).
