# 0081. Preload page data when a link is pressed, not when the pointer rests on it

- Status: accepted
- Date: 2026-10-17

## Context and problem statement

The app set `data-sveltekit-preload-data="hover"` on the whole page, so SvelteKit ran a page's loader as soon as the pointer rested on a link to it. On the wall every tile is a link: moving the pointer across it loaded the view of each artwork it passed (ten requests each, most of them empty, and again on every return), and resting on "Dodaj" loaded the data of the artwork form, about 400 KB. A HAR recorded on the development app showed 55 requests in 34 seconds without a single click (ATL-202). When should a page's data be loaded ahead of the navigation?

## Decision drivers

- No requests to the database for a page the learner did not ask for.
- Navigation should still start before the click ends.

## Considered options

- Preload data on `tap` (pointerdown or touchstart) and code on `hover`.
- Keep `hover` and make each artwork view cheaper (the mentions in one database function, ATL-203).
- Keep `hover` as it is.

## Decision outcome

Chosen option: "Preload data on `tap` and code on `hover`", by the owner after the HAR analysis in the ATL-197 session. The mentions are also moved into one function in ATL-203, which makes every loaded artwork view cheaper.

- `app.html` sets `data-sveltekit-preload-code="hover"` and `data-sveltekit-preload-data="tap"` on `body`; no link overrides them.
- Preloading the next artwork for the arrows of the artwork view (`preloadData`) stays: it loads one page the learner is likely to open next, not every link the pointer passes.

### Consequences

- Good: moving the pointer sends nothing to the database; only the JavaScript of the page is fetched, once.
- Bad: a page's data starts loading at pointerdown instead of on hover, so a page with slow data can open a moment later than before.

## More information

- SvelteKit link options: <https://svelte.dev/docs/kit/link-options>.
