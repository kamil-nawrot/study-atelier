# 0272. Count relations outside the trash for Arachne's web

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

The tiered exhibit "Sieć Arachne" (`vault_cobweb`) counts the relations between artworks and between authors together, every kind, with tiers at 1, 5, 10, 25, 50, 100 and 250 ([ADR-0264](0264-show-relations-as-arachne-s-web.md)). An artwork in the trash keeps its relations, and the card of the other artwork leaves it out until it is restored ([ADR-0259](0259-relate-artworks-and-authors-with-typed-relations.md)). Does such a relation count?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- Every other exhibit leaves out artworks in the trash ([ADR-0235](0235-count-artwork-types-outside-the-trash-for-the-boncompagni-academy.md)).

## Considered options

- Only relations whose both artworks are outside the trash count.
- Every stored relation counts.

## Decision outcome

Chosen by the owner in ATL-694: a relation between artworks counts while both of them are outside the trash, as the counter should show what the atelier shows. Relations between authors always count, as authors have no trash. The exhibit stands fourth in "Sala główna", after "Akademia Boncompagniego"; "Camera obscura z Encyklopedii" and "Pinakoteka motyli" move one place down ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).

### Consequences

- Good: the counter matches the relations the learner sees on the cards.
- Bad: moving an artwork to the trash lowers the counter by its relations; a reached tier stays. Merging two authors drops duplicate relations and lowers it too.

## More information

Built in ATL-694 in `20261112230000_vault_cobweb_exhibit.sql`. The seventh curiosity rests on two Prado pages; the display case links the page of _The Sense of Smell_, which names the series.
