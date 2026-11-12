# 0274. Log the wrong answer picked in a review quiz

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

ATL-449 proposes a review round on pairs the learner confuses (Monet and Manet): a wrong quiz answer would remember the pair, and the session would later show both artworks side by side. Whether such pairs exist in one learner's collection is unknown. `review_log` keeps only whether a quiz answer was right (`correct`), not which option was picked, and the other options of a quiz are drawn at random, so a single wrong pick may be chance rather than confusion. How can the idea be judged before it is built?

## Decision drivers

- Interleaving similar categories helps to tell them apart, also for painters' styles, so the idea may be worth its cost.
- The full round is not small: a pair table, a new question kind with two images and changes to `review_session`.
- A learner's own data decides it, not a guess.

## Considered options

- Build the round of ATL-449 now.
- Prefer a confused option as a distractor in later quizzes, without a new question kind.
- First log the wrong option picked, with no change in the interface, and decide after one or two releases.

## Decision outcome

Chosen option: "First log the wrong option picked", as the owner chose in ATL-699.

- `review_log.wrong_answer` keeps the label of the option the learner picked in a wrong answer of a quiz with four options (title, image, author, style, pin): the title, the name or the label as shown, trimmed and cut to 500 characters.
- A right answer, a flashcard, a typed title, a year and a question that is not saved (definitions, gaps in notes) keep nothing. `record_review` stores the option only when `correct` is false; a check on the column holds that.
- After one or two releases the owner counts how often the same pair comes back, and decides on ATL-449.

### Consequences

- Good: the decision on ATL-449 rests on the learner's own answers, at the cost of one column.
- Good: nothing changes for the learner.
- Bad: a label is a snapshot; a renamed author or a retitled artwork does not change logged answers, and two artworks with the same title cannot be told apart.

## More information

Issue: ATL-699. Idea: ATL-449.
