# 0091. Make large own images smaller in the browser

- Status: accepted
- Date: 2026-10-20

## Context and problem statement

An own image over 5 MB, the size limit of the `artwork-images` bucket, is rejected in the form, and the learner has to make it smaller elsewhere ([ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md)). Photos from phones, 12 to 48 megapixels, are often larger (ATL-59). The browser already draws the small copy of every own image on a canvas ([ADR-0063](0063-make-a-small-copy-of-every-own-image.md)). Should it also make a large image smaller, and how?

## Decision drivers

- A photo straight from the phone can be added without editing it first.
- An image within the limit is uploaded as it is.
- The bucket's limit stays as it is, and the free storage is not filled with huge files.
- The phone does not run out of memory decoding the file.

## Considered options

- Make the image smaller once it is picked or pasted, so the preview shows what will be uploaded.
- Make it smaller when "Zapisz" uploads it.
- Raise the bucket's limit.

## Decision outcome

Chosen by the owner: make it smaller once it is picked or pasted.

- Only a file over 5 MB is made smaller; a smaller file is uploaded unchanged.
- The longer side is cut to 3200 px and the image saved as JPEG at quality 0.9. When the result is still over 5 MB, the longer side goes to 2400 px, then 1600 px; when that is still too large, the file is rejected with "Nie udało mi się zmniejszyć tego obrazu. Wybierz mniejszy.", as it is when the browser cannot read the file.
- A file over 50 MB is rejected before it is read: "Ten plik ma więcej niż 50 MB. Wybierz mniejszy."
- The result replaces the picked file in the form: the preview, the width and height, and the upload on "Zapisz" are the smaller image. No message says it was made smaller.
- Transparency becomes a white background, as in the small copy; an animated GIF keeps only its first frame. The orientation of a phone photo is kept, and its other metadata, including the location, is dropped.
- The hint under the buttons reads "JPG, PNG, WebP, GIF lub AVIF. Większe niż 5 MB zmniejszę." instead of "…, do 5 MB.".
- This applies wherever an own image is added: the file picker and the clipboard, for artworks and author portraits. An image from a link is not uploaded and does not change.

### Consequences

- Good: a phone photo can be added as it is, and a large file takes less storage and loads faster.
- Good: the location stored in a phone photo does not reach the bucket.
- Bad: an image over 5 MB loses some quality and, when it is a PNG, its transparency.
- Bad: making a 48-megapixel photo smaller takes a moment on a slow phone.

## More information

- Supersedes the point of [ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md) that rejects a file over the bucket's limit. Issue: ATL-59.
