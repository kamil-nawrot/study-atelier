# 0319. Zoom into a large group of cities and fan out a small one on a backdrop

- Status: accepted
- Date: 2026-11-17

## Context and problem statement

A click on a group of close cities fans its cities out on a ring around the group ([ADR-0278](0278-fan-out-a-group-of-close-cities-on-the-map.md)). On the owner's map a group over Poland holds about twenty cities. Its fan crosses the other circles of the map. Its cities stand on the ring from the largest at the top, so the hairlines to their places cross one another ([ATL-802](https://linear.app/kamil-nawrot/issue/ATL-802)). How should a click on a group stay readable, however many cities it holds?

## Decision drivers

- A fan reads at a glance: few cities, no crossing lines, clearly apart from the rest of the map.
- Every city stays reachable, also when the closest view cannot split a group (Rzym and Watykan, [ATL-706](https://linear.app/kamil-nawrot/issue/ATL-706)).
- The usual pattern of clustered maps: a click on a large cluster zooms in, a click on a small one or at the closest view spreads it out.

## Considered options

1. What a click on a large group does: fan it out as today; zoom in to the group's area so it splits.
2. Where the cities of a fan stand: from the largest at the top; on the side of the ring towards their own place.
3. How the fan stands apart from the map: as today; the other circles faded; also a partly transparent disc under the fan.
4. The lines of a fan: to each city's own place; to one point in the middle of the group; none, with the area of the group outlined.

The mockups are in ATL-802.

## Decision outcome

Chosen by the owner on 2026-11-17: zoom into a group of more than 6 cities on every screen (rather than 10 on a larger one), cities towards their place, the other circles faded and a disc under the fan, lines to each city's place.

1. **A large group zooms in.** A click on a group of more than 6 cities, on any screen, zooms the map to the area of the group's cities, as far as the closest view of 16×, and it splits into smaller groups and single cities. No fan opens.
2. **A small group fans out.** A click on a group within the threshold, or on any group the closest view does not split, fans it out as in ADR-0278.
3. **Cities towards their place.** The cities of a fan take the places of the ring in the order of the direction from the group's centre to their own place, turned so that each stands as close as it can to that direction. The hairlines then rarely cross.
4. **Apart from the map.** While a fan is open, the other circles and names of the map fade to a quarter, and a partly transparent disc of the map's background lies under the fan, a little wider than the ring.
5. **In view.** A fan that would reach past the edge of the map moves the map so that the whole fan shows.

The fan still folds on a click on the map, a drag, a pinch, the wheel and the "+" and "−" buttons. The name of a large group for assistive technology ends with "Przybliż miasta" instead of "Pokaż miasta osobno".

This decision supersedes the fan of every group in ADR-0278 and its ring ordered from the largest city.

### Consequences

- Good: a fan holds at most 6 cities, and its lines rarely cross.
- Good: the map behaves like other clustered maps, and the zoom shows where the cities of a large group lie.
- Bad: a city of a large group is two or more clicks away.
- Bad: with the other circles faded, the map around an open fan cannot be read until it folds.

## More information

- Linear: ATL-802 (design), ATL-803 (build). Requirement R-320.
- Partly supersedes [ADR-0278](0278-fan-out-a-group-of-close-cities-on-the-map.md).
