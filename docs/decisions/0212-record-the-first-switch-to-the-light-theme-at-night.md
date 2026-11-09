# 0212. Record the first switch to the light theme at night

- Status: accepted; the record of the switch is superseded by [0237](0237-record-a-switch-to-the-light-theme-only-in-the-learner-s-night.md)
- Date: 2026-11-07

## Context and problem statement

The hidden exhibit "Nocny lichtarz" (`candle_moths`) is unlocked by switching the app to the light theme between 22:00 and 6:00 ([ADR-0204](0204-show-the-light-theme-at-night-as-a-night-candlestick.md)). The theme is chosen with a button in the atelier menu and kept only in the browser, so the database knows nothing of it. What is recorded, in which time zone, and how often does the app ask the database?

## Decision drivers

- Exhibits are counted in the database and an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- A hidden exhibit is found where it is earned, as "Pinakoteka motyli" flashes the menu icon right after the pin that fills an image ([ADR-0195](0195-count-an-image-full-of-pins-from-the-pins-it-holds-now.md)).
- "Straż nocna" already reads the night in the learner's time zone.
- The owner asked that a learner who already has the record never makes another request for it.

## Considered options

For what counts: a click on the light theme at night; also a page opened at night in a light theme chosen earlier.

For what is stored: the time of the first such switch on the profile; every switch of the theme.

## Decision outcome

Chosen by the owner in ATL-552.

- Only a click on "Jasny motyw" between 22:00 and 5:59 of the device's clock counts: the moth flies to the light, so the move counts, not the state. A light theme kept from the day does not count, and neither does a switch to the dark theme.
- The profile gets `night_light_at`, set once by `record_night_light()` to the time of the first switch and never replaced. Switches made before the release left no trace and do not count.
- `candle_moths` counts a `night_light_at` whose hour in the learner's time zone falls in the night, has one tier and gives 50 points once as an easter egg. It stands at the end of the display case, after "Alfabet Mistrza E.S.".
- The app asks the database only when the learner switches to the light theme at night and no switch is recorded yet: the own profile, loaded once per visit, says whether it is, and after a successful record the menu stops asking for that learner. A failed record is tried again on the next switch.
- The career is refreshed right after the record, so the menu icon flashes at once; a hidden career is not refreshed.

### Consequences

- Good: one nullable column and one call in a learner's life; no history of theme switches.
- Bad: a learner who switched at night before the release has to do it again.
- Bad: the client decides the night by its own clock; the database checks the hour again in the learner's time zone, so a learner who travels may see the two disagree for one switch.

## More information

Designed in ATL-523 ([ADR-0204](0204-show-the-light-theme-at-night-as-a-night-candlestick.md)); built in ATL-552. The migration also replaces `private.exhibit_values` and `private.unlock_exhibits_for` as a whole, after the five exhibits of [ADR-0206](0206-count-an-artwork-seen-twice-on-two-days-of-visits.md) to [ADR-0210](0210-count-described-values-with-a-summary-or-notes-of-any-text.md).
