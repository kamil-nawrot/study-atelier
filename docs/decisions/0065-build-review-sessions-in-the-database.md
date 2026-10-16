# 0065. Build review sessions and their quizzes in the database

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

[ADR-0062](0062-schedule-reviews-with-fsrs.md) built a review session in the browser: the app picked the due and new artworks from the loaded collection and the learner's `review_cards`, chose each artwork's mode and drew the quiz answers from the same list. The owner asked to move this to the database, so the browser sends one request and gets a ready session. Where should a session be built?

## Decision drivers

- One place holds the rules of a session: which artworks, in what order, in which mode and with which answers.
- The browser does not need the whole collection to start a session.
- The rules can change without a new release of the app.

## Considered options

- Keep building the session in the browser.
- A database function that returns the whole session with its quizzes.

## Decision outcome

Chosen option: the database function, as the owner decided. `review_session(day_start, session_form, scope_kind, scope_value)` is a security invoker function, so row level security limits it to the learner's artworks. It returns an ordered JSON list of up to 20 items, each with the artwork's id, its mode and, for a quiz, four options (the artwork's id where the option is an artwork, the label, why a wrong answer was close, and which one is right).

- The pool is the live artworks with an image in the scope ([ADR-0064](0064-narrow-the-review-scopes.md)): the whole collection, an era, a first period or a style. Under 20 artworks it returns an empty list.
- It takes the cards due before the end of the day, the most overdue first, then new artworks in the order they were added, up to 10 a day counting the cards started since `day_start`, and keeps neighbours in different eras where it can.
- Modes follow [ADR-0061](0061-review-the-collection-in-one-mixed-session.md): a mixed session asks new and forgotten artworks a title or image quiz, alternating, and recent known ones a style quiz every third place; "Quizy" rotates the three quizzes; "Fiszki" asks only flashcards. When the preferred quiz cannot get four sensible answers it tries the next one, and the artwork becomes a flashcard when none can.
- Distractors keep the scoring of ADR-0061 (style 4, author 3, period 2, type 2, era 1, a year at most 50 years apart 1, place 1, three drawn from the best eight), each title once, and never the answer's own title.

The browser maps the ids back to the artworks it has already loaded (for their images and captions) and still computes the new FSRS state with `ts-fsrs` and saves it with `record_review`. The start screen counts the due and new artworks with the same limits to show the plan before a session is asked for. A wrong quiz answer still comes back later in the same session, with its options shuffled again in the browser.

### Consequences

- Good: the session and quiz rules live in one function; the browser no longer carries the engine of distractors.
- Good: the function is tested with the other migrations and the security tests.
- Bad: starting a session needs one more request, and the start screen's counts repeat the limits of the function.
- Bad: the screenshot mock has to imitate the function with simpler picks.

## More information

Replaces the "Session building" line of [ADR-0062](0062-schedule-reviews-with-fsrs.md). Migration `20261016100000_review_session.sql`; ATL-163.
