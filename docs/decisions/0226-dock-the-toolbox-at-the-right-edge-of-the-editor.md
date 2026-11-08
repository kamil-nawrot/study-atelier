# 0226. Dock the toolbox at the right edge of the editor

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

In edit mode the side panel "Dodaj do wystawy" can be collapsed, and then it disappears and "Dodaj" in the top bar opens it again ([ADR-0216](0216-edit-exhibitions-as-a-list-of-blocks-that-are-only-added-and-moved.md)). The owner wants the panel to behave like "Informacje" in the artwork view and to be called "Przybornik" ([ATL-577](https://linear.app/kamil-nawrot/issue/ATL-577)). How does a collapsed panel stay at hand without a button in the top bar?

## Decision drivers

- One pattern for side panels that collapse: the artwork view already has one.
- The top bar of the editor holds only the save status and "Gotowe".

## Considered options

- Keep "Dodaj" in the top bar and only rename the panel.
- Dock the panel: collapsed, it leaves a 48 px strip at the right edge with the chevron and "Przybornik" written upright, as "Informacje" does.

## Decision outcome

Chosen: a docked panel, because it is the pattern the learner knows from the artwork view and the panel never goes out of sight.

- **Name:** "Przybornik"; "Zwiń Przybornik" collapses it and the strip says "Rozwiń Przybornik" to a screen reader.
- **Place:** stuck to the right edge under the top bar, scrolling on its own, whatever the scroll of the exhibition.
- **Collapsed:** the strip is 48 px wide; the editor takes the rest of the width. The choice is kept on the device as before.
- **Top bar:** no "Dodaj" button.
- **Phone:** unchanged, no panel.
- **Code:** `FilterSidePanel` takes an optional `strip` label; the wall filters keep their behaviour.

### Consequences

- Good: adding blocks is always one click away, and the editor looks like the artwork view.
- Bad: the collapsed editor loses 48 px of width.

## More information

Issue [ATL-577](https://linear.app/kamil-nawrot/issue/ATL-577). Adds R-235 and updates R-207.
