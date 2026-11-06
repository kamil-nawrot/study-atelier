# 0195. Count an image full of pins from the pins it holds now

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

The hidden exhibit "Pinakoteka motyli" (`pinacotheca`) is unlocked by an image of an artwork with the most pins allowed ([ADR-0193](0193-show-an-image-full-of-pins-as-a-butterfly-pinacotheca.md)); an image takes at most 10 pins (`MAX_PINS_PER_IMAGE`, the `artwork_pins_limit_per_image` trigger). Pins and images are deleted for good, while an artwork goes to the trash and can be restored. How is it counted, where does it stand in the display case, and when does the learner see it?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- The other exhibits about images, such as "Własne oko", count only artworks outside the trash.
- A hidden exhibit is found where the learner earns it, as "Paszcza prawdy" flashes the menu icon right after a sent idea ([ADR-0187](0187-reward-a-sent-idea-with-a-hidden-exhibit.md)).

## Considered options

For the trash: count only images of artworks outside the trash; count every image of the learner.

For the place: at the end of the display case, after "Paszcza prawdy"; next to "Własne oko".

For when it shows: on the next career refresh (a view change once the career is stale, or a reload); right after the pin that fills an image.

## Decision outcome

Chosen by the owner in ATL-533.

- `pinacotheca` counts the most pins on one image of an artwork outside the trash. It has one tier, at 10, and gives 50 points once as an easter egg, like the other hidden exhibits.
- Only the pins an image holds now count, because deleted pins leave no trace: a learner who went down from 10 pins to 9 before the release gets the exhibit only on reaching 10 again. Once unlocked, it stays.
- An image of an artwork in the trash does not count; it counts again once the artwork is restored.
- It stands at the end of the display case, after "Paszcza prawdy". The place only orders the case and is not stored, so later exhibits can renumber it.
- The career is refreshed right after a new pin fills an image, so the menu icon flashes while the learner is still on the image. A saved pin did not mark the career as stale, so without it the exhibit would show only after 10 minutes or a reload. Other pin saves do not refresh it.

### Consequences

- Good: no new column, table or backfill; the exhibit counts the pins table as it is.
- Good: the count stays true if the limit of pins changes, with only the threshold to move.
- Bad: a learner who filled an image before the release and later removed a pin does not get the exhibit until filling an image again.

## More information

Designed in ATL-525 ([ADR-0193](0193-show-an-image-full-of-pins-as-a-butterfly-pinacotheca.md)); built in ATL-533.
