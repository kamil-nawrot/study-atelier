# 0337. Show the artwork image on a stage in the artwork form

- Status: accepted
- Date: 2026-11-20

## Context and problem statement

The add and edit forms of an artwork showed the chosen image at its real proportions in the left column, about 40 % of the page. A tall image made the column longer than the screen, so the column first scrolled with the page and the image, its thumbnails, its actions and its hints moved with the shape of the image. The owner asked for the image to be shown as on the artwork page: on a stage that does not scroll, about half of the screen, with the buttons and hints under it, while only the form scrolls. The owner also asked whether the cursor over the image could be a pin while placing pins. The phone layout had to be decided too ([ATL-826](https://linear.app/kamil-nawrot/issue/ATL-826)).

## Decision drivers

- The image stays in view while the learner fills the form and places pins.
- Nothing on the stage moves with the shape of the image.
- The form keeps a comfortable width for its tiles.
- On a phone the keyboard leaves enough room for the field being typed in.

## Considered options

Desktop layout:

- A: the stage on the left half, from the menu to the middle of the page, the form on the right half.
- B: half and half, with the stage as a frame inside the page margins and the actions under it on the page.
- C: the form at a fixed 720 px as before and the stage taking the rest of the width.

Phone layout:

- A: the stage at the top at half the height of the screen, scrolling away with the page.
- B: a smaller stage, about a third of the screen, stuck at the top while the form scrolls under it.

Cursor over an image that takes pins: a pin, a pin with a plus, or the system crosshair as before.

Flags opened from Zaplecze: the flag of an image at the top of the form with the others, or on the stage above the image.

## Decision outcome

Chosen options: desktop A, phone A, the pin cursor, and every flag at the top of the form, chosen by the owner on mockups of the real form. The owner then asked for the thumbnails at the top of the stage and the actions with the hints fixed at its bottom.

- From 768 px the form's columns bleed to the menu and the right edge of the content and split the width in half. The left column is sticky under the top bar and as tall as the room between the top bar and the save bar; `ImageField` with `staged` draws the stage there: the blurred image behind it (`StageBackdrop`, as on the artwork page), the thumbnails at the top, the image fitted to the middle by its stored ratio, the actions and the hints at the bottom, the hints with room for three lines. The form on the right half keeps at most `--size-content-default`. The save bar runs under the whole width, under the stage and the form, and the stage ends at its top edge.
- The bleed is measured from the width of the page body, which `AtelierLayout` makes a size container (`atelier-body`) only when the page holds `[data-bleed]`, publishing `--content-bleed`; `--wall-inline` cannot be used there because its percentage resolves against the element using it.
- `ChoiceTiles` with more than four columns shows its narrow columns until its container is 720 px wide, so the eras in the half-width form wrap to three columns instead of squeezing six.
- On a phone the stage comes first, above the title, full width, at half the height of the screen, and scrolls away with the page; with no image it stays as low as the empty field of other forms.
- The flags `top` and `image` stand at the top of the form with the flags of the data, above the title. This narrows point 2 of [ADR-0317](0317-mark-flags-fixed-from-the-list-and-show-them-on-every-form.md) (each flag above the field it is about) for the artwork form.
- Over an image that takes pins the cursor is `var(--cursor-pin)`: Lucide's `pin` in black with a white outline (`cursor-pin.svg` in the library's styles), the hotspot at the tip of the needle, `crosshair` as the fallback.

### Consequences

- Good: the image, its thumbnails and its actions stay in one place while the form scrolls, for a tall or a wide image alike.
- Good: the stage looks like the stage of the artwork page, so the form shows the artwork as it will be seen.
- Bad: at 1440 px the form is narrower than before (about 620 px instead of 720 px), so tile groups with many columns wrap.

## More information

- Requirement R-326.
- Mockups in the project files, folder `atl-826`.
- [ADR-0112](0112-edit-pins-in-the-artwork-form.md) (pins in the artwork form), [ADR-0317](0317-mark-flags-fixed-from-the-list-and-show-them-on-every-form.md) (flags on every form).
