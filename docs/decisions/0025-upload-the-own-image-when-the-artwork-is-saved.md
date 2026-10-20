# 0025. Upload the learner's own image when the artwork is saved

- Status: accepted; rejecting a file over the size limit is superseded by [0091](0091-make-large-own-images-smaller-in-the-browser.md)
- Date: 2026-10-12

## Context and problem statement

"Dodaj własne" in the add and edit form takes a file from the device or an image URL ([ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md), R-14, R-15). A file goes to the private `artwork-images` bucket under the learner's folder; a URL is stored as it is ([ADR-0014](0014-artwork-collection-data-model.md)). The form also stores the width and height of every image. When does a file reach the bucket, how are files that no artwork uses kept out of it, and what happens with a URL whose image the browser cannot load?

## Decision drivers

- A cancelled form or a failed save leaves nothing behind in the bucket.
- The image size is always known, so the wall can lay out the tile before the image loads.
- The bucket's settings stay the only real limit, and the learner sees a clear error before uploading.
- No custom backend ([ADR-0005](0005-no-custom-backend.md)).

## Considered options

For the upload:

1. Upload the file when the artwork is saved, with a local preview until then
2. Upload the file as soon as it is picked

For a URL whose image does not load:

1. Reject it with an error under the field
2. Accept it without a size

## Decision outcome

Chosen options: upload when the artwork is saved, and reject a URL whose image does not load. Uploading on pick would leave a file behind every time the learner cancels, picks another file or closes the tab. An image without a size breaks the layout of the wall.

- A picked file is checked in the browser against the bucket's type and size limits, then shown from a local object URL. Its width and height are read from that preview.
- "Zapisz" uploads the file first, to `<learner id>/<random uuid>.<extension>`, and then calls `save_artwork` with its path. If the save fails, the uploaded file is removed again. If the upload fails, nothing is saved and the form shows why.
- When a saved artwork's uploaded file is replaced or removed, the old file is removed after the save succeeds.
- The original file name is not kept: no column holds it and it may carry personal details.
- This changes the object name of [ADR-0014](0014-artwork-collection-data-model.md), `<user id>/<artwork id>/<file name>`: a new artwork has no id before it is saved, and the file name is not kept. The storage policies check only the learner's folder, so they stay as they are.
- A URL must be a full `https` address and its image must load in the browser, which also gives its width and height. Otherwise "Użyj" shows an error under the field.
- The bucket's name, size limit and image types are mirrored in `#lib/images/bucket.ts`, because a learner's key cannot read bucket settings. A unit test compares them with the migration, so they cannot drift apart.

### Consequences

- Good: a cancelled or failed save leaves no file behind, and a replaced image does not stay in the bucket.
- Good: every own image has a size, as Commons images do.
- Bad: a large file is uploaded during "Zapisz", so saving takes longer than without an image.
- Bad: a file can still stay behind if the tab closes between the upload and the save, or if removing an old file fails. Nothing cleans such files up yet.
- Bad: an image that loads in the browser can still disappear from its site later; the wall then shows an empty frame.
- Bad: photos over 5 MB, common on phones, have to be made smaller by the learner before they can be added.

## More information

- Implementation: ATL-48.
- Making large photos smaller in the browser before upload is an idea for a later version.
- [ADR-0063](0063-make-a-small-copy-of-every-own-image.md) adds a small copy next to every uploaded file.
