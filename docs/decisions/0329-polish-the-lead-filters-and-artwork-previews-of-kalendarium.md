# 0329. Polish the lead, the filters and the artwork previews of Kalendarium

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

After the first use of 0.25 the owner collected fixes of Kalendarium (ATL-822, package P5 of the 0.26 fixes). The event popover itself (a panel instead of a popover, "Na podstawie", overlapping names) is designed in ATL-830 and ATL-831.

## Decision outcome

- **Lead.** "W Kalendarium zobaczysz, jak Twoja kolekcja wiąże się z biegiem dziejów. W każdej epoce możesz zestawić dzieła i wydarzenia historyczne, aby zyskać nowy kontekst do analizy sztuki."
- **Era choice.** The era name under the strip is removed, because it repeats the choice above it. The selected era is set in a bold font.
- **Default filters.** The date ranges of the artworks are off and the events are on.
- **Artwork preview.** The preview of a dot can be hovered like other popovers (it stays 150 ms after the pointer leaves the dot and while the pointer or the focus is on it) and ends with "Otwórz w atelier", which opens the artwork in the atelier. Its image is cut to a height that leaves room for the rest of the preview in the artworks zone, so a very vertical image no longer leaves the axis.
- **Margin outside the era.** The grey bands are at most as wide as the stage; in prehistory at the highest zoom they were dozens of viewports wide.
- **Filters.** "Wybierz maksymalnie 5 z epoki …" is replaced by a short introduction at the top. The order follows the wall: favourites, "Typ dzieła", "Autor", then "Okresy i style" and the view switches. The favourites filter stays, since it narrows the dots as on the wall.
- **Edit and delete.** The event popover and card no longer have "Edytuj" and "Usuń"; both stay on the event's page.

### Consequences

- Good: a learner can reach an artwork from the stage with a mouse, and a phone user can open it from the pinned preview.
- Good: the filters read like the wall's.
- Bad: editing an event takes one more step (its page). ATL-830 may change the event popover again and builds on this.

## More information

- Supersedes in [ADR-0095](0095-filter-the-timeline-with-period-and-style-lanes.md) the inert artwork preview, the hint "Wybierz maksymalnie 5 z epoki {epoka}." and the default of the date ranges; in [ADR-0241](0241-show-a-timeline-event-in-a-popover-and-drop-the-artworks-at-the-reading-line.md) the edit and delete buttons of the event popover; in [ADR-0242](0242-polish-the-era-strip-axis-and-event-names-of-kalendarium.md) the era name under the strip. The rest of those decisions stands.
- The text of the filters' introduction is a draft until the owner picks a variant.
- Issue: ATL-822, milestone 0.26.
