# 0299. Land Giotto's fly now and then on the artwork image

- Status: accepted; how often the fly lands and how it looks are superseded by [0304](0304-land-giotto-s-fly-on-one-in-100-openings-as-a-fly-silhouette.md)
- Date: 2026-11-15

## Context and problem statement

The hidden exhibit "Mucha Giotta" is found by swatting a small painted fly that now and then sits on the image of an artwork ([ADR-0297](0297-show-a-swatted-painted-fly-as-giotto-s-fly.md)). The design left the build open: how often and where the fly appears, how it looks and behaves, what assistive technology hears, and how the find is recorded. The owner asked for the version to be built without waiting for decisions, with every assumption noted for a later review.

## Decision drivers

- An easter egg should be rare enough to be spotted, not stumbled over at every visit, and should never get in the way of looking at the image, the pins or the loupe.
- A learner who already has the record makes no further request, as for "Nocny lichtarz" and "Soczewka znawcy" ([ADR-0212](0212-record-the-first-switch-to-the-light-theme-at-night.md), [ADR-0214](0214-record-the-first-hour-on-one-artwork-and-rename-its-exhibit.md)).
- Exhibits are counted in the database and a found exhibit stays found ([ADR-0160](0160-gamify-learning-as-a-museum-career.md), [ADR-0296](0296-skip-counting-hidden-exhibits-already-found.md)).

## Considered options

For how often: on every opening of the artwork view; at random on one in 20 openings; at random on one in 50; once a day.

For where: only on the stage of the artwork view; also on the wall, in the review or in an exhibition.

For the behaviour: a still fly that flies off when swatted; a fly that also crawls or flies off by itself after a while.

## Decision outcome

Assumed in ATL-760 and confirmed by the owner in the review of 0.24.

- The fly lands at random on one in 20 openings of an artwork, decided again when the view moves to another artwork. It sits only on the stage of the artwork view and only when an image is shown, own or linked, never on an artwork without an image, the wall, the review or an exhibition.
- It is a small drawn fly, about the size of a real one on the screen, at a random place between 20 % and 80 % of the width and height of the image, turned at a random angle. It does not move until it is swatted.
- It is a button named "Odgoń muchę", so the keyboard and a screen reader reach it like any other button on the stage. A click or a tap swats it: it flies off up and to the side and disappears; with reduced motion it only disappears.
- The swat sets `giotto_fly_at` on the profile once through `record_giotto_fly()`. The own profile says whether it is recorded; then the fly lands no more. A failed record is tried again with the next fly. The career is refreshed right after the record, unless it is hidden, so the menu icon flashes.
- `giotto_fly` counts a recorded swat, has one tier, gives 50 points once as an easter egg and stands third in "Krypta", after "Paszcza prawdy" and "Nocny lichtarz". Nothing was recorded before the release, so nothing before it counts.

### Consequences

- Good: one nullable column and one call in a learner's life; nothing is drawn or requested for a learner who has found the fly.
- Good: the fly is a real button, so the exhibit is not closed to a learner who does not use a mouse.
- Bad: the fly is dark, so on a dark image it is hard to see; the hint says "Zazwyczaj" anyway.
- Bad: a learner may find it in the first few visits or only after many; the chance is the same at every opening.

## More information

Designed in ATL-757 ([ADR-0297](0297-show-a-swatted-painted-fly-as-giotto-s-fly.md)); built in ATL-760. The WebP images of the engraving come from `exhibit-art publish --only giotto_fly`.
