# 0130. Show empty views in one centred pattern

- Status: accepted
- Date: 2026-10-25

## Context and problem statement

Every module and tab has a state for when it holds nothing yet, and each was built on its own: the atelier and the trash used a block with a bar on the left, a title and a button; the glossary, the chronicle and most tabs of the card index used one sentence under the page lead; the events and own fields tabs put a button above the sentence; the periods and styles tab and Kalendarium drew their whole empty axis with "nothing here" in every era or lane. The owner found the atelier and the trash cramped and asked for one direction (ATL-344).

How should a view look when it has nothing to show yet?

## Decision drivers

- A learner who starts from zero in a module should see what the module is for and how to begin.
- A part of a page that has no content yet should not shout over the rest of the page.
- One pattern, learned once.
- A calm, airy layout that does not look squeezed on a wide screen.

## Considered options

1. A framed block with a title in every empty view and tab
2. One quiet sentence everywhere, with actions only in the top bar
3. Two levels: a full empty state for a whole empty module and a quiet sentence for an empty part of a page

Layout of the empty state:

1. Aligned to the left like the rest of the page
2. Centred in the width of the content

## Decision outcome

Chosen option: 3 with the centred layout, because it tells "you start here from zero" apart from "this part has nothing yet", keeps the inviting start that the atelier already had, and the centred block reads as a deliberate state on a wide screen.

- **A whole empty module** (the atelier, the glossary, the chronicle, Kalendarium with no dated artworks and no events, the trash, and the review before it has enough artworks) shows the library `EmptyState`, centred in the content with generous space above and below: the module's icon from the menu, large and muted, a title "… jest jeszcze pusty/pusta", one or two sentences on what the module holds and how to begin, and the module's first action as a secondary button ("Dodaj pierwsze dzieło"). The button repeats the action of the top bar, because on a phone the top bar shows only its icon. The trash has no button.
- **An empty part of a page** (a tab of the card index, the events lane of Kalendarium) shows the same `EmptyState` without a title: a smaller icon and one muted sentence. A tab's own action ("Dodaj wydarzenie", "Dodaj pole") stays above the list on the right.
- **An empty structure is not drawn**: when the periods and styles tab has no period at all, the axis of eras is replaced by the empty state; when Kalendarium has no dated artwork and no event, the timeline is replaced by the module's empty state. An era without periods among eras that have them, or the events lane when there are dated artworks, keeps its short line, horizontal also on a phone.
- The "nothing matches" states of a search or of filters are a separate family and stay as they are.

### Consequences

- Good: every empty view looks and reads the same way, and the first screen after signing up invites to begin.
- Good: the cramped framed block and the empty axes are gone.
- Bad: a centred block is the one place where the content of a view is not aligned to the left.

## More information

- Issue ATL-344, milestone 0.12; screenshots of every empty view and the mockups of both layouts are attached there.
- The texts were agreed with the owner and live in the message dictionary.
