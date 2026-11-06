# 0191. Let the learner change the era bounds

- Status: accepted
- Date: 2026-11-05

## Context and problem statement

The six eras have fixed bounds ([ADR-0038](0038-chain-era-period-and-style.md)), kept in one place in the app and repeated in the database function that draws the review questions about time. Textbooks, teachers and courses date the eras differently, for example the end of the Middle Ages in 1453 or 1492. Should the learner be able to change them, and what happens to the artworks?

## Decision drivers

- A last resort, not a feature to use daily.
- The eras stay a closed chain without gaps or overlaps.
- No artwork changes on its own.

## Considered options

- Fixed bounds, as now
- Every bound free, gaps and overlaps allowed
- Only the five points where neighbouring eras meet, the outer ends open

## Decision outcome

Chosen by the owner in ATL-500: only the five junction points.

- The era form gets "Początek" and "Koniec". Moving a bound moves the neighbouring era's bound with it, and the form says so before saving. "Przywróć domyślne" restores the default bounds.
- The bounds belong to the learner; without own bounds the defaults apply.
- Everything that uses the bounds uses the learner's: the era years and tiles, the question about a year outside its era ([ADR-0176](0176-ask-before-saving-a-year-outside-its-era.md)), Kalendarium, the review year question and the draw of the questions about time, the filters, the card index, the value pages and the statistics. The export and the import carry the bounds.
- Artworks keep their era and year. Saving new bounds says how many artworks will fall outside their era, with a link to them on the wall.
- An artwork outside its era after the change:
  - stays in its era on the wall, in the filters and in the card index;
  - is asked about by the form only when its year or era changes in that edit, as before;
  - is left out of the questions about time until the bounds or the artwork fit again.

### Consequences

- Good: the learner can follow their own course.
- Bad: the bounds are read from the learner's data in the app and in the review draw instead of being constants.
- Bad: the default year texts no longer suffice; the texts are built from the bounds.

## More information

Design issue ATL-500, build ATL-506.
