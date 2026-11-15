# 0309. Record the terms read to the end for the covenant tablets

- Status: accepted
- Date: 2026-11-15

## Context and problem statement

The hidden exhibit "Tablice przymierza" is found by reading the terms or the privacy policy to the end ([ADR-0308](0308-show-moses-with-the-tablets-of-the-law-as-the-covenant-tablets.md)). The owner chose how it is checked: the last paragraph comes into view after the page has been open and visible for about 3 minutes, so scrolling straight to the end does not count. The build left open the exact rule, which documents count, who can find it on the public legal pages, and how the find is recorded. The owner asked for the version to be built right after the design, with every assumption noted for a later review.

## Decision drivers

- The time is counted as for "Soczewka znawcy": in the browser, while the page is visible, without tracking input ([ADR-0214](0214-record-the-first-hour-on-one-artwork-and-rename-its-exhibit.md)).
- The find is recorded once on the profile, as for "Nocny lichtarz" and "Mucha Giotta" ([ADR-0237](0237-record-a-switch-to-the-light-theme-only-in-the-learner-s-night.md), [ADR-0299](0299-land-giotto-s-fly-now-and-then-on-the-artwork-image.md)).
- The legal texts do not change, since a change raises `LEGAL_VERSION` and asks every learner to accept again.
- The legal pages are public and load no profile, so they should not start loading one for an easter egg.

## Considered options

For the rule: the end of the text comes into view only after the time is up, so a reader waiting at the end must scroll away and back; the end is in view at any moment after the time is up, also when it has been in view since before.

For the documents: either of the two; both, in any order; only the terms.

For the time: 3 minutes for both documents; a time scaled to the length of each.

## Decision outcome

Assumed in ATL-783, to be confirmed by the owner in the review of 0.24.

- A marker after the last paragraph of the terms or the privacy policy is watched. The find counts when the marker is in view at any moment after the page has been visible for 3 minutes in a row; reaching the end earlier counts only if the end is still, or again, in view once the time is up. Either document counts, with the same 3 minutes for both.
- Hiding the tab, leaving the page or reloading starts the 3 minutes again. Input is not tracked: the learner is trusted, as with the other hidden exhibits.
- Only a signed-in learner can find it; a visitor without an account is not watched.
- The find sets `legal_read_at` on the profile once through `record_legal_read()`, which keeps the first time. The legal pages do not load the profile, so the browser remembers the record only for the session: a learner who reads to the end again later sends one more call, which changes nothing. A failed record is tried again at the next reading.
- The legal pages do not show the career, so the record only marks it as changed; it is refreshed when the learner goes back to the app, and the menu icon flashes then.
- `covenant_tablets` counts a recorded reading, has one tier, gives 50 points once as an easter egg and stands fourth in "Krypta", after "Mucha Giotta". Nothing was recorded before the release, so nothing before it counts.

### Consequences

- Good: one nullable column and one call in a learner's life; nothing is loaded on the public pages.
- Good: the legal texts stay as they are.
- Bad: a page left open and visible for 3 minutes with the end in view counts as read.
- Bad: a learner who has the record runs the timer again on the legal pages, and may send one call that changes nothing.

## More information

Designed in ATL-776 ([ADR-0308](0308-show-moses-with-the-tablets-of-the-law-as-the-covenant-tablets.md)); built in ATL-783. The WebP images of the engraving come from `exhibit-art publish --only covenant_tablets`.
