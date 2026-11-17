# 0314. Show the flags already set and let them be withdrawn

- Status: accepted
- Date: 2026-11-16

## Context and problem statement

Flags ([ADR-0313](0313-collect-flagged-weak-items-and-missing-data-in-zaplecze.md)) kept no visible state: after "Oznacz" only a toast said something happened, so the learner could flag the same remark on one artwork five times without seeing that it was already on Zaplecze. In the database `save_flag` keeps one row per item, image or pin and reason, and a second flag only replaces the comment, but neither the button nor the dialog said so ([ATL-794](https://linear.app/kamil-nawrot/issue/ATL-794)).

## Decision drivers

- The learner sees at once that an item is already flagged.
- A flag can be corrected or withdrawn where it was set, not only from Zaplecze.
- No new request on every review question.

## Considered options

1. The button: a filled flag; a filled flag with the count beside it; no change on the button.
2. The dialog: a reason already flagged is marked and can be changed or withdrawn; it cannot be chosen again; one line listing the existing flags.
3. Loading: the flags of the item when a view opens and all flags at the start of a review session.

## Decision outcome

Chosen by the owner on 2026-11-16: the first option of 1 and 2, and 3.

1. **The button.** "Do poprawki" shows a filled flag in `--color-highlight` when the item, or an item of the review question, has flags, and is named "Do poprawki, oznaczone: {n}" for a screen reader. The same holds in the artwork, term and symbol views, in "Więcej działań" on a phone and in the review session bar.
2. **The dialog.** A tile of a reason already flagged carries the note "Oznaczone". Choosing it fills "Komentarz" with the saved comment, the confirm button reads "Zapisz zmiany", and "Wycofaj flagę" deletes the flag without history ("Wycofano flagę z Zaplecza."). Choosing another reason empties a filled comment.
3. **Loading.** A view loads the flags of its item when it opens, and a review session all the learner's flags at its start; after a flag is saved or withdrawn, the list is loaded again with one request. A failed load shows no flags rather than an error.

A flag of an image matches the image it was set on (the main image for a flag from a review); a pin flag from a review, which knows the pin only by its place, matches the pin flags of that image.

### Consequences

- Good: the learner sees what is already on Zaplecze and can correct or withdraw it on the spot.
- Good: one request per view or session, and one after a change.
- Bad: the dialog has to know the flags of the items of every question, and the matching of images and pins is approximate in a review.

## More information

- Linear: [ATL-794](https://linear.app/kamil-nawrot/issue/ATL-794). Builds on [ADR-0313](0313-collect-flagged-weak-items-and-missing-data-in-zaplecze.md).
