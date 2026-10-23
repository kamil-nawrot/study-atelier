# 0110. Look at the details of an artwork through a loupe

- Status: accepted; the place of the button "Lupa" and of the caption for an image that is too small is superseded by [0113](0113-switch-the-loupe-on-from-the-corner-of-the-stage.md); the original file as the large image is superseded by [0115](0115-cap-the-loupe-image-and-thumbnail-linked-wikimedia-images.md)
- Date: 2026-10-22

## Context and problem statement

The artwork page shows an image of 600 to 800 px, and the full-screen viewer fits the image to the screen with at most the 1920 px version from Commons. Many details that matter in art history are smaller than that: the reflection and the signature in the mirror of the Arnolfini Portrait, Icarus's legs in Bruegel's painting, the figures of Bosch. The owner asked for a way to look at an image up close (spike ATL-273).

The images differ in what they can show. Of the 159 main images on production, 43 come from Commons, whose originals often have 4000 to 10 000 px; 10 are uploads, made smaller to 3200 px ([ADR-0091](0091-make-large-own-images-smaller-in-the-browser.md)); 106 are links to other sites, of any size.

## Decision drivers

- Enlarging beyond the source's resolution only enlarges pixels and adds nothing that the full-screen viewer does not show.
- A large original is heavy; it must not load until it is needed.
- On a phone a finger covers the place it would enlarge.

## Considered options

1. A loupe: a circle that follows the cursor and enlarges what is inside it, on a larger screen
2. Pan and zoom in the full-screen viewer, on every screen
3. Nothing beyond the full-screen viewer

## Decision outcome

Chosen by the owner after trying an interactive prototype on the Arnolfini Portrait: option 1.

- Under the image of the artwork page, on a larger screen with a mouse, a button "Lupa" with a magnifier icon switches the loupe on and off; Escape switches it off too. On a touch screen the button is missing.
- While it is on, the cursor over the image becomes a circle of 220 px that shows the image under it enlarged, with the level in the circle ("3×"). The mouse wheel changes the level in steps of one, from 1.5× up to the source's full resolution, never beyond it. It starts at 2×.
- The loupe is offered only when the source is at least 1.5 times wider than the image shown on the page, from the size stored with the image. For a smaller image the button is missing and a caption says why: "Ten obraz nie jest większy niż na ekranie, więc lupy nie ma: pokazałaby tylko powiększone piksele.".
- The large version loads when the loupe is switched on: from Commons the width the highest level needs (and no more than the original), an upload in its stored size, a link as it is. Until it has loaded the circle shows the image of the page.
- The full-screen viewer and pins ([ADR-0109](0109-pin-details-on-the-artwork-image.md)) do not change; the loupe and the pins are separate. The exact look is settled in the app.

### Consequences

- Good: the details of the great artworks in Commons become visible without leaving the artwork page.
- Good: no new data; the stored size of every image is enough to decide when the loupe is offered.
- Bad: images given as links are often too small for it, and a phone gets nothing new.
- Bad: one large download each time the loupe is switched on for a Commons image.

## More information

- Spike ATL-273 with the discussion and the prototype (a private Artifact).
