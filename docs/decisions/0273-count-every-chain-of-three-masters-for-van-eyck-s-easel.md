# 0273. Count every chain of three masters for van Eyck's easel

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

The hidden exhibit "Sztaluga van Eycka" (`van_eyck_easel`) is found when the learner's authors hold a chain of three generations: A is the teacher of B, and B is the teacher of C ([ADR-0265](0265-show-three-generations-of-masters-as-van-eyck-s-easel.md)). Relations of the kind `pupil` are stored from the pupil to the teacher, one relation per pair of authors ([ADR-0259](0259-relate-artworks-and-authors-with-typed-relations.md)). Must the three authors have artworks in the atelier?

## Decision drivers

- A relation between authors is knowledge of art history in itself.
- Exhibits are counted from the learner's data and unlocked retroactively; a found hidden exhibit stays found ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).

## Considered options

- Every chain of three distinct authors counts.
- Only chains whose three authors have an artwork outside the trash count.

## Decision outcome

Chosen by the owner in ATL-695: every chain counts, whether or not its authors have artworks, as in "Sieć Arachne" ([ADR-0272](0272-count-relations-outside-the-trash-for-arachne-s-web.md)). The three authors are distinct; since a pair holds one relation, two authors cannot teach each other. The exhibit stands fifth in "Sala główna", after "Sieć Arachne", and gives the 50 points of a single-tier easter egg.

### Consequences

- Good: the learner can find the exhibit by recording a known line of masters, even before adding their artworks.
- Bad: merging two authors may break a chain; the found exhibit stays.

## More information

Built in ATL-695 in `20261112235000_van_eyck_easel_exhibit.sql`. Learners record relations between authors once ATL-682 ships.
