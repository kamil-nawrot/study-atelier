# 0278. Fan out a group of close cities on the map

- Status: accepted
- Date: 2026-11-13

## Context and problem statement

[ADR-0276](0276-group-close-cities-on-the-map-and-name-only-those-that-fit.md) joins close cities into a group, and a click on it zooms in until the cities split, up to 64 times the whole map. On the owner's map, fitted to cities around the world, Rzym and Watykan (2.4 km apart) stay a few pixels apart even at 64×, so the group never split and the 3 artworks of Watykan could not be reached ([ATL-706](https://linear.app/kamil-nawrot/issue/ATL-706)). Zooming in far enough would take several hundred times, which shows nothing useful of the land. How should the cities of a group become reachable?

## Decision drivers

- Every city can be clicked.
- Zooming stays a way to look at the map, not a way to reach a city.

## Considered options

- A click on a group fans its cities out around it at once, ignoring their exact places
- A click zooms in up to a sensible level, and a further click fans the group out
- From a set zoom, overlapping circles are always pushed apart

## Decision outcome

Chosen by the owner on 2026-11-13: the first option.

A click on a group leaves the map where it is and fans its cities out on a ring around the group's place, the largest at the top, each with its own circle and name, and with a hairline from it to a dot at its own place. The ring is wide enough for the widest circle or name of the group. A city of the fan opens its panel as any city does. The fan folds on a click on the map, a drag, a pinch, the wheel and the "+" and "−" buttons; it also goes when the group changes, for example under another filter. The name of a group for assistive technology ends with "Pokaż miasta osobno".

The closest view returns to 16 times the whole map, as before ADR-0276.

This decision supersedes the zoom on a click on a group and the closest view of 64× in ADR-0276.

### Consequences

- Good: every city of a group is one click away, however wide the map.
- Good: the zoom keeps its plain meaning.
- Bad: a fanned city stands where it is not; the line to its place is the only hint.

## More information

Bug [ATL-706](https://linear.app/kamil-nawrot/issue/ATL-706); `fanOut` in `apps/web/src/lib/map/map-groups/map-groups.ts` and `CityFan`.
