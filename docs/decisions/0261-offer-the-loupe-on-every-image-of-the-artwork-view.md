# 0261. Offer the loupe on every image of the artwork view

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

[ADR-0110](0110-look-at-details-through-a-loupe.md) offers the loupe only for an image at least 1.5 times wider than shown, because enlarging beyond the source adds only pixels. Since then the loupe also makes pins with a view ([ADR-0114](0114-keep-a-view-of-the-loupe-in-a-pin.md)), and that view is what the stored crop, the lens of "Detale" ([ADR-0192](0192-refresh-the-glossary-list-and-show-the-fragments-of-a-term.md)) and the lens of the symbol atlas ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)) are made of. A pin on a small image, most of them links, can never have a view, so it shows no lens and takes no part in the review questions about symbols. Should the loupe be offered for every image?

## Decision drivers

- Every pin can show its detail, whatever the size of the image.
- A large image keeps the loupe as it is.

## Considered options

- Offer the loupe on every image; a small image keeps the least level, 1.5×, and the wheel does not change it
- Offer it on every image; a small image shows the view without enlarging it (1×)
- Lower the least level to 1.2× for every image

## Decision outcome

Chosen by the owner on 2026-11-12: the first option. The loupe of the artwork view is offered for every image whose size is known, except a link too large to load ([ADR-0115](0115-cap-the-loupe-image-and-thumbnail-linked-wikimedia-images.md)). On an image that is not 1.5 times wider than shown, the loupe stays at 1.5×, the scaled-up image a little soft, and a click makes a pin with that view as on any image. The comparison view, which makes no pins, keeps the rule of ADR-0110.

### Consequences

- Good: any pin can have a view, a crop and a lens.
- Bad: on a small image the loupe enlarges pixels, which ADR-0110 wanted to avoid.

## More information

- Issue [ATL-686](https://linear.app/kamil-nawrot/issue/ATL-686).
