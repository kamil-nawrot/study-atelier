# 0230. Count exhibitions with five artworks outside the trash

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

The tiered exhibit "Kryształowy Pałac" (`crystal_palace`) counts the exhibitions with at least 5 artworks, with tiers at 1, 3, 5, 10 and 25 ([ADR-0220](0220-show-exhibitions-as-the-crystal-palace.md)). The artworks of an exhibition are the rows of `exhibition_artworks`, written by a trigger from the document on every save ([ADR-0211](0211-build-exhibitions-over-a-validated-document-and-a-trigger-written-index.md)): one row per artwork, however many blocks show it, and the row stays while the artwork is in the trash. An exhibition in the trash keeps its rows too. What counts as an artwork of an exhibition, does an exhibition in the trash count, and where does the exhibit stand?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- The other exhibits leave out artworks in the trash, so the rule should match them.

## Considered options

For the artworks: the artworks of the collection outside the trash; every row of `exhibition_artworks`, the trash included.

For exhibitions in the trash: they do not count; they count.

For the place: at the end of the tiered exhibits, after "Camera obscura z Encyklopedii" and before the hidden ones; at the end of the display case.

## Decision outcome

Chosen by the owner in ATL-566.

- An exhibition counts when at least 5 different artworks of the collection outside the trash stand in it. An artwork shown in several blocks, as a close-up or in a set counts once, as it has one row; a linked image is not an artwork of the collection and does not count. An artwork moved to the trash stops counting and counts again when restored.
- An exhibition in the trash does not count.
- It stands after "Camera obscura z Encyklopedii", the last tiered exhibit, before the hidden ones. The place only orders the case and is not stored.

### Consequences

- Good: the count reads the index the exhibitions already keep, with no new data.
- Good: the trash means the same here as in every other exhibit.
- Bad: moving one artwork to the trash can take an exhibition below 5; a tier already unlocked stays.

## More information

Built in ATL-566 in `20261108120000_crystal_palace_exhibit.sql`, which replaces `private.exhibit_values` and moves the hidden exhibits one place down.
