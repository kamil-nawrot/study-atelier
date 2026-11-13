# 0278. Let the closest view of the map grow until every group splits

- Status: accepted
- Date: 2026-11-13

## Context and problem statement

[ADR-0276](0276-group-close-cities-on-the-map-and-name-only-those-that-fit.md) joins close cities into a group that splits as the map zooms in, with the closest view at 64 times the whole map, and opens the largest city of a group that does not split at the closest view. On the owner's map, fitted to cities around the world, Rzym and Watykan (2.4 km apart) stay a few pixels apart at 64×, so the group never split and the 3 artworks of Watykan could not be reached ([ATL-706](https://linear.app/kamil-nawrot/issue/ATL-706)). How close must the map zoom?

## Decision drivers

- Every city can be clicked, as the owner chose in ADR-0276.
- A small map, such as one of Europe, does not zoom further than it needs.

## Considered options

- The closest view grows with the closest pair of cities, so that every pair stands apart, and is never below 64×
- A much larger fixed closest view (for example 4096×)
- A group that does not split opens a panel with all its cities

## Decision outcome

Chosen option: the first, a fix of the behaviour the owner chose in ADR-0276. The closest view is the zoom at which the closest pair of cities on the map stands apart (with the margin of 1.2), and at least 64×; it is counted again when the cities on the map change. Only cities on one point never split; a click on such a group still opens its largest city.

This decision supersedes the fixed closest view of 64× in ADR-0276.

### Consequences

- Good: every group splits on a click, however wide the map.
- Bad: on a map with two very close cities the wheel and "+" zoom far past any useful view of the land.

## More information

Bug [ATL-706](https://linear.app/kamil-nawrot/issue/ATL-706); `splitScale` in `apps/web/src/lib/map/map-groups/map-groups.ts`.
