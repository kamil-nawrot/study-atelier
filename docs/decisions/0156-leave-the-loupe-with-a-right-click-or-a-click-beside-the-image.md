# 0156. Leave the loupe with a right click or a click beside the image

- Status: accepted
- Date: 2026-10-28

## Context and problem statement

The loupe ([ADR-0110](0110-look-at-details-through-a-loupe.md), [ADR-0113](0113-switch-the-loupe-on-from-the-corner-of-the-stage.md)) is switched off only with its corner icon or Escape, and a click on the image with the loupe on starts a new pin ([ADR-0114](0114-keep-a-view-of-the-loupe-in-a-pin.md)). A learner who wants to stop looking through the loupe has to find the small icon again. How else can the loupe be left, and how does the learner learn about it?

## Decision drivers

- Leaving the loupe takes no aiming.
- A left click on the image keeps starting a pin.
- The way out is said where the learner looks for it.

## Considered options

- Keep the corner icon and Escape only
- Also a right click on the image and a click anywhere beside it, named in the icon's tooltip

## Decision outcome

Chosen by the owner: also a right click and a click beside the image.

- A right click on the image with the loupe on switches it off, and the browser's menu does not open; with the loupe off a right click works as usual.
- A left click anywhere outside the image switches the loupe off and still does what it does ("Edytuj" opens the form). A click on the loupe icon itself, or inside an open dialog (such as "Nowa pinezka"), does not.
- With the loupe on, the icon's tooltip reads "Wyłącz lupę: Esc, prawy przycisk albo kliknięcie obok" instead of "Lupa".

### Consequences

- Good: the loupe is left without aiming at the icon.
- Bad: the browser's menu (for example "Save image as") is not available on the image while the loupe is on.

## More information

- Issue ATL-373. Extends ADR-0110 and ADR-0113.
