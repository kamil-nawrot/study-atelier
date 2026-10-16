# 0069. Put the quiz images in one row and show the ratings without intervals

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

After [ADR-0067](0067-keep-one-layout-through-a-review-session.md) the owner reviewed the session on the screen. The 2 x 2 grid of "Gdzie jest {tytuł}?" left the images smaller than the stage allows, the reasons written after each title answer ("ten sam autor") took the room of the titles, and the line under each flashcard rating (when the artwork comes back) added text the learner does not need to choose a rating. How should these parts look?

## Decision drivers

- The images of the image quiz are as large as the stage allows.
- The titles of the title quiz have the room of the panel.
- A rating is chosen from memory, not from the interval it leads to.

## Considered options

- Keep ADR-0067 as it is.
- Change the three parts as the owner asked.

## Decision outcome

Chosen option: change the three parts, as the owner decided. The rest of ADR-0067 stays.

- From 768 px the four tiles of the image quiz stand in one row, all of one height and as large as the stage allows, with the same passe-partout as before. On a phone they stand in two columns of half the width like the wall: the top two aligned at the top and each lower tile right under the one above it. The question then stands below the tiles and needs a scroll, which the owner accepted.
- The hint of the image quiz is "Wybierz właściwy obraz." on every device.
- In the title quiz the reason a wrong title was close is an icon at the end of the answer, explained by a `Tooltip` ("Ten sam autor", "Ten sam styl", "Ten sam okres"): `user-pen` for the author, `swatch-book` for the style, `hourglass` for the period. Its place is kept before the answer.
- The flashcard's ratings show only "Nie wiem", "Prawie" and "Wiem"; the middle one stays "Prawie".

### Consequences

- Good: larger images on a computer, titles in one line in most cases, and calmer rating buttons.
- Bad: on a phone a reason icon explains itself only to a pointer; the image quiz still writes the reasons out under the tiles.
- Bad: the learner no longer sees when an artwork comes back before rating it.

## More information

Changes the image quiz layout and the hint of [ADR-0067](0067-keep-one-layout-through-a-review-session.md) and the ratings of [ADR-0061](0061-review-the-collection-in-one-mixed-session.md); requirement R-79. ATL-175.
