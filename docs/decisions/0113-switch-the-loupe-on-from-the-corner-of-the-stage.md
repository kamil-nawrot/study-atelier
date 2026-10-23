# 0113. Switch the loupe on from the corner of the stage

- Status: accepted
- Date: 2026-10-22

## Context and problem statement

[ADR-0110](0110-look-at-details-through-a-loupe.md) put a button "Lupa" under the image of the artwork page and, for an image that cannot be enlarged, a caption in its place: "Ten obraz nie jest większy niż na ekranie, więc lupy nie ma: pokazałaby tylko powiększone piksele.". Since then [ADR-0112](0112-edit-pins-in-the-artwork-form.md) removed the rows under the image so that it keeps its size, and the pins of the artwork view are one icon in the corner of the stage. Most images are links that are too small for the loupe (106 of 159 main images on production), so the caption would stand under most artworks.

## Decision drivers

- The artwork view is for looking; the image keeps as much room as possible.
- The controls of the stage read as one group.
- The learner learns why one artwork has a loupe and another does not.

## Considered options

1. As ADR-0110: a button with a label under the image, and the caption under an image that is too small
2. An icon in the corner of the stage next to the pins; for an image that is too small the icon stays dimmed and inactive, and its tooltip gives the reason
3. As 2, without the icon and the reason for an image that is too small

## Decision outcome

Chosen by the owner: option 2.

- On a larger screen with a mouse the stage has a magnifier icon in its top right corner, before the pins icon and in the same quiet style. Its tooltip and name are "Lupa"; it is pressed while the loupe is on. On a touch screen it is missing.
- For an image that is not at least 1.5 times wider than shown, the icon stays dimmed and does nothing, and its tooltip is "Ten obraz nie jest większy niż na ekranie, więc lupy nie ma: pokazałaby tylko powiększone piksele.". There is no caption under the image.
- While the loupe is on, a click on the image does nothing; the full-screen viewer opens again once the loupe is off.
- Everything else in ADR-0110 stands: the circle, its levels, the mouse wheel, Escape and the loading of the large version.

### Consequences

- Good: the image keeps its size, and the loupe and the pins sit together.
- Good: the reason for a missing loupe is one hover away and never takes room.
- Bad: an icon without a label is less obvious than a button with "Lupa".

## More information

- Issue ATL-279; replaces the place of the button and the caption in ADR-0110.
