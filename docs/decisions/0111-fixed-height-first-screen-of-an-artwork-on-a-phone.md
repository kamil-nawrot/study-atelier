# 0111. Fixed-height first screen of an artwork on a phone

- Status: accepted
- Date: 2026-10-22

## Context and problem statement

On a phone the artwork view stacks the stage above the information ([ADR-0026](0026-artwork-view-as-a-stage-with-an-information-panel.md)). The stage takes the height of the image, up to 60% of the screen, and grows by the row of thumbnails when the artwork has several images. Flipping between artworks therefore moves the arrows, which sit halfway down the stage, and the page breaks at a different field every time (ATL-281). How does every artwork get the same first screen on a phone?

## Decision drivers

- The arrows to the previous and next artwork stay where the thumb expects them.
- The first screen always shows the image, the record number, the title, the authors and the date, and the fields from "Typ" down start below the fold.
- Nothing the learner wrote is cut off.
- The layout on a larger screen does not change.

## Considered options

Layout of the first screen:

1. The image on a stage of a fixed height, the heading under it, the arrows at the sides of the stage
2. The heading laid over the bottom of a stage that fills the screen
3. As option 1, with the arrows as two buttons in the row of the record number

A title or list of authors longer than the room left for it:

1. Room for two lines of title and one line of authors; a longer heading moves only that artwork's fields down
2. Two lines of title and one line of authors at most, the rest cut off with an ellipsis
3. Room for two lines of title and two lines of authors

## Decision outcome

Chosen by the owner: layout option 1 and heading option 1.

- Below 768px the stage is as high as the screen under the top bar minus the room of the heading: the panel's top padding, the record number, two lines of title, one line of authors with the date and the gap before the fields. The image is fitted inside the stage, keeping room for a two-line credit and, with several images, for the thumbnails.
- The heading keeps that room even with a one-line title, so the fields from "Typ" start just below the fold.
- A longer title or list of authors is shown in full; only that artwork's fields move down, while the stage and its arrows stay in place.
- An artwork without an image fits the empty window and "Dodaj obraz" into the same stage.

### Consequences

- Good: flipping through artworks on a phone keeps the image, the arrows and the fold in place.
- Good: the full title and every author stay readable on the first screen.
- Bad: a short title leaves an empty line under the heading, and a wide image gets empty room above and below it.
- Bad: a very long heading still moves the fields of that one artwork.

## More information

- Issue ATL-281; requirement R-137.
