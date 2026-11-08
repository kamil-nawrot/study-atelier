# 0234. Mark a room with a new tier in its header

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

The rooms of the display case fold, and two switches hide finished and locked exhibits ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)). The display case marks new tiers as seen when it opens, so a new tier of an exhibit in a folded room, or of one the switches hide, would never show its "Nowe" mark. A room header also shows its progress only as coloured squares, which assistive technology cannot read. How does the learner learn of a new tier out of sight, and how is the progress of a room read aloud?

## Decision drivers

- As simple as possible; the folding and the switches stay as the learner left them.
- The squares are decorative; the header must say the same in words.

## Considered options

For a new tier out of sight: show its exhibit despite the switches and unfold its room for that visit; mark the room header with "Nowe"; leave it.

For the squares: a hidden "Ukończone: 1 z 4" in the header button; a label on each square.

## Decision outcome

Chosen by the owner in ATL-582.

- A room with an exhibit whose tier is not seen yet shows the tag "Nowe" beside its name, whether the room is folded or open; the folding and the switches do not change.
- The squares are hidden from assistive technology, and the header button carries a visually hidden "Ukończone: 1 z 4", the number of finished exhibits of the room, a found hidden exhibit included.

### Consequences

- Good: no rule overrides what the learner chose, and a folded room still says that something new is inside.
- Bad: an exhibit hidden by a switch stays hidden; the learner sees "Nowe" on its room and has to turn the switch on to find it.

## More information

Built in ATL-582 with the rooms ([R-238](../product/requirements.md)).
