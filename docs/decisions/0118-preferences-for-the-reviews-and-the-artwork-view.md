# 0118. Preferences for the reviews and the artwork view

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

The review session has a fixed size of 20 artworks and 10 new artworks a day, always starts in the mixed form and asks every kind of quiz ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md), [ADR-0073](0073-draw-new-artworks-at-random.md)); free review rounds are always offered after the day is done ([ADR-0084](0084-free-review-after-the-day-is-done.md)); pins and the loupe start switched off in the artwork view. The owner wants to set these per learner.

## Decision drivers

- A learner's pace differs from day to day and from learner to learner.
- Some quiz kinds may not suit a learner's way of studying, for example pins without glossary entries.
- The preferences must work on every device of the learner.

## Considered options

- Preferences now, or wait until a real need shows
- Stored per device (like the theme), or on the account

## Decision outcome

Chosen by the owner: preferences now, stored on the account in `profiles` ([ADR-0116](0116-keep-the-profile-and-preferences-in-a-profiles-table.md)).

| Preference                                                                                            | Values                          | Default  |
| ----------------------------------------------------------------------------------------------------- | ------------------------------- | -------- |
| Artworks in one session                                                                               | 10, 20, 30, 40                  | 20       |
| New artworks a day                                                                                    | 5, 10, 15, 20                   | 10       |
| Form the review start opens with                                                                      | Mieszane, Fiszki, Quizy         | Mieszane |
| Quiz kinds asked: the image for a title, the title for an image, the style, "Co to jest?" about a pin | each on or off, at least one on | all on   |
| Free review after the day is done                                                                     | on, off                         | on       |
| Pins shown when an artwork opens                                                                      | on, off                         | off      |
| Loupe switched on when an artwork opens, where it can be                                              | on, off                         | off      |

- `review_session` and `free_review_session` take the session size and the number of new artworks from the learner's profile instead of constants; the minimum of 20 artworks with an image to start stays.
- A quiz kind that is off is never asked; an artwork that would get it gets another kind that is on, or a flashcard, as when four sensible answers do not exist (R-82). With only flashcards possible, the form "Quizy" is not offered.
- With free review off, the review start and the summary of the last round do not offer "Powtórka swobodna".
- Questions about timeline events join the quiz kinds when the idea ATL-222 is built.
- The theme and the order of the wall stay per device.

### Consequences

- Good: the learner sets the pace and the kinds of questions once for every device.
- Bad: the review functions and their SQL tests grow, and the screenshot mock of `review_session` has to follow.

## More information

- Issue ATL-291 (build). Design ATL-286.
