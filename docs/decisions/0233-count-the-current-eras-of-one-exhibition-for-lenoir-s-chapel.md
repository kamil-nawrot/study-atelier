# 0233. Count the current eras of one exhibition for Lenoir's chapel

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

The hidden exhibit "Kaplica Lenoira" (`lenoir_chapel`) is unlocked by one exhibition with artworks of all six eras ([ADR-0231](0231-show-an-exhibition-through-all-six-eras-as-lenoir-s-chapel.md)). The artworks of an exhibition are the rows of `exhibition_artworks`, one per artwork however it is shown ([ADR-0211](0211-build-exhibitions-over-a-validated-document-and-a-trigger-written-index.md)). Which artworks bring their era, which era counts, and which exhibitions count?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- "Kryształowy Pałac" counts the artworks of an exhibition from the same index, close-ups and sets included, and leaves out the trash ([ADR-0230](0230-count-exhibitions-with-five-artworks-outside-the-trash.md)).

## Considered options

For the blocks: every artwork of the index, as an artwork, a close-up, a palette or in a set; only artwork blocks, which the index does not tell apart.

For the era: the current era of the artwork; the era it had when it was placed.

For the value: the number of exhibitions through all six eras; the largest number of eras in one exhibition, with the threshold at 6, as other hidden exhibits with a threshold count.

## Decision outcome

Chosen by the owner in ATL-586.

- An artwork brings its current era wherever it stands in the exhibition, as in "Kryształowy Pałac". Artworks in the trash and artworks without an era bring none.
- An exhibition in the trash, "Archiwum" in the app, does not count. Exhibitions saved before the release count.
- The value is the largest number of different eras in one exhibition, with one tier at 6. The exhibit stands second in the room "Pawilon", after "Kryształowy Pałac", and gives 50 points once like the other hidden exhibits.

### Consequences

- Good: the count reads the index the exhibitions already keep, with no new data, and the trash means the same as in every other exhibit.
- Bad: changing the era of an artwork or moving it to the trash can take an exhibition below six eras; the exhibit, once found, stays.

## More information

Built in ATL-586 in `20261108140000_lenoir_chapel_exhibit.sql`.
