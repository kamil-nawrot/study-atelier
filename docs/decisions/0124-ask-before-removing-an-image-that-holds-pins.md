# 0124. Ask before removing an image that holds pins

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

Removing an image in the artwork form removes its pins when the form is saved ([ADR-0109](0109-pin-details-on-the-artwork-image.md)). The form said nothing about it, so a learner could lose up to ten pins written by hand with one click and "Zapisz". The 0.9 code review raised it (ATL-300).

## Decision drivers

- Pins are the learner's own writing and cannot be restored.
- Removing an image without pins should stay one click.

## Considered options

1. A confirmation dialog when the removed image holds pins
2. A line under the image after it is removed, saying how many pins go on saving
3. No change

## Decision outcome

Chosen by the owner: option 1.

- "Usuń obraz" on an image that holds pins opens a small dialog "Usunąć obraz?" with "Jego pinezki (N) usuną się po zapisaniu." and the buttons "Anuluj" and "Usuń". An image without pins is removed at once, as before.
- The pins are still removed only when the form is saved; leaving the form without saving keeps the image and its pins.

### Consequences

- Good: no pin is lost without the learner having read that it will be.
- Bad: one more click for an image with pins.

## More information

- Issue ATL-300 (S4 of the 0.9 code review).
