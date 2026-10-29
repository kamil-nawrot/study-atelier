# 0100. Show the artworks at the reading line under the stage

- Status: accepted
- Date: 2026-10-21

## Context and problem statement

With the filter switch "Dzieła w linii czytania", ADR-0095 added the artworks of the reading line's year to the line above the timeline ("· dzieła: Straż nocna, Ekstaza św. Teresy (+3)"). While panning, that line grew, shrank and wrapped onto a second line, so the stage under it moved up and down under the pointer (ATL-245). The event card also opens under the stage, so the new place had to fit with it.

## Decision drivers

- Nothing above the stage changes height while the learner pans.
- The artworks at the reading line stay visible while an event's card is open.

## Decision outcome

Chosen by the owner (ATL-245):

- The line above the stage names only the year and the events ("1640 · w tym czasie: …").
- With the switch on, a row of one line stands directly under the stage, and the event card under it:
  - "W linii czytania:" followed by up to three titles, the nearest to the reading line first;
  - the titles are buttons that choose the artwork, as in the event card;
  - titles that do not fit are shortened, and the rest are counted as "(+3)";
  - with no artwork there, it reads "W linii czytania nie ma dzieł.", so the row keeps its height.

### Consequences

- Good: the stage stays still while panning, and the event card below no longer moves.
- Good: the titles can be chosen, not only read.
- Bad: on a phone the row is below the tall vertical stage, so it needs a scroll to be seen.

## More information

- Changes the reading line text of [ADR-0095](0095-filter-the-timeline-with-period-and-style-lanes.md); the rest of ADR-0095 stands.
- Issue: ATL-245.
