# 0093. Show the collection and the learner's historical events on a timeline, one era at a time

- Status: proposed
- Date: 2026-10-20

## Context and problem statement

The wall orders artworks by date ([ADR-0033](0033-order-the-wall-by-period-with-a-period-rail.md)) and groups them by era, period and style ([ADR-0085](0085-group-the-wall-by-era-period-and-style.md)), but it places them at even steps, so it shows neither how long things lasted nor what happened in the world at the same time. The owner wants a new module for 0.7, "Oś czasu": the learner's artworks at their years on a timeline at true scale, together with historical events and periods the learner adds, such as the birth of Jesus or the Napoleonic Wars, which belong to no artwork.

The spike ATL-221 first tested in an adversarial discussion whether the idea is worth building at all. It then went through eight versions of an interactive prototype with the owner. The open question was how to show this readably, for learners, on a phone as well as on a larger screen.

## Decision drivers

- The learner's own collection stays the centre ([vision](../product/vision.md)). The module is optional and changes nothing in the collection.
- The view must read like a learning aid, not like a tool. The first prototype looked like an audio editor.
- Time is shown at true scale within what the learner is looking at.
- The view shows what happened at the same time; the cause and effect is the learner's to write in notes.
- The learner chooses every event and its dates. The app imposes no fixed periods and shows no event the learner did not add, because sources disagree by a few years.
- Dates are entered and shown like the year span of an artwork ([ADR-0046](0046-enter-the-date-of-creation-as-a-year-span.md)), and an artwork stands at its end year as on the wall.
- Zero running cost and no chart library that fights years before the common era.

## Considered options

Each question was decided by the owner on the prototype in ATL-221.

- Is the module worth building at all: yes, for true scale and simultaneity. Only a narrower variant or dropping it were the alternatives.
- Where events are stored: as glossary entries with dates, or as their own entries.
- What one view covers: the whole history with zooming, or one era at a time ("rozdział").
- The edge of an era: a hard edge with a button to the next era, with or without a preview of it, or panning on into the next era.
- Zoom: continuous, or in steps.
- An artwork on the timeline: a small dot, a framed thumbnail, or a clear dot with the image shown on hover.
- Placement of the dots across the timeline: in rows, on one line, at random, or at random without overlapping.
- Titles: wherever there is room, only for favourites, or none.
- A year span: always a bar, only on hover, or a thin line ending in a dot at the end year.
- Layout: horizontal, vertical, or both.
- Rendering: a timeline library (vis-timeline, TimelineJS), a charting library (LayerChart), or an own component.

## Decision outcome

Chosen, decided by the owner in ATL-221:

- the module is built;
- events are their own entries;
- one era at a time, with a hard edge and no preview;
- zoom in steps;
- a clear dot with the image on hover;
- placed at random without overlapping;
- no titles;
- a thin line ending in a dot at the end year;
- both layouts;
- an own component.

### Module

- "Oś czasu" is a menu item after "Słowniczek", with the Lucide icon `calendar-range`, at `/atelier/timeline`.
- It opens the era the learner looked at last on the device, or, the first time, the era with the most artworks.
- The top bar has "Dodaj wydarzenie" (the view's `primary` button).

### Events

- An event ("wydarzenie") is the learner's own entry with:
  - a name;
  - a date: a single year or a year span, entered like the date of creation of an artwork ([ADR-0046](0046-enter-the-date-of-creation-as-a-year-span.md)), with "p.n.e." per end and one "ok.";
  - an optional description of up to 300 characters, like a value summary.
- It belongs to no artwork, and deleting it changes no artwork.
- An event with a year span is shown as a period: its card says "Okres". The interface still calls every entry "wydarzenie".
- They are stored in a new table of the learner's own rows: name, `year_from`, `year_to`, `year_approximate` and description, with the year checks of the artworks and row level security like every other table.
- The form is a page of its own, like a glossary entry. The bar says "Nowe wydarzenie" or "Edycja wydarzenia"; the fields are "Nazwa", the date ("Rok", or "Lata" with the switch "Od – do") and "Opis". Saving returns to the timeline where the event is.
- An event's card on the timeline has "Edytuj" and "Usuń". Deleting asks "Usunąć wydarzenie?" with "Usuń" and "Anuluj".
- There is no list of events in 0.7 ([ATL-223](https://linear.app/kamil-nawrot/issue/ATL-223)).
- Dates and a description suggested from Wikidata, as the glossary suggests definitions, are a separate issue of 0.7.

### One era at a time

- The timeline shows one of the six eras ([ADR-0038](0038-chain-era-period-and-style.md)) at a time, with a margin of 2% of the era on each side, shaded as outside.
- Panning stops at the margin. "← {previous era}" and "{next era} →" above the timeline open the neighbouring era, and so do the era buttons and the era strip.
- An artwork or an event whose dates overlap an era is shown in that era, and so in two eras when it crosses their boundary. At the edge it is cut off and marked "‹" or "›" in the event's name or the artwork's year.
- The era strip above the timeline is the only place that shows the proportions of the eras:
  - the shortest era is at least 16 px wide and the others after prehistory keep their true proportions from it;
  - when they do not fit, they share the width proportionally with a 16 px floor;
  - prehistory takes the rest, shortened against the true scale and marked with a break at its start;
  - a frame on the strip shows what is in view, and a click opens the era under the pointer.

### Scale in steps

- The steps are "Epoka", "10 tysiącleci", "Tysiąclecie", "Trzy wieki", "Stulecie" and "Pokolenie" (30 years). An era offers only the steps narrower than 80% of its own span, so nowożytność has three and prehistory six.
- The mouse wheel, a pinch and the "−" and "+" buttons each move one step, around the pointer or the centre.
- Dragging pans the timeline smoothly, and the arrow keys pan it by a quarter of the view.
- Under the era's name: "Widzisz: XV–XVIII w. · skala: epoka".

### Layout of the timeline

- The axis labels are learners' units: millennia ("III tysiąclecie p.n.e."), centuries ("XVII w."), and at the century and generation steps also decades.
- Thin lines cross the whole timeline at the start of every full century (year 1 of the hundred). Where centuries are closer than 20 px, they mark millennia instead.
- The events stand in their own band, with a lighter background and the label "Wydarzenia", above the artworks ("Dzieła"), separated by a line.
- When the learner has no events, the band says "Nie masz jeszcze żadnych dodanych wydarzeń".
- In the event band:
  - a period is a ribbon with its name inside, or after it when it does not fit;
  - a single year, or a period shorter than 28 px, is a pin with its name;
  - they are packed into lanes with their names counted, at most 4 lanes, or 3 on a phone;
  - the band's height follows the lanes the era needs across its steps, so it does not change within an era;
  - what does not fit is counted as "+n".
- An artwork with a year is a 10 px dot at its end year, with a 2 px line from its start year when it has a year span. Artworks without a year are not on the timeline, and no line says so.
- The dots are neutral and get the style's colour when styles are chosen.
- An approximate date has no mark of its own.
- The dots are placed across the timeline at random without overlapping. Each artwork tries 14 positions from a seed of its own and keeps the one furthest from the dots up to 40 px around it, so the picture is the same on every visit and does not change while panning.
- The timeline shows no titles. Hovering or focusing a dot shows a preview with the framed image (the small copy, [ADR-0063](0063-make-a-small-copy-of-every-own-image.md)), the title, the author and the date. On a phone the preview opens on a tap.
- Each dot reacts to a pointer within about 32 px.
- Selecting an artwork or an event opens its card under the timeline:
  - the artwork's card lists the events of its time;
  - the event's card lists the artworks of its time and shows its whole period on the timeline.
- A yellow reading line stands in the middle of the timeline with the exact year. Above the timeline: "{rok} · w tym czasie: {wydarzenia}". A selected event tints its time over the whole height.
- With up to 5 styles chosen from the era in view, each style gets its own lane in the horizontal layout, and in the vertical one it colours the dots. Opening another era clears the choice.
- The horizontal layout runs time from left to right. The vertical one runs it from top to bottom, with the event names written vertically along their ribbons.

### Rendering

- An own Svelte component in the app, with no chart library.
- The library candidates were checked in the spike's research:
  - vis-timeline and TimelineJS are built on dates and break on years before the common era or do not fit;
  - LayerChart has zooming but nothing for a timeline.
- Time is plain numbers of years, mapped to astronomical years without a year 0.
- The layout rules are pure functions with unit tests: lane packing, dot placement, the era strip and the axis segments.
- The marks are elements, kept for the dots near the view.

### Consequences

- Good: true scale and simultaneity, the two things the wall cannot show, in a calm view that reads like a learning aid.
- Good: events are entered like artwork dates, and an artwork stands at its end year as on the wall, so nothing new has to be learnt.
- Good: no new dependency and no running cost.
- Bad: proportions between eras are shown only on the strip, which is shortened. The owner accepted losing the comparison across eras, such as the Venus of Willendorf against Sumerian art, because those two belong to different eras.
- Bad: the dots carry no title, so learning what they are needs a hover or a tap.
- Bad: a new table and a new module to keep in step with the collection, for example artworks in the trash and a changed date.

## More information

- Spike, discussion, research and prototype history: [ATL-221](https://linear.app/kamil-nawrot/issue/ATL-221). The interactive prototype is a private artifact linked there, with placeholder images and sample data shaped like the target collection.
- Open, to be decided while building:
  - the filter panel of the timeline, designed anew rather than copied from the collection. It is to hold the style choice and the switches the prototype had: placement, titles, year spans, layout, and artworks in the reading line;
  - whether the vertical layout replaces the horizontal one on a phone without a switch;
  - whether the era strip, the era buttons and the arrows all stay.
- Later ideas: historical reviews of the events ([ATL-222](https://linear.app/kamil-nawrot/issue/ATL-222)), and events listed and edited in the card index ([ATL-223](https://linear.app/kamil-nawrot/issue/ATL-223)).
- Adds R-111 to R-120 to [requirements](../product/requirements.md), and "Timeline", "Event" and "Reading line" to the [glossary](../product/glossary.md).
