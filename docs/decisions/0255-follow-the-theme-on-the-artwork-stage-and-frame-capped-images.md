# 0255. Follow the theme on the artwork stage and frame capped images

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

Three things the owner found while testing 0.22 ([ATL-668](https://linear.app/kamil-nawrot/issue/ATL-668)):

- The stage of the artwork view stayed dark in the light theme, while the review stage follows the theme since [ADR-0251](0251-follow-the-theme-on-the-review-stage.md).
- On a phone an image capped by the screen height (a wall tile, an artwork block of an exhibition) stood narrower than its frame on plain passe-partout paper: in the middle of the white tile, or in an exhibition mat with wide 16 px edges.
- In the "Menu" sheet the logo stood closer to the left edge than the close button to the right edge.

## Decision drivers

- An artwork looks the same in its own view as in a review.
- A capped image looks like any other image on a stage: a blurred copy behind it and a thin passe-partout.
- The three stages kept their own copy of the blurred backdrop.

## Considered options

- Fix each place on its own.
- Share the backdrop and the capped image as library components and use them everywhere.

## Decision outcome

Chosen option: "share them", by the owner's choices on 2026-11-12.

- `ArtworkStage` maps the stage tokens to the theme like `ReviewCard`. The comparison and the start page keep the dark stage, as in ADR-0251.
- The library `StageBackdrop` is the blurred copy of an image under the stage background at 70%, used by the artwork view, the review card and the comparison instead of three copies.
- The library `CappedPicture` holds an image capped at `--picture-max-height`. When the image is narrower than its frame because of the cap, it lays a `StageBackdrop` behind it, in the theme's colours, and gives the image an 8 px passe-partout (`--spacing-2`). The wall tile uses it with `--artwork-max-height`; an exhibition block uses it on a phone, where the block then takes the whole width and drops its own wide mat.
- The logo of the "Menu" sheet is indented by `--spacing-4`, in line with the menu items and as far from the left edge as the close button is from the right one.

### Consequences

- Good: the light theme is light on the artwork view too, and a tall work on a phone is framed like the rest.
- Bad: a tile or a block with a capped image loads its image twice (the backdrop is the same file, from the cache).
