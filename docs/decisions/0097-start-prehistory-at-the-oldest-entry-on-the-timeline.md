# 0097. Start prehistory at the oldest entry on the timeline

- Status: accepted
- Date: 2026-10-21

## Context and problem statement

The timeline shows one era at a time ([ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md)), and its code started prehistory at a fixed 40000 BCE. The forms accept any year before the common era, so an artwork or an event older than that, such as the cave paintings of Sulawesi around 43500 BCE, was saved but never shown on the timeline. The code review of 0.7 found the gap (ATL-237), and the owner asked for prehistory to reach the oldest entry instead (ATL-239), without changing the era strip.

## Decision drivers

- Every dated entry can be found on the timeline.
- The era strip keeps its look: prehistory must not take over the strip after one very old entry.

## Decision outcome

Chosen by the owner (ATL-239):

- Prehistory starts at 40000 BCE, or at the start of the learner's oldest dated artwork or event when that is older, rounded down to a full millennium. The other eras keep their fixed bounds.
- The stage follows the new start: the margin outside the era, the scale steps, the axis and the era's whole view.
- The era strip does not change. Prehistory keeps the width of antiquity behind its break mark however long it is, and only the frame of what is in view moves within that width.

### Consequences

- Good: an entry of any age shows on the timeline.
- Good: the strip looks the same for every learner.
- Bad: the length of prehistory, and so its "Epoka" step, depends on the learner's data; one very old entry makes the whole-era view of prehistory sparse.

## More information

- Changes the fixed start of prehistory used with [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md); the strip rules of [ADR-0094](0094-name-the-timeline-kalendarium-and-simplify-its-header.md) stand.
- Issue: ATL-239, milestone 0.7.
