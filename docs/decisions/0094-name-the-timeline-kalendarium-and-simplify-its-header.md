# 0094. Name the timeline "Kalendarium" and simplify its header

- Status: accepted
- Date: 2026-10-20

## Context and problem statement

After the first tests of the timeline on `develop` ([ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md)), the owner found the view's header crowded and the artwork's card under the stage unnecessary:

- the row of era tags repeated the era strip;
- the heading with the era's name and the "Widzisz: … · skala: …" line repeated what the strip and the scale already show;
- the buttons to the neighbouring eras and the zoom were too prominent;
- prehistory looked shorter than antiquity on the strip;
- clicking an artwork's dot and then unselecting it did not work well.

## Decision drivers

- One way to choose an era, the strip.
- A header like the other views: the module's title and a short lead.
- The strip shows how far apart the eras are, and every era is easy to tap.

## Decision outcome

Chosen by the owner (ATL-233):

- **Name.** The module is "Kalendarium", in the menu, the title and the texts. The stage itself is still named "Oś czasu" for assistive technology, because that is what it is.
- **Header.**
  - An `h1` "Kalendarium" with the lead "Twoje dzieła i wydarzenia w prawdziwej skali czasu, epoka po epoce.", as in the other views.
  - No heading with the era's name and no "Widzisz" line: the current era is the highlighted segment of the strip.
- **Era strip.**
  - The only era control; the row of era tags is gone.
  - The narrowest era is as wide as the strip is high. Prehistory is as wide as antiquity and keeps the break mark at its start. The other eras keep their true proportions where they are wider than the minimum.
  - Each segment shows the era's icon ([ADR-0038](0038-chain-era-period-and-style.md)), and its name where it fits.
- **Quiet controls.** Under the strip the previous era stands on the left and the next on the right, as small muted text buttons with an arrow. The scale steps are in the middle, between small "−" and "+" icon buttons, which are dimmed at the ends of the scale.
- **Artworks.**
  - A click on a dot pins its preview, which gains "Pokaż szczegóły dzieła", a link to the artwork page. There is no artwork card under the stage any more.
  - A second click on the dot, a click on the empty stage or Escape unpins it.
  - Keyboard focus shows the preview, but a click's focus does not, so it never stays open after unpinning.
- The event card under the stage stays as it was.

### Consequences

- Good: a calmer header, one era control, and every era wide enough to tap.
- Good: the preview leads to the artwork, so nothing under the stage repeats it.
- Bad: the events of an artwork's time, which its card listed, are no longer shown for an artwork; an event still lists its artworks.
- Bad: the strip no longer shows prehistory at a true length relative to antiquity, beyond the break mark.

## More information

- Changes the module's name, the header, the era control and the artwork card of [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md); the rest of ADR-0093 stands.
- Issue: ATL-233, milestone 0.7.
