# 0129. Show one faded artwork behind the ticket stub

- Status: accepted
- Date: 2026-10-25

## Context and problem statement

[ADR-0128](0128-log-museum-visits-in-a-chronicle.md) (point 5) gave each ticket of the chronicle list a stub behind a zigzag with a semicircle notch at each end, holding up to three thumbnails aligned to the right and "+N". Built that way, wide images reached past the zigzag, and a rectangular stub inside a cut card looked busy. In the review of ATL-323 the owner asked to drop the thumbnails or keep only one as a faded background of the stub, to let the image run up to the zigzag and be cut by it, and to make the tickets narrower on a desktop.

What does the stub of a ticket show, and how wide is a ticket?

## Decision drivers

- A ticket reads as one shape: the zigzag cuts the card, not a box inside it.
- Images of any proportion stay inside the stub.
- The list stays a calm column of tickets, not a row of thumbnails.

## Considered options

1. Up to three thumbnails and "+N" behind the zigzag, as in ADR-0128
2. No image in the stub
3. One faded image filling the stub, cut by the zigzag

## Decision outcome

Chosen option: 3, because it keeps a hint of what was seen while the zigzag stays the only edge of the stub.

- The stub (`TicketStub`) is cut from the card by a zigzag (32 px period, 14 px deep) through which the page shows; there are no notches at its ends.
- On a list ticket the stub shows the first artwork of the visit with an image as a faded, cropped backdrop filling it, a decorative copy hidden from assistive technology. A visit without such an artwork has an empty stub.
- On a phone the zigzag runs across the card and the stub is a band under it.
- From 768 px the tickets of the list take half the width of the content, at least `--size-content-narrow`.
- The ticket heading the visit view keeps the number of artworks seen in its stub (ADR-0128, point 6).

### Consequences

- Good: wide and tall images never break the shape of the ticket.
- Good: a narrower ticket keeps the list readable on a wide screen.
- Bad: the list shows one artwork per visit; the others appear only in the visit view.

## More information

- Supersedes the stub of the list ticket in [ADR-0128](0128-log-museum-visits-in-a-chronicle.md), point 5; the rest of ADR-0128 stands.
- Built in ATL-323; recorded in the session retro of ATL-326.
