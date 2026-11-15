# 0302. Keep the whole review plan in the database

- Status: accepted
- Date: 2026-11-15

## Context and problem statement

The review start showed a plan computed in the browser (`queue.ts`, `overview.ts`, `style-places.ts`): the artworks waiting, the scopes on offer, the free round and tomorrow's round. `review_session` built the round in the database from the same rules written a second time in SQL, and the menu counter added a third copy ([ADR-0287](0287-cap-the-review-counter-in-the-menu-at-one-round.md), [ADR-0291](0291-give-the-style-of-an-artwork-its-own-review-card.md)). The scope "Widziane na żywo" was even resolved from different data in each place. `review_session` itself had grown to about 700 lines with the scoring of wrong answers written three times ([ATL-717](https://linear.app/kamil-nawrot/issue/ATL-717)).

## Decision drivers

- One copy of the rules of a round, so the plan and the round cannot drift apart.
- The review start keeps working without waiting for anything new: the plan comes with the page data.
- No change the learner sees.

## Considered options

- Where the plan is computed: the database, from the function that builds the round; the browser, with the SQL kept in step by tests.
- How the plan reaches the start: one call returning every scope; one call per scope.
- How `review_session` is split: helper functions in the public schema, run as the learner; security definer helpers in the private schema.

## Decision outcome

Chosen by Claude without the owner, to be reviewed with the scope of 0.24 (assumptions in `0.24-zalozenia.md` in the project files):

1. **`review_round`** picks the round: the artworks of the scope with an image, the style places and the style cards, and the artworks to recognise (due first, then new ones within the daily limit). It returns them with the counts of artworks, due and known cards. `review_session` builds its questions from it.
2. **`review_plan(day_start, session_form)`** returns the plan of the review start in one call: every scope on offer (the whole atelier always, a narrower one with 20 artworks and 10 due) with its known and new artworks, the scopes of a free round with their reviewed artworks, and tomorrow's round of the whole atelier. The review page loads it with the rest of its data and again after a round or a change of form.
3. **`review_counts`** returns the menu counter as `waiting`, the round of the preferred form from `review_round`, in place of the counts the browser combined.
4. **`review_likeness`** scores how close another artwork is to the asked one, once, for the wrong answers of the title, author and style quizzes.
5. The helpers are public functions run as the learner, so row level security keeps them to the learner's own atelier; the private schema is not open to learners.
6. The browser keeps only what the plan does not need a round for: how well the atelier is known, the troubles and when the next artwork waits.

### Consequences

- Good: the plan, the counter and the round follow one copy of the rules; "Widziane na żywo" uses the visits everywhere.
- Good: about 400 lines less in the browser and the scoring of wrong answers written once.
- Bad: the plan of the start needs a request after each round and each change of form, and tomorrow's round counts the whole atelier, not the chosen scope.
- Bad: `review_plan` builds the round once per scope on offer; fine for hundreds of artworks, worth a look past a few thousand.

## More information

- ATL-717. Replaces the browser plan of ADR-0287 and ADR-0291 without changing their rules.
