# 0192. Refresh the glossary list and show the fragments of a term

- Status: accepted
- Date: 2026-11-05

## Context and problem statement

The card index lists got a new look in 0.20 ([ADR-0188](0188-redesign-the-card-index-lists.md)). The glossary list ([ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md), [ADR-0077](0077-trim-the-wikipedia-lead-and-polish-the-glossary-list.md), [ADR-0079](0079-connect-the-lexicon-and-suggest-forms-from-wiktionary.md)) differs from it in several ways. It underlines the name on hover, puts a hairline and more space between the filters and the list, and has only one order. On a phone, its letter index starts beside the search field. On desktop, the letter of a long group scrolls away with the group.

A term's page lists, under "Na dziełach", the artworks whose pins carry the term (R-133). A pin can also keep a view of the loupe ([ADR-0114](0114-keep-a-view-of-the-loupe-in-a-pin.md)), and that view is often the clearest picture of the term. But the pin stores only the point and the width of the view. Drawing that view means loading the large image of the loupe, up to 3840 px wide ([ADR-0115](0115-cap-the-loupe-image-and-thumbnail-linked-wikimedia-images.md)), or the original of an own image. For a term with many such pins, that would be tens of megabytes on one page.

What carries over from the card index, and how does a term's page show its loupe views?

## Decision drivers

- The glossary and the card index read as one app.
- The glossary has one list, not tabs.
- A term's page loads no full-size images.
- No file in storage disappears without its pin, and no pin depends on a file being there.

## Considered options

For the list: the card-file frame of the card index; hairlines between terms; the category in an outlined badge; a row background on hover; dividers only between letters as now.

For the order "Ostatnio dodane": a flat list without letters; groups by the date of adding.

For the loupe views: a crop stored when the pin is saved; a crop cut by CSS from a medium image; no crop, only the artwork thumbnail with the point marked.

For the section: a grid of square crops with the pin text; a strip of round lenses; rows like the card index.

For a strip wider than the page: wrapping into rows; scrolling sideways everywhere, with arrows on desktop; one row with "Pokaż wszystkie".

## Decision outcome

Chosen by the owner in ATL-507.

### List

- No frame: the glossary has one list.
- Dividers stay only between letter groups. The category stays as its icon and name, without an outline.
- Hovering a row gives the whole row a subtle background, as in the card index, and the name is not underlined.
- The space between the filters and the list matches the card index.
- On desktop the letter of a group sticks below the top bar while its terms scroll, at the distance where the content starts.
- On a phone the letter index starts at the list, not beside the search field.
- A sort select with the `arrow-up-down` icon offers "Alfabetycznie" and "Ostatnio dodane". "Ostatnio dodane" shows a flat list, newest first, without letters and without the letter index. The date of adding is not knowledge to organise, so it gets no groups.

### Fragments

- A term's page gets a section "Fragmenty" above "Na dziełach", shown when at least one pin of the term keeps a view of the loupe.
- Each such pin is a round lens, shaped like the loupe, with the artwork title and record number under it and the pin text as a hint on hover. A lens opens the artwork with that pin.
- The strip scrolls sideways on every screen, with arrows at its ends on desktop.
- "Na dziełach" is unchanged and lists the artworks of every pin of the term, with or without a view.
- A pin without a view gets no crop. The learner chose no fragment there, so any crop would guess a zoom level.
- Each lens shows a small crop stored for its pin (about 320 px). The crop is cut from the large image of the loupe, which is already loaded when the pin is saved or its view changes. It is stored next to the own images as `<owner>/<pin id>-crop.<ext>`, so the existing storage policies, the quota and the deletion of an account cover it. The crop is deleted with its pin.
- The daily clean-up of unused files (`unused_images()`) keeps the crops of existing pins.
- A pin saved before the crops, or one whose crop failed, gets its crop in the background the next time its artwork is opened. Until then its lens shows the same view cut by CSS from a medium image (960 px from Commons, the 500 px thumbnail of an own image), blurry at a strong zoom. The owner chose this in ATL-531 over the first plan, the whole thumbnail with the point marked.
- A crop fails when the image server forbids reading its pixels. Commons and the own images allow it, but a linked image from another site may not. A crop also fails when the account's storage is full. In both cases the lens keeps the view cut from the medium image.

### Consequences

- Good: the glossary list behaves like the card index lists without taking their frame.
- Good: a term shows the details it names, at a few tens of kilobytes per fragment.
- Bad: crops take a little of the account's storage, and the clean-up of unused files has to know them.
- Bad: a crop can go missing or out of date, so the lens needs a fallback, and old pins get their crops only as their artworks are opened.
- Bad: on desktop a long strip needs the arrows to be seen whole.

## More information

Design issue ATL-507, builds ATL-508 (list), ATL-509 (crops) and ATL-510 (fragments). Mockups are in the project files under `slowniczek-0-20/`, the chosen section in `fragmenty-b-both.png`.
