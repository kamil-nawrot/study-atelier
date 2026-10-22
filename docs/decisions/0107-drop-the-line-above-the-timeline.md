# 0107. Drop the line above the timeline

- Status: accepted
- Date: 2026-10-22

## Context and problem statement

Above the stage of Kalendarium a line names the events at the reading line's year ("1640 · w tym czasie: Wojna trzydziestoletnia"), as decided in [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md). The line appears and grows when the reading line reaches an event, so the whole timeline moves down while the learner pans it (ATL-266). Does Kalendarium keep it?

## Decision drivers

- The stage does not move while the learner pans it.
- Nothing the learner reads is lost.

## Considered options

1. Keep the line and reserve its room, so the stage never moves
2. Drop the line

## Decision outcome

Chosen by the owner: option 2. Everything the line said can be read from the stage itself: the reading line shows the year, and the events at it stand in the event band.

- The visible line above the stage is gone.
- A screen reader still hears the year with the events and artworks at the reading line, from the visually hidden live region of [ADR-0098](0098-bound-years-and-make-the-timeline-stage-accessible.md).
- This supersedes the line above the stage in ADR-0093 and [ADR-0100](0100-show-the-artworks-at-the-reading-line-under-the-stage.md); the rest of those decisions stands.

### Consequences

- Good: the stage stays where it is while the learner pans.
- Bad: an event whose bar is narrow at the current scale is named only on the stage.

## More information

- Issue ATL-266; requirement R-117.
