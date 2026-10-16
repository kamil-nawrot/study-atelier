# 0070. Ask no style quiz in a session scoped to a style

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

A session can be scoped to a style ([ADR-0064](0064-narrow-the-review-scopes.md)). Every artwork of such a session has that style, so "W jakim stylu powstał ten obraz?" ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md)) always has the scope itself as its answer and checks nothing. What should such a session ask instead?

## Considered options

- Skip the style quiz in a style scope and try the next quiz, as when four styles do not exist.
- Ask for another style of the artwork when it has one, and skip the quiz otherwise.

## Decision outcome

Chosen option: skip the style quiz, as the owner decided. `review_session` leaves `quiz_style` out of the modes it tries when `scope_kind` is `style`, so the artwork gets the title or the image quiz, or a flashcard when neither has four answers. Other scopes are unchanged.

### Consequences

- Good: every question of a style session asks something the learner has to know.
- Bad: a session scoped to a style never practises the other styles of its artworks.

## More information

Migration `20261016120000_no_style_quiz_in_a_style_scope.sql`, test `supabase/tests/review-session.sql`; ATL-173.
