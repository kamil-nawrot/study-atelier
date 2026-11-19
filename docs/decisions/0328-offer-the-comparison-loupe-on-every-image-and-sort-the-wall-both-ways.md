# 0328. Offer the comparison loupe on every image and sort the wall both ways

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

The owner found three rough edges in Atelier and Porównanie after using 0.25. The loupe of "Porównaj" stays dimmed for an image less than 1.5 times wider than shown, though the artwork view offers it there at 1.5× ([ADR-0261](0261-offer-the-loupe-on-every-image-of-the-artwork-view.md)). The order "Według daty powstania" goes only from the oldest. The popover "Grupowanie" is as wide as its hint, not as its three levels. The caption under an artwork in the comparison is not centred when the line of the author and the date wraps.

## Decision outcome

- The comparison loupe is offered for every image whose size is known and that can be loaded into it, as in the artwork view: an image less than 1.5 times wider than shown keeps the loupe at 1.5×. The wheel of the comparison zooms in proportion to its movement ([ADR-0323](0323-zoom-the-loupe-in-proportion-to-the-wheel-movement.md)).
- The order of the wall by the date of creation is two options, "Od najstarszych" and "Od najnowszych"; a year span is ordered by its end and artworks without a year come last in both. The choice is kept on the device as before.
- The popover "Grupowanie" is as wide as its three levels and the hint below wraps to a second line.
- The author and date line of a comparison caption is centred when it wraps.

This supersedes the comparison loupe "only for an image 1.5 times wider than shown" in ADR-0110.

### Consequences

- Good: the loupe works the same in the artwork view and in the comparison.
- Bad: on a very small image the loupe shows a blurred enlargement; the owner accepted it in the artwork view already.
- Bad: "Od najnowszych" next to "Ostatnio dodane" can be read as the same order; the labels are the owner's wording.

## More information

- Issue [ATL-818](https://linear.app/kamil-nawrot/issue/ATL-818).
