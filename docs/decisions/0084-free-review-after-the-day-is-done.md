# 0084. Free review rounds after the day's reviews are done

- Status: accepted
- Date: 2026-10-18

## Context and problem statement

A session takes only the artworks due today and up to 10 new ones ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md), [ADR-0073](0073-draw-new-artworks-at-random.md)), and the rounds of a day end when nothing is due ([ADR-0068](0068-schedule-every-review-in-days.md)). A learner who wants to practise more after that has nothing to start. ATL-208 asks for a "free mode": unlimited extra sessions, configurable like a standard one, that change nothing the app measures. When is it offered, which artworks does it take, and how does it stay out of the schedule?

## Decision drivers

- Extra practice must not move the FSRS schedule, the streak, the menu counter, the daily limit of new artworks or the side panel of the review start.
- The scheduled reviews come first: free practice must not become a way around them.
- Practice should go where it helps most.

## Considered options

- When it is offered:
  - when nothing waits today in the whole collection;
  - only after at least one answer today and nothing waiting;
  - when nothing waits in the chosen scope.
- Which artworks:
  - artworks already reviewed, the weakest first;
  - artworks already reviewed, at random;
  - every artwork with an image, at random.
- A wrong answer: back 3 to 5 artworks later, as in a scheduled session, or not again.

## Decision outcome

Chosen options: "when nothing waits today in the whole collection", "artworks already reviewed, the weakest first" and "back 3 to 5 artworks later", by the owner. The texts were proposed and accepted in the same session.

- "Powtórka swobodna" is offered when nothing waits today in the whole collection, including a day with nothing planned: on the review start as the view's `primary` button under "Nic nowego do powtórki", with the caption "Dodatkowa runda dzieł, które znasz najsłabiej. Nie zmienia planu powtórek ani serii.", and in the summary of the last scheduled round in place of "Następna runda".
- A free round has at most 20 artworks that already have a card, ordered by stability (the lowest first), then by lapses and record number. Each further round of the same scope takes the next 20 and starts again from the weakest after the last; changing the scope starts from the weakest. The modes follow the same rules as a scheduled session.
- The scope choice offers "Cała kolekcja" and every era, period or style with at least 20 reviewed artworks with an image, each with that number; the forms are those of a scheduled session.
- `review_session` takes an optional `free_round` and builds the free round in the database, with the quizzes of [ADR-0065](0065-build-review-sessions-in-the-database.md).
- A free session never calls `record_review`, so nothing is written. A wrong answer comes back 3 to 5 artworks later in the browser only, and the page keeps the cards and the count of new artworks it had before the session.
- The session bar shows the `Tag` "Tryb swobodny". "Przerwij" says "Odpowiedzi w powtórce swobodnej nie są zapisywane.". The summary opens with the same sentence as a scheduled one ("Dziś udało się powtórzyć {n} dzieł, zajęło Ci to {m} minut.") and ends with "Plan powtórek się nie zmienił." instead of the artworks waiting tomorrow, and offers "Kolejna runda swobodna", without a limit.

### Consequences

- Good: unlimited practice that leaves the schedule and every number on the review start as they were.
- Good: the weakest artworks get the extra practice, and further rounds go through the rest.
- Bad: free answers leave no trace, so they never count towards the streak or teach the scheduler anything.
- Bad: the rule for free scopes (20 reviewed artworks) differs from that of scheduled ones (20 artworks with an image, 10 of them due).

## More information

- [ADR-0062](0062-schedule-reviews-with-fsrs.md): the review tables and `record_review`.
- [ADR-0078](0078-show-a-streak-of-days-with-reviews-on-the-review-start.md): the streak counts the days with a logged answer.
