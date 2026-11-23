# 0343. Stand the Kalendarium event panel at the window edge

- Status: accepted
- Date: 2026-11-23

## Context and problem statement

[ADR-0333](0333-show-a-kalendarium-event-in-a-side-panel.md) put the event panel beside the stage with a gap, and [ADR-0340](0340-let-the-kalendarium-stage-fill-the-screen.md) let the stage and the panel span the whole content area. The panel had no padding of its own, so its text ran to the edge of a phone screen and touched the window edge on a larger screen.

## Decision drivers

- The panel should match the other side panel beside a stage, "Informacje" in the artwork view.
- The stage should keep the full width up to the panel.

## Considered options

- Bleed only the stage and keep the panel inside the page column.
- A column at the right edge of the window, like "Informacje".

## Decision outcome

Chosen option: "A column at the right edge of the window, like Informacje", chosen by the owner in the 0.26.1 review (ATL-849), because a panel inside the page column would leave the axis sticking out to its right. From 768 px the panel is 320 px wide at the right edge of the window, with a hairline on its left, padding of its own and the height of the stage, and the stage ends at it without a gap; when the stage would get narrower than 768 px it still lies over the stage's right side. On a phone it stands under the stage within the page margins. This replaces the gap beside the stage of ADR-0333.

### Consequences

- Good: the panel reads like "Informacje" and its text keeps a margin at every width.
- Bad: the stage keeps its own inner edge on the right, so a narrow strip of the stage stands between the axis frame and the panel line.
