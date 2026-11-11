# 0244. Frame a settings tab under its content, above the save bar

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

In 0.21.2 a settings tab with a save bar ("Profil", "Powtórki", "Widok dzieła", "Źródła") filled the screen so the bar sat at its bottom (ATL-605), and the `Tabs` panel dropped its bottom padding and border so the full-width bar closed the card. "Widok dzieła", with two switches, took the whole height, and the bottom edge of the card never showed (ATL-624). Where does the bar stand when the card is only as tall as its content?

## Decision drivers

- A card is as tall as what it holds.
- The save bar stays where every other form keeps it: at the bottom of the screen, across the column.
- At the end of a long tab the learner sees where the card ends.

## Considered options

- **A:** the bar stays at the bottom of the screen; the card ends under its content with its own bottom edge, with empty space between them in a short tab.
- **B:** the bar belongs to the card and stands right under the content, inside the card's bottom edge; in a long tab it sticks to the bottom of the screen while scrolling.

## Decision outcome

Chosen option: "A", by the owner.

- A `Tabs` panel that holds a `FormActions` bar draws no frame of its own.
- The app's `SettingsForm` draws the card around the failed save `Alert` and the tab's content, without the top edge that joins the tab list, and keeps at least `--spacing-6` between the card and the bar.
- The settings page fills the screen only for a tab with the bar; "Konto" and "Dane" are as tall as their content.

### Consequences

- Good: the bar stands in one place in every form, and a short tab no longer looks empty inside its frame.
- Bad: a short tab leaves empty space between its card and the bar.

## More information

ATL-624. Updates the save bar rule in [ui-patterns.md](../guidelines/ui-patterns.md).
