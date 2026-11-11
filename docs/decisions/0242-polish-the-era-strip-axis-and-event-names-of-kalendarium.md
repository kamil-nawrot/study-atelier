# 0242. Polish the era strip, the axis and the event names of Kalendarium

- Status: accepted; the era name under the strip on a phone is superseded by [0252](0252-overhaul-the-app-on-a-phone.md)
- Date: 2026-11-10

## Context and problem statement

The consistency audit of the views (ATL-596) listed small faults of the timeline's axis and strip (ATL-607):

- The era strip showed the eras in proportion above a minimum, with prehistory as wide as antiquity behind a break mark ([ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md), [ADR-0094](0094-name-the-timeline-kalendarium-and-simplify-its-header.md), [ADR-0097](0097-start-prehistory-at-the-oldest-entry-on-the-timeline.md)). It could not show the lengths faithfully anyway, and the break mark at its left edge read as a stray "‹".
- What is in view was framed on the strip in `--color-highlight`, the only such outline in the app.
- The name of the current era stood in medium weight, unlike the eras in Kartoteka.
- The line of an artwork's year span was as heavy as the dot, which carries the meaning.
- In prehistory and antiquity the labels of the centuries and millennia were too long for their segments and could not be read.
- Event names were often cut by the edge of the stage, especially at the edges of an era, where the margin outside the era covers them.

## Decision drivers

- The strip is a control to choose an era, not a chart.
- One look for one thing: the eras in Kartoteka and the current era over the stage.
- Every label on the stage is either readable or not shown.

## Decision outcome

Listed in ATL-607 by the owner:

- **Era strip.** Every era gets the same width; the break mark of prehistory and the frame of what is in view are gone. The current era stays filled.
- **Era name.** The name of the current era under the strip takes the look of the eras in Kartoteka: the title font in italics, `--font-size-2xl`, with more room above and below.
- **Span lines.** The line from an artwork's start year to its dot is a hairline (1 px).
- **Axis labels.** When the longest label of the era does not fit its century or millennium, only every 2nd, 5th, 10th, 20th, 50th or 100th one is labelled (the first that fits, counted from year 1), and its label spans that many segments. The lines across the stage stay at every century or millennium.
- **Event names.** A name that would run past the end of the era or the edge of the stage stands before its pin or ribbon instead of after it, when it fits there. A name inside a ribbon that starts before the visible part of the era moves into the visible part.

### Consequences

- Good: every era is equally easy to choose, and the strip has nothing that looks like text.
- Good: the axis is readable in prehistory and antiquity at every step.
- Bad: the strip no longer hints at how long the eras are; the stage shows it within each era.
- Bad: a name placed before its event can stand next to the end of another event in its lane, because lanes are packed with names after their events.

## More information

- Supersedes the strip's proportions, its break mark and its frame in [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md), [ADR-0094](0094-name-the-timeline-kalendarium-and-simplify-its-header.md) and [ADR-0097](0097-start-prehistory-at-the-oldest-entry-on-the-timeline.md), and the look of the era name in [ADR-0095](0095-filter-the-timeline-with-period-and-style-lanes.md). The rest of those decisions stands.
- Not done here: a switch in the filters that hides the span lines; ATL-607 left it open as a possible issue of its own.
- Issue: ATL-607, milestone 0.21.2.
