# 0066. Give every artwork type an icon and show types like eras

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

Eras have icons and are chosen with tiles, but the type of an artwork was a select in the form, plain text in the artwork view and a row of tags with a search field in the filter panel, while the era was a tag in the view and tiles in the filters. The two short fixed lists looked and behaved differently for no reason. Which icons should the types get, and how should types and eras be shown?

## Decision drivers

- An icon means one thing in the whole app: no icon is used for an era, a type of place, an artwork type and an action at the same time.
- Short fixed lists look the same everywhere they appear.
- The icons come from Lucide, like every other icon in the app.

## Considered options

- Icons per type, from two or three Lucide candidates each (mockups in the project files, `ikony-typow/`).
- In the filter panel: an icon inside the existing type tags, or tiles like the eras.
- In the artwork view: an icon before the type only, or the type and the era both as icon and name.

## Decision outcome

Chosen by the owner:

| Type | Icon |
| --- | --- |
| Architektura | `castle` |
| Malarstwo | `palette` |
| Rzeźba | `hammer` (Lucide has no statue or bust) |
| Rysunek | `pen-tool` (`pencil` is the edit action) |
| Grafika | `stamp` |
| Rzemiosło artystyczne | `amphora` |
| Fotografia | `camera` |
| Inne | `shapes` |

- The form chooses the type with `ChoiceTiles` (clearable), four columns wide and two on a phone, like the type of place and the era.
- The artwork view shows the type and the era the same way: the icon and the name, without a tag. The era keeps its summary card.
- The filter panel shows the types as `ToggleTiles` like the eras, all eight with their counts in two columns, without a search field.

### Consequences

- Good: types and eras read the same in the form, the view and the filters, and the icons tell the types apart at a glance.
- Good: a test checks that no type icon repeats or matches an era or a type of place.
- Bad: the filter panel is longer, since it lists all eight types even when the collection has two or three.
- Bad: Lucide has no sculpture icon; the hammer stands for the work of the sculptor.

## More information

- The colonnade (`landmark`) is still shared by the era "starożytność" and the place type "Muzeum"; that predates this decision and is left for the owner to decide.
- [ADR-0038](0038-chain-era-period-and-style.md) introduced `ChoiceTiles` for the era, [ADR-0042](0042-filter-the-collection-in-the-browser.md) the filter panel.
