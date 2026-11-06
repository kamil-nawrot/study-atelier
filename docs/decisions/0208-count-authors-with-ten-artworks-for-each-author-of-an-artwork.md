# 0208. Count authors with ten artworks for each author of an artwork

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The tiered exhibit "Księga Vasariego" (`vasari_lives`) counts the authors with at least 10 artworks in the collection, with tiers at 1, 3, 5, 10 and 20 ([ADR-0198](0198-show-authors-with-many-artworks-as-vasaris-book.md)). An artwork can have several authors or be marked "autor nieznany", it can go to the trash, and two authors can be merged in the card index. How is it counted and where does it stand?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- The rule should match what the learner sees elsewhere in the app, so that the exhibit is found where it is earned.

## Considered options

For an artwork of several authors: it counts for each of them; it counts for none; it counts for the first author only.

For the place: right after the six era exhibits, before "Pracownia Świętego Hieronima"; at the end of the tiered exhibits.

## Decision outcome

Chosen by the owner in ATL-548.

- `vasari_lives` counts the authors with at least 10 artworks outside the trash. An artwork with several authors counts for each of them, as the card index shows it under each; an artwork marked "autor nieznany" has no author and counts for none.
- Merged authors count from the current state, so a merge may cross the threshold. An artwork in the trash does not count; the collection before the release counts, and a lower count later takes no tier back.
- With the owner's collection (Leonardo 18 artworks, van Gogh 13), the first tier comes at once and the second with the tenth artwork of Michelangelo.
- It stands right after the six era exhibits, before "Pracownia Świętego Hieronima", since it also counts the artworks of the collection, in depth. The place only orders the case and is not stored.
- The career is refreshed on the next view change after the save, which already marks it as stale; no extra refresh is needed.

### Consequences

- Good: the count follows the card index, so the learner can check it on the author's page.
- Bad: workshop pieces credited to a master and his assistants raise the count of every one of them.

## More information

Built in ATL-548 together with the four other exhibits of 0.21 in one migration, `20261107090000_five_exhibits_of_0_21.sql`, since each exhibit migration replaces `private.exhibit_values` and `private.unlock_exhibits_for` as a whole.
