# 0203. Show the palette on the stage and compare two artworks side by side

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

Version 0.21 brings the colour palette of an image ([ATL-454](https://linear.app/kamil-nawrot/issue/ATL-454)) and the comparison of two artworks side by side ([ATL-451](https://linear.app/kamil-nawrot/issue/ATL-451)). Exhibitions use both ([ADR-0199](0199-tell-stories-in-exhibitions-of-the-learners-artworks.md)), and the palette is stored once per image ([ADR-0200](0200-store-an-exhibition-as-one-document-with-rows-of-its-artworks.md)). The owner wants both to work on their own from the collection at any time, not only in exhibitions. Where does the palette appear in the artwork view, where does a comparison start, how is the second artwork picked, and what does the comparison view hold?

## Decision drivers

- The artwork stays the central element of the view. Nothing covers it unless the learner asks.
- The learner likes art, not technology: few steps and no hidden modes.
- Comparing two artworks is the classic exercise of art history exams.
- The views reuse the stage, its corner icons, the loupe and the wall tiles.
- 0.21 stays small: exhibitions are its main theme.

## Considered options

For the palette in the artwork view: a section "Paleta" in "Informacje" under the title; a thin strip under the passe-partout, always visible; an icon in the corner of the stage that shows the palette over the image.

For the start of a comparison: "Porównaj" in the top bar of the artwork view; an icon in the corner of the stage; a mode of the wall in which two tiles are picked.

For picking the second artwork: a dialog with a search; the wall in a picking mode; the comparison view at once, with one empty half that holds the search.

For writing about a comparison: a note between the two images, saved as its own comparison, appended to the notes of both artworks, or no note at all.

For the comparison and exhibitions: "Dodaj do wystawy", which appends the two artworks with an empty paragraph between them to a chosen exhibition, or nothing.

## Decision outcome

The owner chose each part in the design of ATL-544 on 2026-11-06.

### Palette

- An icon "Paleta barw" (Lucide `blend`) in the top right corner of the stage, before the loupe and the pins, shows the palette over the image and hides it again ("Ukryj paletę barw"). `swatch-book` was not used, because the review quiz already shows it for a style. The icon works with a mouse and on a touch screen, unlike the loupe.
- The palette is a band at the bottom of the image, inside the passe-partout, on the background at 85% (a new semantic token): up to six colours as segments as wide as their share, with the hex code under a colour whose share is over 20%. It follows the image on the stage when the artwork has several. It is hidden when the page opens.
- An image whose palette is not stored yet gets it the first time it is asked for ([ADR-0200](0200-store-an-exhibition-as-one-document-with-rows-of-its-artworks.md)). The band then says "Zbieranie kolorów…". An image whose host forbids reading its pixels has a dimmed icon with the tooltip "Ten obraz nie pozwala odczytać swoich kolorów." An artwork without an image has no icon.
- The section in "Informacje" and the strip under the passe-partout were rejected. The owner preferred the image clean until asked.

### Starting a comparison

- "Porównaj" (Lucide `columns-2`) stands in the top bar of the artwork view after the heart and before "Edytuj", icon-only on a phone. A comparison is about the whole artwork, not one image, and the stage already holds three icons. With only one artwork in the atelier the button is dimmed and its tooltip says "Do porównania potrzebne są co najmniej dwa dzieła."
- Picking two tiles on the wall was left out. It can come later if comparing straight from the wall is missed.

### Picking the second artwork

- "Porównaj" opens the comparison view at once. The artwork stands in the left half, and the right half is empty: a dashed outline, "Z czym porównać <title>?", a search "Szukaj po tytule, autorze lub numerze" and the whole atelier as tiles, newest first, without the artwork on the other side. The search narrows the tiles by title, author or record number. Without a match it says what the wall says ("Nie udało się znaleźć żadnego pasującego dzieła", "Nic nie pasuje do „…”. Sprawdź pisownię albo wpisz krótszy fragment tytułu lub nazwiska."). A tile puts its artwork in the half.
- Suggestions (the same author, style or era) were rejected. The owner saw no reason to limit the choice.
- A dialog and the wall in a picking mode were rejected. The empty half shows at once what the comparison will be and serves the change of either artwork later.

### The comparison view

- The view is two stages side by side, like the stage of the artwork view, each with the blurred backdrop, the passe-partout, the title in Newsreader italic, the authors and the year, and "Zmień dzieło", which empties that half. "Zmień dzieło" and "Zamień strony" show only while both halves hold an artwork. An artwork without an image shows `NoImage` and has no palette, and a record number in the address that is not in the atelier (in Archiwum or deleted) leaves its half empty. The top bar has the back link to the artwork the comparison started from and "Zamień strony" (Lucide `arrow-left-right`). The address holds both record numbers, so a reload or the back button keeps the comparison. Each half shows the first image of its artwork.
- The corner of the view holds one loupe and one palette icon for both images. With the loupe on, the cursor over either image shows a loupe on both, at the same point relative to the image and at the same level, and its tooltip says "Lupa pokazuje to samo miejsce na obu obrazach". The rule of [ADR-0110](0110-look-at-details-through-a-loupe.md) applies to each image: an image too small for the loupe shows no lens, and the icon is dimmed when neither image is large enough. A click makes no pin, and pins are not shown. The palette icon shows the palettes of both images.
- On a phone the halves stack, the loupe is not offered (it needs a mouse, as in the artwork view) and the palette icon works.
- There is no note and no "Dodaj do wystawy". The prototype and ATL-451 had a "Podobieństwa i różnice" note and a way to add the pair to an exhibition. The owner had not planned to store notes of comparisons and wanted the comparison to stay a tool for looking. Writing about two artworks belongs in an exhibition, where they can stand in a row with a text. A comparison is not stored.

### Consequences

- Good: the palette and the comparison work from any artwork, with the stage, the loupe and the tiles the learner already knows.
- Good: nothing new is stored. The comparison is a view, and the palette is the column of ADR-0200.
- Good: the image stays clean until the learner asks for the palette.
- Bad: the palette is one click away, so a learner may not notice it at first.
- Bad: what the learner notices while comparing is lost unless they write it in an exhibition or a note.
- Bad: a comparison shows only the first image of each artwork.

## More information

Design issue [ATL-544](https://linear.app/kamil-nawrot/issue/ATL-544), builds ATL-454 (palette) and ATL-451 (comparison). The requirements are R-214 to R-219 in [requirements](../product/requirements.md). The mockups and the texts table are in the project files under `atl-544/`.
