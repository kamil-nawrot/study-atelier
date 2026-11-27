# 0350. Move "Ustaw jako główne" under the image and the hints into one line

- Status: accepted
- Date: 2026-11-27

## Context and problem statement

The image stage of the artwork form ([ADR-0337](0337-show-the-artwork-image-on-a-stage-in-the-artwork-form.md)) carried long hints under its buttons (placing and dragging pins, pasting with Ctrl+V), with room for three lines, and "Ustaw jako główne" stood at the end of the row of image slots, so the centred row moved whenever another slot was selected. The owner asked for a calmer stage whose controls do not move ([ATL-862](https://linear.app/kamil-nawrot/issue/ATL-862/tidy-up-the-image-stage-of-the-artwork-form)). The more images of the same artwork from Commons ([ADR-0346](0346-show-more-images-of-the-same-artwork-in-the-candidate-dialog.md)) are reached through "Znajdź obraz" and "Wybierz inny", so they need no place on the stage.

## Decision drivers

- Nothing on the stage moves when another slot is selected.
- The stage shows the image, not instructions.
- The hints stay readable without an extra click.

## Considered options

- A: "Ustaw jako główne" as a fourth button in the row of actions, greyed out for the main image, and the hints behind a "?" next to the buttons.
- B: the actions on the selected image (set as main, remove, the hints behind "?") as quiet icons in the corner of the stage, as on the artwork page, with only "Znajdź obraz" and "Dodaj własny" under the image.
- C: "Ustaw jako główne" as a link under the image, and the hints shortened to one visible line under the buttons.

## Decision outcome

Chosen option: C, by the owner on 2026-11-27 after mockups of the three on the real form, with the hint texts chosen the same day.

- The row of slots holds only the slots and "+", so it never moves.
- Under the passe-partout one line of a fixed height holds, for a filled slot other than the first, the `inline` `TextButton` "Ustaw jako główne" with an outlined star, and otherwise the line of the automatic match (searching, the match, no match or its error). The line keeps its height when it is empty, so the image does not change size between slots.
- The hints under the actions are one line of 12 px text, centred, without icons, their parts joined by " · ": "Wpisz tytuł i autora, żeby znaleźć obraz" while the search is not ready, "Wskaż miejsce na obrazie, żeby dodać pinezkę" over an image that takes pins, and "Ctrl+V wkleja obraz ze schowka" (the keys drawn as keys) on devices with a fine pointer. The line reserves the height of one line on the stage and wraps on a narrow column.
- The forms of the glossary and of values share the stage and its one line of hints.

### Consequences

- Good: the slots and the buttons stand still, and the stage holds one short line of text instead of three.
- Good: the link stays next to the image it acts on, as before, with the same star as the mark of the main image.
- Bad: the hints no longer say that a pin can be dragged and that pins are saved at once, independently of the artwork; the pin cursor and the pins themselves are left to show it.

## More information

- Requirement R-359.
- Mockups and screenshots in the project files, folder `atl-862`.
