# 0323. Zoom the loupe in proportion to the wheel movement

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

[ADR-0110](0110-look-at-details-through-a-loupe.md) changes the level of the loupe by one for every wheel event. A trackpad sends many events for one gesture, and on a high-resolution image the levels run up to 8× and more, so the level jumps by large values and the zoom is hard to control. How should the wheel set the level?

## Decision drivers

- A trackpad gesture zooms smoothly and a small movement changes the level a little.
- The mouse wheel keeps a clear step.
- The least level of 1.5× and the full resolution as the greatest stay as they are ([ADR-0261](0261-offer-the-loupe-on-every-image-of-the-artwork-view.md)).

## Considered options

- Multiply the level by a factor that grows with the size of the wheel movement
- Keep a fixed step but make it smaller
- Add a fixed step per event and throttle the events

## Decision outcome

Chosen option: the first. The level changes by the factor `exp(-delta × rate)` for every wheel event, so it is proportional to the movement and the same ratio at every level. A pinch gesture on a trackpad, which reports a smaller delta with the control key, uses a five times greater rate. Lines and pages are counted as pixels first. The level stays between 1.5× and the full resolution.

This supersedes the wheel changing the level "in steps of one" in ADR-0110.

### Consequences

- Good: a trackpad gesture zooms smoothly at any resolution.
- Bad: one notch of a mouse wheel changes the level by about a fifth, not by a whole step.

## More information

- Issue [ATL-814](https://linear.app/kamil-nawrot/issue/ATL-814).
