# 0304. Land Giotto's fly on one in 100 openings as a fly silhouette

- Status: accepted
- Date: 2026-11-15

## Context and problem statement

[ADR-0299](0299-land-giotto-s-fly-now-and-then-on-the-artwork-image.md) assumed that the fly lands on one in 20 openings of the artwork view and drew it with a long, narrow body and wings spread to the sides. In the review of 0.24 the owner found the fly too frequent, because artworks are opened all the time and not only once after they are added, and found that it looked like an ant.

## Decision drivers

- An easter egg should stay a surprise for a learner who opens artworks every day.
- At its real size on the screen the fly must read as a fly and should not draw the eye away from the artwork.

## Considered options

For how often: one in 50 openings; one in 100; one in 200.

For the look: a house fly with a striped grey thorax, red eyes and veined wings; a dark silhouette with translucent wings; the house fly with highlights like a painted trompe-l'oeil fly.

## Decision outcome

Chosen by the owner: one in 100 openings, and the dark silhouette, because it is the least conspicuous.

- The fly lands at random on one in 100 openings of an artwork. Everything else about when and where it lands stays as in ADR-0299.
- It is drawn as a sitting fly seen from above, the same size as before: a short head, a broad thorax, a short abdomen, six short legs and broad translucent wings folded back over the abdomen, all in the dark colour of the stage.

### Consequences

- Good: the fly reads as a fly and stays quiet on the image.
- Bad: the fly is five times rarer, so a learner may need many visits before finding it.
- Bad: as before, it is hard to see on a dark image.
