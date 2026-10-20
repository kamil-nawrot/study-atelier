# 0095. Filter the timeline in a side panel, with lanes for periods and styles

- Status: accepted
- Date: 2026-10-20

## Context and problem statement

The timeline ([ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md), [ADR-0094](0094-name-the-timeline-kalendarium-and-simplify-its-header.md)) showed every artwork of the era with a year, and ADR-0093 planned a choice of up to 5 styles, each in its own lane. The prototype's switches were left for the build to settle. ATL-229 settled with the owner what filters the artworks on the timeline, where the filters open, which switches stay, and what happens to the filters when the learner opens another era.

## Decision drivers

- The same filtering as on the wall ([ADR-0042](0042-filter-the-collection-in-the-browser.md)): one filter object and pure matching functions, and the same panel on a larger screen and on a phone.
- The timeline stays readable: at most 5 lanes, whatever the learner chooses.
- Only filters that say something on a time axis.

## Decision outcome

Chosen by the owner (ATL-229):

- **Filters.**
  - "Okresy i style": one choice of at most 5 periods and styles together, from the artworks of the era in view. Each chosen value gets its own lane and colour, in the order chosen. An artwork shows in every lane it belongs to.
  - "Ulubione", "Typ dzieła" and "Autor" (a search and the most frequent authors), as on the wall.
  - Year, material, place and the other wall filters are left out: the year is the axis itself, and the rest says little on a time axis.
- **Panel.**
  - "Filtry" in the top bar, as on the wall, marked when a filter is on.
  - On a larger screen a side panel at the right edge narrows the timeline. On a phone it is a full-screen `Dialog` with "Pokaż {n} dzieł", the number of matching artworks of the era.
  - The active filters stand as tags above the timeline with "Wyczyść filtry"; a period or style tag carries its lane's colour.
  - Counts in the panel are of the era in view.
- **Lanes.**
  - On a larger screen the artworks zone splits into one lane per chosen value, labelled "Barok · 32" in the lane's colour, and the dots of a lane take its colour.
  - In the vertical layout there are no lanes: a dot takes the colour of the first chosen value it belongs to.
  - Five colour tokens `--color-lane-1` to `--color-lane-5` (ochre, olive, brick, slate blue, plum).
- **Switches** under "Widok":
  - "Wydarzenia" shows or hides the event band, on by default;
  - "Dzieła w linii czytania" adds the artworks of the reading line's year to the bar above the timeline, "· dzieła: Straż nocna, Ekstaza św. Teresy (+3)", off by default.
- **Changing the era** clears the periods and styles; favourites, type and author stay, because they are about the learner, not the era.
- **Memory.** The filters live only while the timeline is open: they are not kept on the device or in the address, and the timeline opens unfiltered.
- When nothing in the era matches, the artworks zone says "W tej epoce nie ma dzieł, które pasują do filtrów."
- **Era name.** Since the era strip shows mostly icons, the name of the current era stands centred above the scale steps.
- **Artwork preview.** With a mouse the preview shows only on hover; a click on a dot does nothing. A tap on a phone, or Enter on a focused dot, still selects it and shows its preview. The preview has no link to the artwork page any more.

### Texts

| Place          | Text                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Section        | "Okresy i style", hint "Wybierz maksymalnie 5 z epoki {epoka}."                                 |
| After 5 chosen | "Wybrano 5. Odznacz któryś, żeby wybrać inny."                                                  |
| Sections       | "Ulubione", "Typ dzieła", "Autor" (field "Szukaj autora"), "Widok"                              |
| Tags           | "Okres Barok", "Styl Tenebryzm", "Autor Caravaggio", "Typ Rzeźba", "Ulubione", "Wyczyść filtry" |

### Consequences

- Good: the wall's filtering is reused, so the two views filter alike.
- Good: periods and styles can be compared side by side without the timeline growing past 5 lanes.
- Bad: the choice of periods and styles is lost when the learner moves to another era, even when a value exists in both.
- Bad: the panel narrows the timeline on a larger screen while it is open.
- Bad: the timeline no longer leads to an artwork's page; the learner finds it on the wall.

## More information

- Changes the style choice of [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md) to a shared choice of periods and styles and adds the other filters and the switches; the rest of ADR-0093 stands.
- Brings back the era's name, which [ADR-0094](0094-name-the-timeline-kalendarium-and-simplify-its-header.md) removed, now above the scale steps, and replaces its pinned preview with "Pokaż szczegóły dzieła" by a preview on hover only.
- Issue: ATL-229, milestone 0.7.
