# 0322. Add the artwork relation "Znajduje się w"

- Status: accepted
- Date: 2026-11-17

## Context and problem statement

The fixed list of artwork relations ([ADR-0259](0259-relate-artworks-and-authors-with-typed-relations.md)) has `part` for a work that is a component of another, such as a wing of an altarpiece. A fresco or a painting in a chapel, or a sculpture in a building, that is itself an artwork is in the other work without being its part. The owner asked for a type for it in 0.25 ([ATL-807](https://linear.app/kamil-nawrot/issue/ATL-807)).

## Decision drivers

- A record says where a work is when that place is an artwork of the atelier.
- The other types keep their meaning.

## Considered options

- Use `part` for it.
- A new directed type `inside`.

## Decision outcome

Chosen by the owner on 2026-11-17: a new directed type `inside`, after `part` in the list.

| Code     | Records  | One end (`from`)                | Other end (`to`)        |
| -------- | -------- | ------------------------------- | ----------------------- |
| `inside` | artworks | the contained: "Znajduje się w" | the place: "Ma w sobie" |

The relation questions of the review ask "W jakim dziele znajduje się …?" and "Które dzieło znajduje się w dziele …?", like the other directed types ([ADR-0301](0301-ask-about-relations-in-the-review.md)).

### Consequences

- Good: a work in a chapel, a church or a palace that is an artwork links to it in its own words.
- Bad: the line between `part` and `inside` is the learner's call; a fresco painted on the wall of a chapel can be read either way.

## More information

- Linear: ATL-807. Changes R-250.
- Related idea: ATL-712, a building that is an artwork and the place it houses.
