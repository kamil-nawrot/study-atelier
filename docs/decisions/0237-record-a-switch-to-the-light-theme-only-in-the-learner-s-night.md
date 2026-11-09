# 0237. Record a switch to the light theme only in the learner's night

- Status: accepted
- Date: 2026-11-09

## Context and problem statement

"Nocny lichtarz" (`candle_moths`) counts the first switch to the light theme at night ([ADR-0212](0212-record-the-first-switch-to-the-light-theme-at-night.md)). The app decided the night by the device's clock, `record_night_light()` stored the server's time once and never replaced it, and the app stopped asking after that. A switch the database did not read as night (a clock a few minutes fast at 22:00, or a browser in another time zone) was kept for good, and the exhibit could never be found, while ADR-0212 expected the two to disagree for one switch only. The code review of 0.21 found it (ATL-588).

## Decision outcome

- `record_night_light(time_zone)` takes the time zone the display case is counted in, stores the switch only when its hour in that zone falls between 22:00 and 5:59, and says whether it did. A stored switch is still never replaced.
- The app stops asking for the learner only after a switch the database took; otherwise it asks again on the next switch at night.

### Consequences

- Good: a switch that does not count leaves no trace, so a later one at night still finds the exhibit.
- Bad: none; the exhibit has not been released before 0.21, so no stored switch has to be corrected.

## More information

Built in ATL-588 in `20261109110000_fix_the_review_of_0_21.sql`.
