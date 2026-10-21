# 0099. Draw an overlay scrollbar on a larger screen

- Status: accepted
- Date: 2026-10-21

## Context and problem statement

The app used the browsers' native scrollbars. With `scrollbar-gutter: stable` on the page and in the filter panel, room is reserved for a bar on every screen that shows classic scrollbars (Windows, or macOS set to always show them). Text such as the notes in the artwork panel stops short of the edge, and a bar that appears pushes the content. The native bars also ignore the app's palette in the dark theme. The spike ATL-242 compared standard CSS (`scrollbar-color`, `scrollbar-width`, Baseline since December 2025), WebKit pseudo-elements, the OverlayScrollbars library and an own overlay bar, in an interactive prototype.

## Decision drivers

- The content never moves and no room is reserved for a bar.
- Native scrolling stays, with keyboard, assistive technology, scroll restoration and the wall's period rail untouched.
- No dependency for a narrow need.

## Considered options

- Standard CSS colours and width: in the palette, but it keeps the reserved room and the system shape.
- WebKit pseudo-elements: a square bar in Chromium and Safari, but still reserved room.
- OverlayScrollbars 2.17: an overlay everywhere. It costs about 24 KB gzipped and wraps the content in its own elements, which risks the sticky top bar, filter header and dialog footer.
- An own overlay bar: the native bar hidden and a drawn thumb on top, about 200–250 lines in the library.

## Decision outcome

Chosen by the owner (ATL-242): an own overlay bar.

- On a larger screen the native bar is hidden and a square thumb is drawn over the content, at the right edge of the scrolling element or of the window. It can be dragged and is hidden from assistive technology; the element itself still scrolls natively.
- The thumb is 4 px wide and grows to 8 px on hover and while dragged.
- It shows while the content scrolls and while the pointer is over the scrolling area, and fades out after a pause, at once under `prefers-reduced-motion`.
- Its colour is `--color-fg-muted`, and `--color-fg` on hover and drag, so it follows the app's theme.
- Touch devices (`pointer: coarse`) and forced colours keep the native bars, which already overlay the content there or must stay system colours.
- `scrollbar-gutter: stable` is removed.

### Consequences

- Good: the content keeps its full width and never shifts, and the bar matches the palette in both themes.
- Good: scrolling stays native, so nothing that reads the scroll position changes.
- Bad: the app owns a component that follows resize and content changes and handles dragging.
- Bad: a 4 px bar is harder to grab; it grows to 8 px on hover to help.

## More information

- Prototype: an interactive Artifact of the spike, outside the repository.
- Build: ATL-246.
- Issue: ATL-242.
