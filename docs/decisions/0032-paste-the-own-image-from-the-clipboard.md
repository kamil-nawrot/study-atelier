# 0032. Paste the learner's own image from the clipboard

- Status: accepted
- Date: 2026-10-12

## Context and problem statement

The learner's own image comes from a file on the device or from an image URL ([ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md), R-15). A screenshot or an image copied in a browser is already in the system clipboard, but today the learner first has to save it as a file or find its address. How does the learner paste an image straight from the clipboard, where does it work, and what happens to an image already in the form?

## Decision drivers

- A screenshot reaches the form in as few steps as possible.
- Pasting also works on a phone, where there is no keyboard shortcut.
- A pasted image follows the same checks, preview and upload as a picked file, so the database, the bucket and its policies stay unchanged.
- A stray Ctrl+V does not throw away an image the learner already chose, and Ctrl+V in a text field always pastes into that field.
- No custom backend ([ADR-0005](0005-no-custom-backend.md)).

## Considered options

Where pasting works:

1. Only in the own image dialog: a "Wklej ze schowka" button and Ctrl+V while the dialog is open
2. The button in the dialog, and Ctrl+V anywhere in the form
3. Ctrl+V anywhere in the form, without a button

An image over the 5 MB limit:

1. Reject it, as a picked file is rejected today
2. Make a pasted image smaller in the browser, keep rejecting picked files
3. Make every image smaller in the browser

Ctrl+V in the form when the form already has an image:

1. Replace the image without asking
2. Ask "Zastąpić obecne zdjęcie?" first
3. Do nothing; the image is changed only through the dialog

## Decision outcome

Chosen options: the button in the dialog plus Ctrl+V anywhere in the form, reject images over the limit, and ask before Ctrl+V replaces an image. Ctrl+V right after taking a screenshot is the shortest path; the button keeps pasting visible and is the only way on a phone. Rejecting large images keeps the size rule the same for every image. The question protects an image chosen earlier from a Ctrl+V pressed by accident.

- Ctrl+V (⌘V on a Mac) uses the browser's `paste` event, which needs no permission. "Wklej ze schowka" uses the asynchronous Clipboard API (`navigator.clipboard.read()`): Chrome and Edge ask once for clipboard access, Firefox and Safari show their own "Paste" prompt.
- What the clipboard holds is read in this order: an image file (a screenshot, "Copy image" in a browser, an image file copied in the file manager), then an `https` address as text, then the `src` of an `<img>` in copied HTML. An address is used like one typed into the URL field. When none is found, the dialog says "W schowku nie ma teraz obrazu. Skopiuj go albo zrób zrzut ekranu i spróbuj jeszcze raz.".
- A pasted image becomes a `File` and goes through the picked-file path of [ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md): the type and size check, a local preview, and the upload on "Zapisz". Its name is generated, because a clipboard image has none.
- The dialog opens with a highlighted paste area on the surface colour: a clipboard icon, the hint "Masz obraz w schowku? Po prostu naciśnij Ctrl+V." (⌘V on a Mac), the buttons "Wklej ze schowka" and "Wybierz plik z dysku" side by side, and the allowed formats and size under them. Below the area, the URL field is labelled "Jeśli wolisz, podaj po prostu adres obrazka", with "Użyj". Pasting in the dialog sets the image and closes it, without a question: opening "Zmień własne" already means changing the image.
- In the form, Ctrl+V takes an image file only when the focus is not in a field the learner types in (a text field, the notes editor, any `input`, `textarea` or editable element). There the paste is left to the field, even when the clipboard holds only an image, because the learner may be pasting a title or a note. A hint under the image actions says "Obraz ze schowka możesz też wkleić tutaj: Ctrl+V."; it is shown only on devices with a fine pointer, where a keyboard is likely.
- When the form already has an image, Ctrl+V in the form first asks "Zastąpić obecne zdjęcie?" with the description "Wklejony obraz zajmie jego miejsce." in a small `Dialog` with "Zastąp" and "Zostaw obecne".
- An image over 5 MB or of a type the bucket does not take is rejected with the same message as a picked file; in the form it shows under the image actions.
- When the browser refuses clipboard access to the button, the dialog says "Przeglądarka nie pozwoliła zajrzeć do schowka. Naciśnij Ctrl+V albo wybierz plik z dysku.".

### Consequences

- Good: a screenshot gets into the form with one shortcut, and on a phone with one button.
- Good: nothing changes in the database, the bucket or the save flow.
- Good: an image already chosen is never replaced by an accidental Ctrl+V.
- Bad: the button shows a browser prompt the first time, and its look differs between browsers.
- Bad: a large screenshot, for example a PNG of a 4K screen, can exceed 5 MB and has to be made smaller by the learner.
- Bad: two ways to paste mean two code paths to test, the `paste` event and the Clipboard API.

## More information

- Design: ATL-76. Implementation: a build issue in Linear.
- Making large images smaller in the browser stays the idea ATL-59.
- Other layouts considered for the dialog: the two buttons in a row without a highlighted area, and a list of three rows (clipboard, disk, address). The highlighted area was chosen because it puts pasting first.
