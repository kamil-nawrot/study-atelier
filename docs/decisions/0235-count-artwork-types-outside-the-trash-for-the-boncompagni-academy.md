# 0235. Count artwork types outside the trash for the Boncompagni academy

- Status: accepted
- Date: 2026-11-09

## Context and problem statement

The tiered exhibit "Akademia Boncompagniego" (`boncompagni_academy`) counts the artwork types of the collection without "Inne", with tiers at 2, 3, 4, 5, 6 and 7 ([ADR-0229](0229-show-artwork-types-as-the-boncompagni-academy.md)). The type of an artwork is optional: `artworks.type_code` may be empty. Do artworks in the trash bring their type, and what do artworks without a type count?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- Every other exhibit leaves out artworks in the trash ([ADR-0230](0230-count-exhibitions-with-five-artworks-outside-the-trash.md)).

## Considered options

For the trash: only artworks outside the trash count; artworks in the trash count too, until deleted for good.

For artworks without a type: they add no type; the exhibit also says how many artworks have no type.

## Decision outcome

Chosen by the owner in ATL-584.

- Only artworks outside the trash bring their type, as in every other exhibit. Artworks saved before the release count.
- An artwork without a type adds no type, like "Inne", and the exhibit says nothing more about it.
- The exhibit stands third in "Sala główna", after "Księga Vasariego" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).

### Consequences

- Good: the trash means the same as in every other exhibit, and the count needs no new data.
- Bad: moving the only artwork of a type to the trash lowers the counter; a reached tier stays.

## More information

Built in ATL-584 in `20261109100000_boncompagni_academy_exhibit.sql`. In the owner's local collection of 292 artworks all seven types are present outside the trash, five artworks have no type and the one artwork in the trash is a sculpture.
