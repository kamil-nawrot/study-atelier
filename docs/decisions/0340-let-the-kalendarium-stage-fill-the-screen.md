# 0340. Let the Kalendarium stage fill the screen

- Status: accepted
- Date: 2026-11-22

## Context and problem statement

On a larger screen the stage of Kalendarium had a height built from its content: the axis, the event band and 300 px for the artworks, with every period or style lane ([ADR-0095](0095-filter-the-timeline-with-period-and-style-lanes.md)) at least 72 px. With five lanes the stage grew to 360 px of artworks and ran past the bottom of the screen, and without lanes it ended in the middle of a tall screen. The filter tags above it wrapped into a second line, so adding a filter moved the axis down. On a phone the vertical stage already reached the bottom bar, measured from its top since 0.22. The owner asked to design and try a stage that fills the screen ([ATL-842](https://linear.app/kamil-nawrot/issue/ATL-842)).

## Decision drivers

- The axis stands in the same place whatever filters are chosen.
- The timeline uses the whole screen: on a time axis, width is the resolution of the years.
- The idea should carry over to the Atelier wall later.

## Considered options

Stage:

- A: the stage reaches the bottom of the page within the width of the content.
- B: the same, and the stage spans the whole content area, from the menu to the right edge (bleed).
- Keep the stage as it is.

Filter tags that do not fit in one line:

- 1: the row scrolls sideways, fading at its edge.
- 2: full tags, and those that do not fit collapse into "+n", which opens the filters.
- 3: tags without the name of their field, and "+n" for the rest.

The options were mocked on the real view with five lanes and two authors, at 1440 px, 1920 px and on a phone; the screenshots are in ATL-842.

## Decision outcome

Chosen options: "B" and "2", because the bleed gives the axis about 40% more width on a 1920 px screen, and full tags keep the name of their field while a sideways scroll stays hidden from a mouse.

- **Height.** From 768 px the stage reaches the bottom edge of the page. The artworks take the room left after the axis and the event band, at least 160 px; the period and style lanes share it equally, each at least 36 px. Both minimums are arbitrary and matter only on a very low window, where the page then scrolls.
- **Width.** The stage, with the event panel beside it, spans the whole content area at every width; the lead, the era strip and the step buttons keep the width of the content. On a phone the vertical stage reaches the edges of the screen.
- **Filter tags.** The tags stand in a row of one line above the stage, reserved also while no filter is on, so the axis does not move. Tags that do not fit, counted from the end, collapse into "+n" before "Wyczyść filtry"; "+n" opens the filter panel, on a phone the filter dialog.
- **Atelier.** The same pattern is to be tried on the Atelier wall later, in an issue of its own.

### Consequences

- Good: the axis keeps its place when filters change, and the stage uses the whole screen.
- Good: the filter tags never take more than one line.
- Bad: on a laptop of 900 px the lead, the era strip and the steps take the upper half of the screen, so the stage has about 470 px.
- Bad: with many lanes on a low screen a lane is only 36 px high, so its dots stand closer.

## More information

- Design: [ATL-842](https://linear.app/kamil-nawrot/issue/ATL-842); build: [ATL-844](https://linear.app/kamil-nawrot/issue/ATL-844); requirement R-331.
- The former heights (300 px of artworks, a lane of at least 72 px) were set in the code only, so no earlier decision is superseded.
- The text of "+n" for screen readers and its tooltip is "Pokaż wszystkie filtry, jeszcze {n}", agreed by the owner.
