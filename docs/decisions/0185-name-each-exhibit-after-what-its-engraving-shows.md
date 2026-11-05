# 0185. Name each exhibit after what its engraving shows

- Status: accepted
- Date: 2026-11-04

## Context and problem statement

The exhibits of the display case are named as objects or places ([ADR-0160](0160-gamify-learning-as-a-museum-career.md), `voice-and-tone.md`), but three names broke the pattern: "Strzała Vinkelesa" named the engraver, "Klepsydra z „Melancholii I”" the title of the work, and "Mona Lisa" only the title of a painting. The descriptions of the exhibits were rewritten at the same time to say who made each engraving (ATL-490), so the names no longer need to.

## Decision drivers

- One pattern for every name: an object or a place, then whose or where it is.
- The name speaks of what the engraving shows; the engraver and the title of the work belong to the description and the credit.

## Considered options

- "Strzała putta" or keeping "Strzała Vinkelesa".
- "Klepsydra melancholii", "Klepsydra melancholika" or keeping "Klepsydra z „Melancholii I”".
- "Uśmiech Mony Lisy" or keeping "Mona Lisa".
- "Camera obscura rysownika" or keeping "Camera obscura z Encyklopedii".

## Decision outcome

Chosen by the owner in ATL-490: "Strzała putta", "Klepsydra melancholii" and "Uśmiech Mony Lisy"; "Camera obscura z Encyklopedii", "Praski orloj" and "Straż nocna" stay as they are. The second part of a name is lower case unless it is a proper name.

### Consequences

- Good: every name reads in one pattern and points at the engraving's content.
- Bad: learners who saw the old names in 0.15–0.18 meet new ones for the same exhibits.

## More information

- Issue ATL-490; the descriptions of the exhibits, rewritten in the same issue.
