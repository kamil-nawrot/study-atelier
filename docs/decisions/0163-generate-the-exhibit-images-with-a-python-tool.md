# 0163. Generate the exhibit images with a Python tool

- Status: accepted
- Date: 2026-10-30

## Context and problem statement

The display case shows every exhibit as a toned engraving, one image per metal ([ADR-0162](0162-show-the-exhibits-as-toned-engravings-in-frames.md)). The images were made in a design session with one-off Python scripts: crop a public-domain or CC0 engraving, replace a blank paper background with generated hatching where needed, and map its tone onto five metal ramps. New exhibits and new tiers (for example a diamond tier) will need more images later, made the same way. How are they generated repeatably?

## Decision drivers

- The same input gives the same images, so an exhibit can be regenerated and reviewed.
- Every image made so far can be reproduced from a list of sources and crops, without the session's scripts.
- A new tier is a change of data, and a new kind of effect is a new step, without touching the existing ones.
- The images already in the app should not change.

## Considered options

1. A TypeScript tool in the pnpm workspace, built on `sharp`, with Vitest tests
2. A Python command-line tool built on NumPy, SciPy and Pillow, outside the pnpm workspace

## Decision outcome

Chosen by the owner: option 2, a Python tool, because the images were made with this code and it reproduces them exactly, pixel for pixel.

- The tool lives in [`tools/exhibit-art`](../../tools/exhibit-art/README.md): `render` turns one image into every tier, `build` renders every variant of the manifest with its source preview and a `sources.json` of credits, `publish` writes the variant chosen for each exhibit as WebP into `apps/web/static/exhibits`, and `fetch` downloads the sources from Wikimedia Commons.
- `manifest.json` lists all 29 variants of the design session (13 chosen, 9 alternatives, 7 rejected) with the Commons file, licence, credit, crop as fractions of the source and tone settings, and names the variant shown in the app for each exhibit.
- The tiers are data in `tiers.json`: a ramp of colours and optional effects per tier. Effects (`bloom`, `sparkle`, `tint`) and backgrounds (`scene`, `wall`, `wall-detect`) are functions registered by name.
- The generated hatching uses fixed seeds, so the output is deterministic. Rebuilding the manifest from the same sources gives the session's images exactly; `publish` gives WebP within the noise of the encoder of the images in the app.

### Consequences

- Good: an exhibit or a whole new tier is generated with one command, and the manifest records where every image came from.
- Good: the tool is small and tested (`pytest`), and does not affect the pnpm packages or their lint.
- Bad: a second language and environment in the repository; the tool needs Python 3.10 with NumPy, SciPy and Pillow, and its tests do not run in CI.
- Bad: sources are downloaded from Wikimedia Commons at most 3840 px wide, so a crop is reproduced only while the file on Commons stays the same.

## More information

ATL-400. Design session of 2026-10-29 (ATL-389).
