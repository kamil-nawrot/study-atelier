# 0251. Follow the theme on the review stage

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

A featured artwork stands on the stage, which is dark in both themes (`--color-stage-bg`). The review card uses the same stage, so in the light theme the left half of a review stays black, and the definition of a glossary question stands on a light paper card (`--color-mat-bg`) that flips the colours of the dark theme. The owner found both out of place in a review.

## Decision drivers

- A review is a working view, not a showcase of a single artwork.
- The definition card stands out from the stage only slightly, as a card does in the rest of the app.

## Considered options

- Keep the dark stage and the paper card.
- Let the review stage follow the theme and give the definition the surface of a card.

## Decision outcome

Chosen option: the review stage follows the theme, by the owner.

- `ReviewCard` maps the stage tokens to the theme inside its stage: `--color-stage-bg` to `--color-bg`, `--color-stage-fg` to `--color-fg`, `--color-stage-fg-muted` to `--color-fg-muted`. The blurred copy of an artwork lies under the stage background at 70% instead of `--color-scrim`, which is the same colour in the dark theme.
- The definition card is `--color-surface` with `--color-fg`, its blank and its revealed term on `--color-tag`, the blank underlined in `--color-fg-muted`.
- The artwork view, the comparison and the start page keep the dark stage.

### Consequences

- Good: a review in the light theme is light, and the definition card is a quiet card in both themes.
- Bad: an artwork looks different in a review than in its own view in the light theme.

## More information

ATL-631.
