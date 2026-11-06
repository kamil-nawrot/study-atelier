# 0198. Tell stories in exhibitions of the learner's artworks

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

The learner collects artworks, describes them and reviews them, but the app has no place where several artworks come together in one argument. Examples are the influence of ancient sculpture on the Renaissance, how castle and palace architecture changed, or Baroque painting compared across Europe. In a museum that place is an exhibition: curatorial texts, a main narrative and the artworks between them.

ATL-130 was filed in 0.6 as a social idea. In the planning of 0.21 the owner reframed it as a rich note that ties artworks into one story, private first, with sharing ([ATL-471](https://linear.app/kamil-nawrot/issue/ATL-471)) as a later bonus. An interactive prototype on TipTap 3.31.4, the editor the notes already use, went through eight versions on the owner's feedback. How does an exhibition work, where does it live in the app, and how does it look?

## Decision drivers

- The learner's target is someone who likes art, not technology. Dragging is easier than typing commands.
- The layout must not break easily. In the prototype, dropping an artwork into the middle of a paragraph was the main way to break it.
- An exhibition uses the atelier. It adds no second collection.
- It reads well on a phone, where rows stack.
- It follows the existing views: Kronika for the list, the wall filters for a side panel, Archiwum for deleting.

## Considered options

- Fixed templates (pairs, a timeline, columns) or rooms as separate pages.
- A free canvas.
- One document of blocks flowing downwards, with rows of up to three blocks.

## Decision outcome

Chosen: one document of blocks. The owner settled the details in the 0.21 planning thread and in ATL-130.

### What an exhibition is

- An exhibition has a title and one document. It shows only artworks already in the atelier. A missing artwork is added to the atelier first, and the exhibition may offer a quick way to the add form.
- Texts written for an exhibition are its own. An artwork block can also show the artwork's note, read live and not copied.
- Blocks are a paragraph ("Akapit"), a heading ("Nagłówek"), a quote ("Cytat"), an artwork and a close-up. An artwork block has options: its palette under the image, only its palette, its note. When the artwork has several images, the block shows the one the learner picks, the first one by default. A close-up ("Zbliżenie") is a fragment of an artwork image, with its own choice of image, and stands beside the artwork.
- Any block can stand beside another, at most three in a row. A row forms when a block is dropped on the side of another block and dissolves when one is left. On a phone a row stacks.
- A text is a block like any other. Typing stays inside its block. A drop lands only above or below a block, never inside a text, and Backspace never joins two blocks.
- Słowniczek terms are marked in the exhibition texts when viewing, as in a note. Exhibition texts have no `#` or `@` links for now.
- There are no draft and published states. Every change is saved automatically a few seconds after the last one. A published version separate from a working copy is left to sharing (ATL-471).

### Where it lives

- "Wystawy" is a module in the menu after "Kronika" and before "Powtórki". The name stays plain. "Wernisaż" (the opening) is used in texts where the moment of opening fits, for example the empty list. "Salony", "Teki", "Opowieści" and "Wernisaże" were considered. A vernissage is an event, not the exhibition.
- The list shows the exhibitions as posters in a grid of three: the cover (the first artwork of the document), the title in Newsreader italic, the number of artworks and the last change. It was chosen over catalogue rows and rows with a strip of thumbnails. The choice is provisional and may change on the build.
- The artwork view shows "Na N wystawach" as a disclosure under "Widziane na żywo", like the visits, with the cover, title and number of artworks of each exhibition.

### Viewing

- Text blocks keep `--size-content-default` (720 px) for comfortable lines. Artworks and rows go up to `--size-content-wide` (1280 px), aligned left with the text. The owner chose this over everything at 720 px, text at 720 px with images at 1080 px centred, and everything at 1280 px (text lines of about 170 characters). A text needs a row to be wider.
- An artwork in Archiwum or deleted for good shows as the library `NoImage` frame (4:5, the catalogue cross) in view and edit mode, with no caption. A restored artwork comes back in its place.

### Editing

- "Edytuj" in the top bar opens edit mode on the same page, which looks like the finished exhibition. "Gotowe" goes back, and a quiet "Zapisano" in the top bar shows that the last change is saved.
- A side panel "Dodaj do wystawy" at the right edge holds Akapit, Nagłówek, Cytat and the artworks, with a search (title, author, record number), the artworks added last and "Przeglądaj całe atelier…". It collapses like the wall filters, with the same width animation. It is open when edit mode starts, and its state is remembered on the device.
- One contextual bar stands over the clicked block: move, up, down, the image, Paleta, Tylko paleta, Notatka, Zbliżenie and "Usuń z wystawy" for an artwork, and the block kind and bold and italic for a text. There is no `/` menu. The bar is placed like the library `PopoverCard`: above the block, or below it when there is no room, and shifted sideways. Its boundary is the document column, not the window, so it never covers the panel.
- While a block is dragged beside a row of two, a dashed empty slot opens where it will land and the two blocks narrow to a third at once. Only the style of the row changes while dragging, and the document changes on the drop. Beside a row of three no slot opens, and the hint says the row is full.
- On a phone nothing is dragged. "Dodaj do wystawy" at the bottom opens the panel from below, and a tap adds a block under the selected one. The bar has up and down and "Obok poprzedniego", which makes a row. Phone editing is a separate step of the build. If it brings many problems, the phone only shows exhibitions.

### Deleting

- Deleting an exhibition moves it to Archiwum, which so far held only artworks ([ADR-0028](0028-trash-as-a-list-with-confirmed-deletes.md)). Archiwum gets the tabs "Dzieła" and "Wystawy" (library `Tabs`, no counters). An exhibition row there looks like an artwork row and has "Przywróć" and "Usuń na zawsze". An exhibition in Archiwum is left out of the list and of "Na wystawach". Its artworks always stay in the atelier.

### Texts

The texts were chosen by the owner from a table of variants. They are in [requirements](../product/requirements.md) R-200 to R-213 and in the build issues. The lead of the list is "Opowieści, które układasz z dzieł swojego atelier. Wystawy pozwalają wykorzystać kolekcję do szukania powiązań w sztuce, budowania porównań i zapisywania własnych komentarzy." The empty list says "Pierwszy wernisaż dopiero przed Tobą" and "Wybierz temat przewodni i zbuduj jego historię z dzieł Twojego atelier i własnych wniosków."

### Consequences

- Good: the learner can build a whole argument from the atelier, and the palette and the comparison of 0.21 have a natural place.
- Good: text as a block, drops only between blocks and self-managing rows keep the layout hard to break.
- Good: the exhibition reuses the notes editor, the wall's side panel, `PopoverCard` placement, `NoImage` and Archiwum.
- Bad: a second deleted kind in Archiwum makes that view more complex.
- Bad: autosave without a draft means a half-finished edit is what the exhibition shows, which is fine only while exhibitions are private.
- Bad: phone editing may turn out to be read-only.

## More information

Design issue [ATL-130](https://linear.app/kamil-nawrot/issue/ATL-130), builds ATL-542 (module and document) and ATL-543 (rows, palette, close-ups, "Na wystawach"). The data model is [ADR-0199](0199-store-an-exhibition-as-one-document-with-rows-of-its-artworks.md). The prototype is linked in ATL-130. The mockups, the texts table and the model drafts are in the project files under `wystawy-0-21/`. Where the prototype or a mockup differs from this ADR, the ADR wins.
