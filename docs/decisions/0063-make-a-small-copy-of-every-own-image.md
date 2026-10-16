# 0063. Make a small copy of every own image for the wall

- Status: proposed
- Date: 2026-10-16

## Context and problem statement

The wall loads the original file of an own image, up to 5 MB each, because free Supabase Storage has no image transformations ([ADR-0006](0006-zero-cost-hosting.md), [ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md)). Images from Commons already arrive as 500 px thumbnails ([ADR-0023](0023-atelier-routes-and-commons-thumbnails.md)). The learning module shows four images at once in a quiz, which on a phone means several megabytes per question (ATL-113). How does the wall get a small copy of an own image, and what happens to images uploaded before?

## Decision drivers

- No custom backend and no paid transformations ([ADR-0005](0005-no-custom-backend.md)).
- No database change: the owner runs data changes by hand, and migrations stay data-preserving.
- Images that already exist get a small copy without a script the owner has to run.
- The artwork view and every edit keep working on the original.

## Considered options

1. The browser makes a 500 px JPEG next to the original at upload; its path is derived from the original's path; the wall falls back to the original where the copy is missing, and makes the missing copy in the background
2. Same, with a new column holding the copy's path
3. A one-off script the owner runs locally for the existing images

## Decision outcome

Chosen option: 1. A derived path needs no migration and no extra reads, and the storage policies, which check only the first path segment, already cover it. A column would add a migration for no gain.

- The copy is named `<learner id>/<uuid>-thumb.jpg` next to `<learner id>/<uuid>.<extension>` (`ownThumbnailPath`). It is a JPEG, 500 px wide at most and never enlarged, drawn on white so transparent images do not turn black. JPEG is used because every browser can encode it from a canvas.
- `uploadOwnImage` uploads the original first and then the copy. A copy that cannot be made or uploaded never fails the save: the wall simply uses the original.
- Removing an own image removes both files.
- The wall signs the copies in one request and signs the originals only for artworks whose copy is missing. The artwork view, the form and the card index still use the original.
- For such an artwork the wall already downloads the original, so the browser then makes the copy from it and uploads it, one image at a time and once per session. After the first visit every image has its copy. The owner does not run anything.
- The copy's width is the tile width of the wall, the same 500 px as a Commons thumbnail ([ADR-0052](0052-remember-wall-images-and-cap-their-width.md)). A copy of an animated GIF shows its first frame.

### Consequences

- Good: the wall and the quizzes load tens of kilobytes per own image instead of megabytes; no migration; existing images heal themselves.
- Bad: each own image takes a little more storage (about 5 to 10 percent); the first wall visit after the release downloads the originals once more while the copies are made; a browser that cannot encode JPEG from a canvas keeps using the originals.

## More information

- ATL-59 (scale large photos down before the upload) is independent and can follow; it shrinks the original, this decision adds the second file.
- R2 spike ATL-158 recommends exactly this step before any storage move.
