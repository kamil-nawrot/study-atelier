# 0331. Show the event names of Kalendarium only where they fit

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

The event band of Kalendarium packs events into at most four lanes, three on a narrow screen, counting each name after its event ([ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md)). Since [ADR-0242](0242-polish-the-era-strip-axis-and-event-names-of-kalendarium.md) a name that would run past the end of the era or the stage stands before its event, but the packing does not count it there, so it covers the event before it in its lane, for example "Wojna o sukcesję hiszpańska" over "I rozbiór Polski". A ribbon cut by the edge of the stage also kept its name inside although the visible part was shorter than the name. Events that found no lane were hidden behind "+n". The owner asked to rethink the layout of the names thoroughly ([ATL-831](https://linear.app/kamil-nawrot/issue/ATL-831)).

## Decision drivers

- Two names never overlap, and a name never covers another event.
- Every event of the era in view can be seen and opened.
- The band stays low enough to leave the stage to the artworks.
- Every label on the stage is either readable or not shown ([ADR-0242](0242-polish-the-era-strip-axis-and-event-names-of-kalendarium.md)).

## Considered options

- More lanes and honest packing: the packing counts the name before its event, up to six lanes, the rest behind "+n".
- Every event shown, a name only where it fits, as the names of cities on the map ([ADR-0276](0276-group-close-cities-on-the-map-and-name-only-those-that-fit.md)).
- The same, with a name that does not fit cut with an ellipsis to the free room.

The three were prototyped on 25 events of the early modern era; the screenshots are in ATL-831.

## Decision outcome

Chosen option: "Every event shown, a name only where it fits", because it hides no event, keeps the band at its height and follows a pattern the app already uses.

- The number of lanes still follows the events of the era with their names, up to four (three on a narrow screen), and does not change within an era.
- Within these lanes the events are spread: each event goes to the lane where its shape has room and the previous name leaves the most room for its own. An event goes behind "+n" only when its shape has room in no lane.
- A name stands inside its ribbon when the drawn part of the ribbon holds it; otherwise after the event, otherwise before it, and only where it overlaps no other event or name of its lane and stays inside the visible part of the era. The names of a lane are placed from the earliest event.
- An event without room for its name shows only its pin or ribbon. Its name appears in a tooltip on hover, and its button keeps the full name and date for screen readers. Zooming in gives the names more room, so more of them appear.
- On a phone nothing changes: the band shows only the shapes and the names stand at the reading line ([ADR-0252](0252-overhaul-the-app-on-a-phone.md)).

### Consequences

- Good: names no longer overlap anything, and every event is visible at every step.
- Good: the layout of the names is a pure function with unit tests.
- Bad: in a crowded era some events show no name until the learner hovers or zooms in.
- Bad: a name can appear or disappear while the stage is panned, when an edge of the stage changes its room.

## More information

- Design: [ATL-831](https://linear.app/kamil-nawrot/issue/ATL-831); build: [ATL-834](https://linear.app/kamil-nawrot/issue/ATL-834).
- Supersedes the packing of names into lanes and the "+n" for every event without a lane in [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md), and the rule of [ADR-0242](0242-polish-the-era-strip-axis-and-event-names-of-kalendarium.md) that puts a name before its event only near the end of the era or the stage. The rest of those decisions stands.
