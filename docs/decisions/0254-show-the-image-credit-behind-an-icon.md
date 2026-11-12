# 0254. Show the image credit behind an icon

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

The credit of an image (Wikimedia Commons with the licence and the photographer, or "Twój obraz…") stood as a line of text under the image: under the stage of the artwork view and the review card, where it took one line or two on a phone, and under the image in the artwork form and the portrait of an author. The owner asked that it no longer take room under the image ([ATL-665](https://linear.app/kamil-nawrot/issue/ATL-665)).

## Decision drivers

- The image gets the room of the credit line.
- The credit stays one tap away, as the licences of Commons images ask.
- The icon does not crowd the action buttons of the stage.

## Considered options

- Keep the line under the image.
- Put the credit behind an icon in another corner than the actions.

## Decision outcome

Chosen option: "behind an icon", by the owner, everywhere an image shows its credit.

- The library `ImageCredit` is a button with the `copyright` icon, named "Źródło obrazu", that opens a `Popover` card with the whole credit on hover, focus, a click or a tap.
- On a stage (the artwork view, the review card) it stands in the top left corner, in the colour of a stage button, since the actions stand in the top right corner and the gallery and the flip arrows use the bottom and the sides.
- On a passe-partout (the artwork form, the portrait of an author) it stands in the top left corner of the passe-partout on its paper colour (`tone="mat"`).
- On a phone the stage of the artwork view no longer keeps room for two lines of credit, so the image may be that much taller.
- Before a flashcard is revealed there is no credit, so no icon (R-81); the icon appearing in the corner moves nothing.

### Consequences

- Good: the stage and the passe-partout show only the image.
- Bad: the credit is one step further away.
