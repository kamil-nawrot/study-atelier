# 0067. Keep one layout through a review session

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

[ADR-0061](0061-review-the-collection-in-one-mixed-session.md) gave the image quiz ("Gdzie jest {tytuł}?") its own layout after mockups 07 and 08: the question on the left and four tiles on the right, while the flashcard and the other quizzes use the stage and the panel of the artwork view. In a mixed session the screen jumped between the two layouts. The tiles fitted each image into a square cell, so their passe-partout had different widths, the number badge was covered by the image when the passe-partout was narrow, and answering a quiz moved images and texts as captions, reasons and the next button appeared. How should a session look so that it stays still?

## Decision drivers

- The learner keeps their eyes in one place for the whole session.
- An answer adds information without moving what is already on the screen.
- The passe-partout looks the same on every tile, as on the wall.

## Considered options

- Keep the separate layout of the image quiz and only fix the tiles.
- One layout for every card: the stage on the left, the panel on the right.

## Decision outcome

Chosen option: one layout, as the owner decided.

- Every card of a session uses the stage and the panel (stacked on a phone). The panel holds the question, the options of the title and style quizzes and the status line; the action sits at the bottom of the panel.
- The image quiz puts its four tiles on the stage, without the blurred backdrop, which would give the answer away. Each tile has the same passe-partout: 8 px on the top and sides and a wide bottom edge that stays empty until the answer and then holds the title and the authors, date and reason in one line each. From 768 px the four tiles stand in one row, all as high as the stage allows and the row as wide as it allows. On a phone they stand in two columns of half the width, like the wall: the top two aligned at the top and each lower tile right under the one above it.
- The number badge, and the check or cross after the answer, sit on the image's top left corner, above it.
- A quiz shows "Następne" from the start, disabled until the answer, as the flashcard shows "Odkryj kartę".
- The hint of the image quiz is "Wybierz właściwy obraz.", the same on every device.
- In the title quiz the reason a wrong title was close is an icon at the end of the answer, with the reason in a `Tooltip` ("Ten sam autor", "Ten sam styl", "Ten sam okres"): `user-pen` for the author, `swatch-book` for the style, `hourglass` for the period. The titles get the width the words took.
- The flashcard's ratings show only "Nie wiem", "Prawie" and "Wiem", without when the artwork comes back.
- The place of what an answer shows is kept: the line of the image credit under the stage (two lines on a phone), the place of the reason icon at the end of every title answer, the wide bottom edge of the tiles, and the hints under the question, which stay after the answer.

### Consequences

- Good: a mixed session no longer switches layouts, and an answer moves nothing that was already shown.
- Good: the tiles look like the wall's tiles.
- Bad: a disabled "Następne" stands on the screen before the answer.
- Bad: on a phone the tiles are narrow, so their title and details are cut with an ellipsis; the status line names the right and the picked artwork in full.
- Bad: on a phone a reason icon explains itself only to a pointer; the image quiz still writes the reasons out under the tiles.
- Bad: the learner no longer sees when an artwork comes back before rating it.

## More information

Changes the layout of the image quiz (mockups 07 and 08) and the ratings of the flashcard in [ADR-0061](0061-review-the-collection-in-one-mixed-session.md), and requirement R-79. ATL-171.
