# 0271. Count every wish-seen event for the pilgrim's shell

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

The hidden exhibit "Muszla pielgrzyma" (`pilgrim_shell`) is found with the first artwork marked "Chcę zobaczyć" that goes into a saved visit ([ADR-0263](0263-show-an-artwork-seen-after-marking-it-to-see-as-the-pilgrim-s-shell.md)). Saving such a visit records a `wish_seen` event in the ledger, since the cleared mark leaves no other trace (ATL-684). Does the event still count once its artwork is moved to the trash?

## Decision drivers

- Events of the ledger never change when the collection changes ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- A found hidden exhibit stays found.

## Considered options

- Every `wish_seen` event counts.
- Only the events of artworks outside the trash count.

## Decision outcome

Chosen by the owner in ATL-693: every `wish_seen` event of the learner counts, as the moment the wish came true has happened, whatever later becomes of the artwork. The exhibit stands last in "Sala map", after "Siedmiomilowe buty" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)), and gives the 50 points of a single-tier easter egg.

### Consequences

- Good: the exhibit reads one kind of event and needs no join with the collection.
- Bad: marks cleared before ATL-684 shipped left no event, so those visits cannot find the exhibit.

## More information

Built in ATL-693 in `20261112220000_pilgrim_shell_exhibit.sql`.
