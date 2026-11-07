# 0223. Read the colours of linked images through an image proxy

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The palette is computed in the browser: the app fetches the image with `fetch(url, { mode: 'cors' })` and draws it on a canvas ([ADR-0203](0203-show-the-palette-on-the-stage-and-compare-two-artworks-side-by-side.md)). An image linked from a host that sends no `Access-Control-Allow-Origin` header is shown by `<img>`, but the `fetch` fails, so its palette is "unreadable" for good. Commons images, own uploads and stored palettes are not affected ([ATL-570](https://linear.app/kamil-nawrot/issue/ATL-570)).

## Decision drivers

- A linked image should get a palette like any other.
- One learner, free Cloudflare plan, no new service to run.
- The endpoint must not become an open proxy.

## Considered options

- A proxy endpoint of the Cloudflare Pages app, used only as a fallback.
- Computing the palette on the server.
- Copying linked images into Supabase Storage.

## Decision outcome

Chosen: the proxy, because the palette code stays in the browser and the app already runs on Cloudflare Pages with `adapter-cloudflare`, which serves `src/routes/api/image-proxy/+server.ts` from the same worker.

- **Fallback only:** the browser fetches the image directly first. Only when that throws (a CORS block) and the image is a linked one (`kind: 'url'`), it asks `/api/image-proxy?url=…` with the session token. A palette is computed once per image and stored in `artwork_images.palette`, so the proxy runs once per image.
- **Who:** the endpoint accepts a request only with a Supabase access token that `GET /auth/v1/user` accepts.
- **Where:** only `https` addresses of public hosts on port 443, without credentials, IP literals, names without a dot or local suffixes. Redirects are followed by hand, at most three, and every target passes the same check.
- **What:** only `image/*` except SVG, at most 10 MB (checked on `Content-Length` and while streaming), 8 seconds. Nothing is stored. The answer is `private`, with `nosniff`, and same-origin, so it needs no CORS headers.

### Consequences

- Good: linked images get a palette with a small change; nothing else in the palette flow moves.
- Good: no new service and no storage used.
- Bad: the first server code of the app, with its own tests and attack surface.
- Bad: hosts that refuse Cloudflare addresses (hotlink protection) stay unreadable.
- Bad: the free plan allows 100,000 requests a day and little CPU time per request. A single learner stays far below it.

## More information

Issue [ATL-570](https://linear.app/kamil-nawrot/issue/ATL-570); the research is attached to it as a document. Adds R-234 and updates R-215. The worker needs the public Supabase variables at build time, as the app already does.
