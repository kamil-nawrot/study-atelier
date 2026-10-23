# 0115. Cap the loupe image at 3840 px and show linked Wikimedia images as thumbnails

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

After release 0.9.0 the artwork view of one artwork froze the browser. Its image was a link to a 102 MP file on `upload.wikimedia.org`; the page used the link itself as the image and as the image of the loupe ([ADR-0110](0110-look-at-details-through-a-loupe.md)), so the browser decoded the whole original on entering the artwork. For a Commons file the page uses thumbnails, but the loupe took the original: for a file of 1572 MP the browser does not load it and the loupe silently stayed on the 960 px thumbnail.

## Decision drivers

- The page must stay fast whatever the size of the file behind a link.
- The loupe must show real detail, not an enlarged thumbnail.
- A link to another site cannot be resized in the browser.

## Considered options

1. The large image of a Commons file is the 3840 px thumbnail; a link to `upload.wikimedia.org` uses thumbnails of the same server; the loupe is not offered for a big image from another link
2. Keep the original where the browser manages to load it

## Decision outcome

Chosen by the owner: option 1.

- The large image of the loupe and of a pin's view is the 3840 px thumbnail of a Commons file wider than 3840 px, otherwise the original; the highest level of the loupe is counted from that width.
- A link to a JPEG, PNG or WebP on `upload.wikimedia.org/wikipedia/commons` is shown as a thumbnail of the nearest Commons width (250 to 1920 px) with a `srcset`, and the loupe takes the 3840 px thumbnail; its query string is dropped. An image that is not wider than the width asked for stays the original.
- The loupe is not offered for an image from any other link above 40 MP; its tooltip says that the image is too large.

### Consequences

- Good: the artwork view opens at once for a linked Wikimedia image, and the loupe of a huge Commons file shows real detail.
- Bad: the highest zoom of the largest files stops at 3840 px.
- Bad: a big image from another site is still loaded in full by the page; only the loupe is switched off for it.

## More information

- Issue ATL-285. This changes the original-file source in ADR-0110.
