# 0112. Edit pins in the artwork form

- Status: accepted
- Date: 2026-10-22

## Context and problem statement

[ADR-0109](0109-pin-details-on-the-artwork-image.md) put the editing of pins in the artwork view: a button "Edytuj pinezki" and a switch "Pinezki (n)" under the image, and an editing mode with a bar above it. Built that way, the controls took a row under the image and made it smaller, and two separate icons in the corner of the stage did not read as belonging together. The owner asked to edit pins only in the artwork form, and then not to place them in a pop-up.

## Decision drivers

- The artwork view is for looking; the image should get as much room as possible.
- Pins are saved in their own table, not with the artwork.
- The edit form already shows the picture of the shown image next to its slots.

## Considered options

- Pins placed on the picture in the artwork form, term and text in a small dialog.
- Pins placed on the picture in the artwork form, term and text in fields under it.
- A pop-up with the image for placing pins.
- Editing in the artwork view, as in 0109.

## Decision outcome

Chosen option: "pins placed on the picture in the artwork form, term and text in a small dialog".

- The artwork view has one icon in the corner of the stage, a pin with the number of pins of the shown image, only when there are any. It shows or hides the markers; a tap on a marker opens its card. The view has no editing mode, no "Edytuj pinezki" and no "Gotowe" bar.
- In the artwork form the picture of a saved image shows its pins. A tap on the picture places a pin and opens the dialog "Nowa pinezka"; dragging a pin moves it, arrow keys nudge it, a tap on a pin opens the dialog "Pinezka". The dialogs (a glossary entry, a text, "Usuń", "Anuluj", "Zapisz") and the limit of 10 pins are as in 0109. A line under the picture explains how, and that pins are saved at once.
- Pins are saved as soon as they are changed, independently of "Zapisz" and of "Odrzucić zmiany?".

### Consequences

- Good: the artwork view loses its extra rows and the image keeps its size.
- Bad: leaving the form with "Anuluj" does not undo pin changes.
- Bad: an image added in the same editing session cannot be pinned until the artwork is saved.

## More information

Markers are square because the design tokens have no rounding; the card of a pin is a small dialog, as the card of a glossary term.
