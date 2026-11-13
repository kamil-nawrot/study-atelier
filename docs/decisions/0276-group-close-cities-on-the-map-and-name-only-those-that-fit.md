# 0276. Group close cities on the map and name only those that fit

- Status: accepted; the zoom on a click on a group and the closest view of 64× are superseded by [0278](0278-fan-out-a-group-of-close-cities-on-the-map.md)
- Date: 2026-11-13

## Context and problem statement

On the first try of the map of places ([ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md)) the owner found that the circles of close cities overlap, so one of them cannot be clicked (Rzym and Watykan, about 3 km apart), that the circles are too big, and that a name under every circle makes the map busy. How should close cities and their names be shown?

## Decision drivers

- Every city can be reached with a click.
- The map stays quiet: few names, small circles.
- The names that are shown are the cities that matter most to the collection.

## Considered options

Close cities:

- Group overlapping circles into one circle with the sum, and a click on it zooms in until the cities split
- Group them, and a click on the group opens a panel listing all its cities

Names:

- Name the cities with the most artworks while their names cross no other name and no circle; the others on hover or focus; the chosen city always
- Names only on hover or focus, and of the chosen city
- No names until the map is zoomed in past a set level, then all names

## Decision outcome

Chosen by the owner on 2026-11-13 in [ATL-705](https://linear.app/kamil-nawrot/issue/ATL-705): the first option of each.

**Groups.** At every zoom level, circles closer than the sum of their radii and 4 px are joined, the larger city first, into one circle at the place of the largest, with the sum of their artworks, gold when an artwork of any of them was seen in person, and no name. Its name for assistive technology lists the cities, the count and "Przybliż, żeby rozdzielić miasta". A click zooms in on the group and centres it, far enough for its closest pair to stand apart (with a margin of 1.2), at least by one step of the "+" button. Zooming out joins the cities again. The closest view is 64 times the whole map instead of 16, so towns a few kilometres apart can split. At the closest view a group that still does not split opens its largest city.

**Size.** A circle has a radius of 9 + 1.5·√n px (7 + 1.2·√n px on a phone) for n artworks, instead of 11 + 5·√n (8 + 3.5·√n): 21 px across for one artwork, 39 px for fifty.

**Names.** Going from the chosen city, then the city with the most artworks down, a city gets its name under its circle when the name crosses no name already placed and no other circle. Zooming in leaves room for more names. The others show their name on hover and keyboard focus. A group has no name. The width of a name is estimated from its number of letters, not measured.

**Close button.** The close button of the city panel is a borderless `IconButton` (the new `plain` variant) with the `x` icon at the size of the fold button of `PanelHeader`. The city panel closes rather than folds, so it keeps `x`.

The 4 px gap, the margin of 1.2, the closest view of 64 and the radius formulas are arbitrary values, chosen on the owner's collection and open to change after a try.

This decision supersedes the part of ADR-0260 that puts the city name under every circle.

### Consequences

- Good: every city can be clicked, at worst after a click on its group.
- Good: the map shows the names of the cities that matter most, and more as it zooms in.
- Bad: a city in a group has no visible name until the group splits.
- Bad: groups and names are counted again on every step of a zoom or a drag, which is cheap for the tens of cities of a collection but grows with the square of their number.

## More information

Fixes found in [ATL-705](https://linear.app/kamil-nawrot/issue/ATL-705) after the build of the map in [ATL-685](https://linear.app/kamil-nawrot/issue/ATL-685). The logic is in `apps/web/src/lib/map/map-groups/map-groups.ts`.
