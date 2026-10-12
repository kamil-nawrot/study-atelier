# 0027. Show loading as a primed canvas, for the first app load and for artwork images

- Status: accepted
- Date: 2026-10-12

## Context and problem statement

The app renders only in the browser ([ADR-0016](0016-supabase-auth-in-the-browser.md)): until its JavaScript has loaded, checked the session and loaded the first view's data, the page is empty. Artwork images come from Wikimedia Commons, which limits requests per address ([ADR-0023](0023-atelier-routes-and-commons-thumbnails.md)), and from other sites the learner chose. They sit on a paper passe-partout with a light window, or in a dark `Frame` on the sign-in screens. Nothing showed that a view or an image was still loading, and a failed image left an empty window. What does the learner see while the app starts, while an image loads and when it does not load?

## Decision drivers

- The two-tone, sharp-edged look of the app: no shadows, no flashy animations ([ADR-0019](0019-encode-ui-standards-in-tokens-and-the-library.md)).
- Fast loads show nothing that flickers.
- The loading screen reuses the logo mark, so a change to the logo reaches it ([ADR-0020](0020-logo-passe-partout-mark-and-wordmark.md)).
- A wall of a few hundred artworks stays smooth on a phone.

## Considered options

For the image indicator, four sketches of priming a canvas: A, rows laid one after another; B, two coats across each other, first horizontal, then vertical; C, three coats from top to bottom; D, canvas weave covered by a smooth coat.

For the colour of the strokes on the light window of the passe-partout, where the sketch's light strokes do not show:

1. Paper-coloured strokes at a higher opacity
2. Dark strokes in the passe-partout's text colour at a very low opacity
3. A dark window while the image loads, with the sketch's light strokes

For the first load:

1. A component mounted by the client `init` hook, with the library's `LogoMark`
2. Static HTML and CSS in `app.html`, shown before any JavaScript, with a copy of the mark

For an image that does not load:

1. One more try after a pause, then a message in the window
2. The message at once

## Decision outcome

Chosen options: B, dark strokes, the client hook and one more try. The owner picked B and the stroke colour from mockups. The hook keeps one source for the mark; on a slow connection the screen stays dark and empty until the JavaScript arrives. One more try matches how the app treats a 429 from Commons elsewhere.

- Loading indicators appear only after `--duration-loading-delay` (300 ms). With reduced motion they stand still.
- `Primer` draws two coats of bristle strokes in the current text colour at 5 to 13 % opacity: four horizontal bands, laid in turn from alternating sides, then four vertical bands, then the coats fade and start again (5.6 s). The bands are layers of one CSS mask, so they meet without seams.
- `ArtworkImage` shows an artwork image with its states. Until the image loads, a transparent SVG of the image's width and height holds its place, so the window has its final size in every layout, and the image loads hidden on top of it. While it loads, `Primer` covers the window. A failed image is tried once more after 3 seconds; then the window shows the `image-off` icon and "Nie udało się wczytać obrazu". The strokes and the message use the muted text colour of the surface: `--color-mat-fg-muted` on the passe-partout, `--color-fg-muted` in a `Frame` and `--color-stage-fg-muted` on the stage of the full-screen view.
- `Primer` runs only while its image is on screen. A lazy image off screen is not loading yet, and a few hundred animated masks slowed the wall to half its frame rate in a test.
- The client `init` hook in `hooks.client.ts` mounts `LoadingScreen`: the full screen in `--color-stage-bg` with `LogoMark` in its new `xl` size (96 px), and inside its window one horizontal stroke, then one vertical stroke, in a loop (2.6 s). The root layout removes it when it first mounts, after the session check and the first view's data. The error page mounts the root layout too, so an error does not leave the screen on.
- The same hook imports the library styles, so SvelteKit links them in the page head: the page is dark from the first paint, before any JavaScript runs.
- Forms keep their running submit labels; card lists get loading states when they are built.

### Consequences

- Good: every artwork image has a visible state, and a stage image no longer collapses to nothing while it loads.
- Good: the loading screen and the logo share one component.
- Good: the page no longer flashes white before the app starts.
- Bad: on a slow connection, the first moments show only the dark background, until the JavaScript that draws the mark arrives.
- Bad: the browser does not say why an image failed, so a 429 and a missing file look the same, and both get one more try.
- Bad: an image without a stored size holds a 4:5 place while it loads and may change shape when it appears.

## More information

- Implementation: ATL-33.
- Sketches: the four priming variants and the loading screen were reviewed as interactive mockups in the session for ATL-33.
