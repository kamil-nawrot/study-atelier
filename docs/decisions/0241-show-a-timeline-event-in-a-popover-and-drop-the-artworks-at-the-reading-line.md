# 0241. Show a timeline event in a popover and drop the artworks at the reading line

- Status: accepted
- Date: 2026-11-10

## Context and problem statement

The consistency audit of the views (ATL-596) found two places in Kalendarium that work unlike the rest of the app:

- A chosen event opened its card under the stage ([ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md), kept by [ADR-0094](0094-name-the-timeline-kalendarium-and-simplify-its-header.md)). On a larger screen the stage is tall, so the card often stood below the fold, far from the event it described, while an artwork's preview opens next to its dot.
- The switch "Dzieła w linii czytania" ([ADR-0095](0095-filter-the-timeline-with-period-and-style-lanes.md)) added a row of titles under the stage ([ADR-0100](0100-show-the-artworks-at-the-reading-line-under-the-stage.md)). The dots on the stage and their previews already show the same artworks, and the row added a second way to choose an artwork.

## Decision drivers

- What the learner chose opens next to it, as the artwork preview and the glossary cards do.
- One thing open at a time on the stage.
- The phone keeps a layout that works there: the stage is vertical and fills the width.
- Fewer switches and fewer ways to do the same thing.

## Decision outcome

Settled with the owner in ATL-608 (2026-11-10):

- **Popover on a larger screen.** From 768 px a click or Enter on an event's bar or diamond opens a popover anchored to it, about 360 px wide, below the event or above it when there is no room below, and moved inward at the edges of the stage so it stays over the era. It replaces the card under the stage.
- **One at a time.** Opening an event closes a pinned artwork preview ([ADR-0094](0094-name-the-timeline-kalendarium-and-simplify-its-header.md)), and pinning an artwork closes the event's popover.
- **Closing.** Escape, a click outside it, or any action in it closes the popover and unselects the event, except "Pokaż cały okres na osi" (below). Escape and the actions give the focus back to the event's bar or diamond.
- **Out of view.** While the event's bar or diamond is outside the stage, for example during a pan, the popover is hidden and the event stays selected; it shows again when the event comes back into view.
- **Content.** The card's content in its order: the kind ("Wydarzenie" or "Okres"), the name as a link to the event's page, the date and the length, the description cut to six lines with an ellipsis (the whole text is on the event's page), the Wikipedia source, "Pokaż cały okres na osi" for a period, and "Dzieła z tego czasu" with up to 10 titles.
- **Edit and delete.** "Edytuj" and "Usuń" are icon buttons in the corner by the name, with their names in tooltips.
- **Actions.** "Pokaż cały okres na osi" closes the popover, keeps the event selected so its period stays tinted, as on a phone, and fits the axis to the period; a title closes it and opens that artwork's preview on the stage; "Edytuj" opens the form; "Usuń" opens the existing confirmation.
- **Phone.** Below 768 px the card stays under the stage, as before.
- **Reading line.** The switch "Dzieła w linii czytania" and the row under the stage are gone. A screen reader hears the year and the events at the reading line, no longer its artworks.

### Consequences

- Good: the event's details open where the learner looks, and the stage does not grow a block below it.
- Good: the timeline has one way to choose an artwork, its dot, and one switch fewer.
- Bad: a long description is cut in the popover; the whole text needs the event's page.
- Bad: a screen reader no longer hears the artworks at the reading line; it reaches them as the buttons of the stage.

## More information

- Supersedes the event card on a larger screen in [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md) and [ADR-0094](0094-name-the-timeline-kalendarium-and-simplify-its-header.md), the switch "Dzieła w linii czytania" in [ADR-0095](0095-filter-the-timeline-with-period-and-style-lanes.md), [ADR-0100](0100-show-the-artworks-at-the-reading-line-under-the-stage.md) as a whole, and the artworks in the spoken reading line of [ADR-0107](0107-drop-the-line-above-the-timeline.md). The rest of those decisions stands.
- The popover reuses the library's `PopoverState` and `PopoverCard`, which gains an optional boundary element for its sideways placement.
- Issue: ATL-608, milestone 0.21.2. The behaviour out of view and after "Pokaż cały okres na osi" was settled with the owner in ATL-622 (2026-11-10).
