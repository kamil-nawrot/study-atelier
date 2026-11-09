# 0210. Count described values with a summary or notes of any text

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The tiered exhibit "Ogród Clifforta" (`hortus_cliffortianus`) counts the values of the card index described with a summary or notes, with tiers at 1, 10, 25, 50, 100 and 500 ([ADR-0202](0202-show-described-values-as-cliffords-garden.md)). A value can be added in the card index without artworks or keep only artworks in the trash, notes can hold only blank lines, and two values can be merged. How is it counted and where does it stand?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- The rule should match what the learner sees elsewhere in the app, so that the exhibit is found where it is earned.

## Considered options

For values without artworks: they count; they do not.

For a short description: any text that is not blank counts; a minimum length.

For the place: right after "Biblioteka w Lejdzie", before "Camera obscura z Encyklopedii"; at the end of the tiered exhibits.

## Decision outcome

Chosen by the owner in ATL-551.

- `hortus_cliffortianus` counts the authors, periods, styles, materials, places and eras whose summary or notes hold any character other than white space. The values of own fields have no description and do not count.
- A value counts whether it has artworks, only artworks in the trash or none: the exhibit rewards describing, not collecting. There is no minimum length; a learner has no one to fool but themselves, and a threshold of length would be a guess.
- Merged values count from the current state, so a merge of two described values lowers the count by one; tiers stay unlocked.
- It stands right after "Biblioteka w Lejdzie", before "Camera obscura z Encyklopedii", next to the other exhibit of descriptive work. The place only orders the case and is not stored.
- The career is refreshed on the next view change after the save, which already marks it as stale; no extra refresh is needed.

### Consequences

- Good: the count follows the card index as it is, with no new data.
- Bad: a summary of one character counts as a description.

## More information

Built in ATL-551 together with the four other exhibits of 0.21 in one migration, `20261107090000_five_exhibits_of_0_21.sql`, since each exhibit migration replaces `private.exhibit_values` and `private.unlock_exhibits_for` as a whole.
