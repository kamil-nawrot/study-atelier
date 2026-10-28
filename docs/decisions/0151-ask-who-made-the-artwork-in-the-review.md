# 0151. Ask who made the artwork in the review

- Status: accepted
- Date: 2026-10-28

## Context and problem statement

The review quizzes ask for the title of an image, the image with a title, the style of an image and the term of a pinned detail ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md), [ADR-0118](0118-preferences-for-the-reviews-and-the-artwork-view.md)). Knowing who made an artwork is as basic as knowing its title, but no quiz asks it. Which artworks get the new question, what its answers are and where it fits among the other kinds?

## Decision drivers

- The question must never have two right answers or an answer that is half right.
- An artwork without a known author has nothing to ask.
- The new kind must not push out the quizzes a learner already relies on.

## Considered options

- Several authors: all of them as one answer, or never ask such artworks
- Place: in the rotation of new and learning artworks, or only for settled ones like the style

## Decision outcome

Chosen by the owner:

- The question is "Kto jest autorem tego dzieła?", without a hint under it, like the title quiz. The answers are text, as in the style quiz, and after the answer the card names the right authors with the title and the date.
- Every answer is the list of authors of one artwork, joined with commas, so an artwork with several authors has all of them in one answer.
- An artwork with an unknown author is never asked. The wrong answers are the authors of other artworks of the scope, the closest ones first (same style, period, type, era, time or place, scored as in the style quiz), and none shares an author with the right answer. With fewer than three such answers, the artwork gets the next kind of quiz (R-82).
- New and learning artworks get the title, the image and the author quiz in turn instead of the title and the image only; a session of quizzes takes the title, the image, the author and the style in turn. The style quiz for settling artworks and the pin quiz stay as they were.
- "Dopasowywanie autora do dzieła" joins the quiz kinds in the settings, on by default, and is switched on for every existing account.

### Consequences

- Good: the review practises the author of every artwork whose author is known, with no new setting to learn.
- Good: a learner who switched kinds off keeps them off; only the new kind is added.
- Bad: new and learning artworks see the title and the image quiz a little less often.

## More information

- Issue ATL-362.
