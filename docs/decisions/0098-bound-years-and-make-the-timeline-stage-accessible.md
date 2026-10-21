# 0098. Bound the years and make the timeline stage accessible

- Status: accepted
- Date: 2026-10-21

## Context and problem statement

The code review of 0.7 (ATL-238) found three things that needed the owner's decision:

- The whole timeline stage had the `slider` role. A slider's children are presentational, so assistive technology could hide the artwork dots and the event buttons inside it.
- The line above the stage ("1640 · w tym czasie: …") was a live region that changed on every animation frame and every pixel of panning, so a screen reader announced a stream of years.
- Years had no upper bound. A year such as 3 000 000 000 passed the forms and failed in the database with a generic error.

## Decision drivers

- Every dot and event can be reached and named by assistive technology.
- A screen reader announces where the learner stopped, not every step on the way.
- Bounds that hold every real date in art history and in planned works, and nothing absurd.

## Decision outcome

Chosen by the owner (ATL-238):

- **Slider.**
  - The `slider` role moves to the reading line's year label. The label takes the focus, and the arrow keys and "+"/"−" work on it.
  - The stage is a plain `group` named "Oś czasu", whose dots and events are ordinary buttons.
  - Pressing on the empty stage focuses the year label, so the keys work right after a drag.
  - Escape anywhere on the stage still clears the selection.
- **Live text.** The line above the stage still changes as the view moves. Its copy for screen readers updates half a second after the view stops.
- **Year bounds.** A year before the common era goes back at most to 3 000 000 BCE ("Rok przed naszą erą może sięgać najwyżej 3 000 000 p.n.e."). A year of the common era goes up to 2500 ("Rok nie może być późniejszy niż 2500."), so a building project with a planned end date fits. The bounds apply to artworks, events and the life years of authors. A Wikidata date outside them is not suggested.
- **Future entries.** Because events may now end in the future, the contemporary era ends at the latest dated entry when that is after the current year, the same way prehistory starts at the oldest one ([ADR-0097](0097-start-prehistory-at-the-oldest-entry-on-the-timeline.md)).

### Consequences

- Good: screen readers reach every item on the stage and hear calm announcements.
- Good: absurd years get a clear field error instead of a generic one.
- Bad: the keyboard focus ring sits on the small year label rather than around the stage.

## More information

- Changes the stage role described with [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md); the rest stands.
- Issue: ATL-238, milestone 0.7.
