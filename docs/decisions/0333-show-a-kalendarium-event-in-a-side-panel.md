# 0333. Show a Kalendarium event in a side panel

- Status: accepted; the panel beside the stage with a gap is superseded by [0343](0343-stand-the-kalendarium-event-panel-at-the-window-edge.md)
- Date: 2026-11-20

## Context and problem statement

Since [ADR-0241](0241-show-a-timeline-event-in-a-popover-and-drop-the-artworks-at-the-reading-line.md) a chosen event of Kalendarium opens a popover below its bar or diamond on a larger screen and a card under the stage on a phone. The owner found the popover hard to use (ATL-830): it covers the tinted time of the event it describes, it grows large with a long description and the list "Dzieła z tego czasu", and its parts are arranged without a clear order. On a phone the card stands under the stage, below the first screen, so choosing an event shows nothing until the learner scrolls. Its source line ("Na podstawie: Wikipedia, „…”, CC BY-SA 4.0" with two links) is larger and longer than the one of the glossary term card. How should the details of an event be shown?

## Decision drivers

- The tint of the chosen event stays visible while its details are open.
- The details fit the first screen, also on a phone and with a long description.
- The map of artworks already shows the details of a city in a panel beside the map ([ADR-0260](0260-show-places-on-a-drawn-map-and-mark-artworks-to-see.md)); the same kind of thing should look the same.
- The source line reads as in the glossary term card.
- The stage turns vertical below 768 px of its own width (`NARROW_WIDTH`), so a panel must not push a horizontal stage below it.

## Considered options

- A smaller popover beside the event's bar, without the artworks and with the description cut to six lines.
- A side panel beside the stage that narrows it, as on the map.
- A side panel over the right side of the stage, which keeps its width.

The three were drawn on the sample data at 1440 px and 390 px; the screenshots are in ATL-830.

## Decision outcome

Chosen option: "A side panel beside the stage that narrows it", because it covers nothing on the stage, holds the whole description and repeats the pattern of the map. Opening or closing it lays out the event lanes once for the new width, as resizing the window does, with no new request; names may move to other lanes.

- **Larger screen.** A click or Enter on an event's ribbon or pin opens a panel about 320 px wide to the right of the stage, which gets narrower by its width and the gap. When the stage would get narrower than 768 px, the panel lies over the right side of the stage instead and the stage keeps its width. The panel replaces the popover.
- **Phone.** Below 768 px the stage gets shorter and the panel stands under it, both on the first screen, as on the map. The chosen event moves to the middle of the shorter stage.
- **Content.** In this order: "Okres" or "Wydarzenie" as an overline, the name in the title font as a link to the event's page, the date and the length, the whole description, the source line "Na podstawie Wikipedii, CC BY-SA 4.0" in the small muted style of the glossary term card and without links, "Pokaż cały okres na osi" for a period, and at the bottom, under a line, "Pokaż szczegóły" with an arrow to the event's page. A close button with an `X` stands by the name, labelled "Zamknij panel wydarzenia". The full attribution with links to the article and the licence stays on the event's page.
- **Removed.** The section "Dzieła z tego czasu" is gone: the tint of the event's time and the previews of the dots show the artworks. Edit and delete stay on the event's page ([ADR-0329](0329-polish-the-lead-filters-and-artwork-previews-of-kalendarium.md)).
- **Chosen name.** The name of the chosen event that stands next to its ribbon or pin turns `--color-highlight`; a name inside a ribbon already stands on the highlighted ribbon.
- **Closing and one at a time.** The close button, Escape, a click on the empty stage or a second click on the event close the panel and unselect the event. Choosing another event changes the panel's content, and choosing an artwork closes it, as with the popover. "Pokaż cały okres na osi" keeps the panel open and fits the axis to the period.

### Consequences

- Good: the tint and the event stay visible next to the details, and the whole description can be read without opening the event's page.
- Good: on a phone the details appear on the first screen.
- Good: the map and Kalendarium show details the same way.
- Bad: opening the panel narrows the axis, so the names of events can move to other lanes.
- Bad: on a screen too narrow for both, the panel covers the right side of the stage.

## More information

- Supersedes in [ADR-0241](0241-show-a-timeline-event-in-a-popover-and-drop-the-artworks-at-the-reading-line.md) the popover on a larger screen, the card under the stage on a phone, the artworks of the event's time and the source line with links; the rest of that decision stands.
- Design: [ATL-830](https://linear.app/kamil-nawrot/issue/ATL-830); build: [ATL-836](https://linear.app/kamil-nawrot/issue/ATL-836).
