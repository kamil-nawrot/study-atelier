# 0020. Draw the logo as a passe-partout mark with a one-font wordmark

- Status: accepted
- Date: 2026-10-11

## Context and problem statement

The first screens showed the brand as a small square drawn in CSS next to "STUDY ATELIER" in 14 px bold capitals. It read like a line of text, not a logo, and the favicon was still the Svelte logo from the project template. The app needs a logo that stays simple, works as an icon without the name and follows the two-tone, sharp-edged design system ([ADR-0010](0010-design-tokens-figma-sync.md)). The loading screen also needs the mark as a shape whose inside can be animated.

## Decision drivers

- Keep the existing idea: a square frame with a heavier bottom edge, like the passe-partout around artworks.
- Readable at 16 px as a favicon.
- One typeface, two inks, no accent colour, radius 0.
- No dependence on a web font being loaded.

## Considered options

1. Empty frame (mark A) or a frame holding a letter S, an SA monogram or an arched niche (marks B1 to B3)
2. Wordmark in one line of capitals, in two lines, or with "Atelier" in Newsreader italic
3. For the one-line wordmark: contrast between the words through weight only, through letter spacing only, or both, with or without a space

## Decision outcome

Chosen: mark A with the wordmark STUDYATELIER in one line, without a space, in Schibsted Grotesk: "STUDY" at weight 900 and "ATELIER" at weight 400, both with 0.1 em letter spacing. The owner picked it from a mockup of the variants.

- Mark geometry on a 32 unit grid: sides and top 4 units, bottom 8 units, empty window from (4, 4) to (28, 24).
- The wordmark is stored as SVG outlines, so weights 800 and 900, which are outside the token scale, are not loaded as fonts. The mark is 1.75 em high and sits 0.7 em before the text, with the capitals centred on it.
- `Logo` (mark and wordmark, sizes `sm` 24 px, `md` 32 px, `lg` 48 px high) and `LogoMark` (mark only, same sizes square) live in `packages/ui` and draw in `currentColor`. `LogoMark` renders its children inside the window, in a 24 × 20 unit space, for content or animation such as the loading screen.
- Favicons: an SVG favicon that switches between ink and paper with the system colour scheme, a 32 px PNG with an ink frame and paper window, and a 180 px apple-touch icon with a paper mark on ink.

### Consequences

- Good: the logo renders the same everywhere, without waiting for fonts.
- Good: the loading screen and other places reuse one component for the mark.
- Bad: changing the wordmark text or weights means outlining the glyphs again from the font files.

## More information

- Mockup of the variants: https://claude.ai/artifact/7oZcMXfTcs82zwEEvAwSeQ
