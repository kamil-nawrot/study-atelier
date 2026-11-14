# 0290. Show a symbol from the atlas as a block of an exhibition

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

An exhibition can show a glossary term as the block "Hasło" ([ADR-0222](0222-show-a-glossary-term-as-a-block-of-an-exhibition.md)). Since 0.23 the glossary also holds an atlas of symbols with meanings and details cut from pins ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)). The owner asked how a symbol could stand in an exhibition as a block of its own, for example a skull beside a vanitas still life ([ATL-745](https://linear.app/kamil-nawrot/issue/ATL-745)), and asked for a proper discussion before anything is built.

## Decision drivers

- The editor stays hard to break, with few options ([ADR-0217](0217-show-block-tools-on-hover-over-a-quiet-edit-mode.md)); a block must not grow on its own when the atlas grows.
- The atlas stays the one place where a symbol and its meanings are written.
- The block looks like the symbol in the atlas and like the block "Hasło".

## Considered options

What the block shows:

- A text card like "Hasło": the name, the meanings and a link.
- The same card with the main detail of the symbol in a round lens.
- Every meaning with a strip of its details.

Which meanings: always all of them, all of them or one chosen in the block, or always one chosen when the block is added.

Where it is added: a section "Atlas symboli" of its own in "Przybornik", or a switch "Pojęcie | Symbol" in the section "Słowniczek".

A symbol without a detail with a crop: an empty lens as on the tile of the atlas, or a card without a lens.

## Decision outcome

Chosen by the owner on 2026-11-14, one question at a time with mockups on the sample exhibition "Światło i cień" (`/mnt/project-files/atl-745/` in the project files): the card with the main detail, all meanings or one chosen, a switch in the section "Słowniczek", and a card without a lens when the symbol has no detail with a crop. A strip of details was set aside because the block would grow with every new detail in the atlas.

- **Storage:** a new node `symbol` with the attribute `symbolId` (the id of a symbol of the atlas), the optional attribute `meaningId` (one of its meanings) and the position attributes `align` and `valign`. It holds nothing. It may stand in the document or in a column, not in a set. The database rejects any other shape, and the block counts against the limit of 300. It keeps references, so a meaning corrected in the atlas shows at once.
- **Look:** a framed card with a hairline border, at most 720 px wide, like "Hasło". On the left a round lens of 160 px, above the text on a phone; on the right the overline "Symbol" with the icon of symbols, the name in italics, the meanings numbered in italics and, when viewing, "Otwórz w atlasie symboli". The lens shows the main detail of the symbol ([ADR-0277](0277-let-the-learner-choose-the-main-detail-of-a-symbol-and-keep-its-contexts-optional.md)), or its newest detail with a crop when none is chosen. A symbol without a detail with a crop has no lens, and the card is text only.
- **One meaning:** the toolbox of the block has the field "Znaczenie" with "Wszystkie znaczenia" first and then the meanings of the symbol. A chosen meaning leaves only its text on the card, without a number, and the lens shows the main detail when it has that meaning, otherwise the newest detail of that meaning with a crop, otherwise no lens. The field is hidden for a symbol with fewer than two meanings.
- **Missing data:** a symbol deleted from the atlas shows "Tego symbolu nie ma już w atlasie." and is removed like any block. A chosen meaning deleted from the atlas makes the card show all meanings again. A symbol without meanings shows its name and the link.
- **Adding:** the section "Słowniczek" of "Przybornik" gets "Dodaj jako" with "Pojęcie" and "Symbol", in the style of "Dodaj jako" of the artworks. "Pojęcie" keeps the search of terms as it is; "Symbol" shows "Szukaj symbolu" with the placeholder "Nazwa symbolu", searched by name ignoring case and Polish letters, up to six symbols with the icon of symbols ("Symbole od A do Z", "Znalezione: N", "Nic nie pasuje. Sprawdź pisownię albo dodaj symbol w atlasie."; an empty atlas says "W atlasie nie ma jeszcze symboli."), and "Otwórz atlas symboli…" in a new tab. A click adds the symbol at the end, a drag puts it where it is dropped.
- **Toolbox:** what every block has ("Położenie", "W górę", "W dół", "Usuń z wystawy") and "Znaczenie". The block is named "Symbol", and a screen reader hears "Symbol z atlasu: {nazwa}".
- **Not chosen:** adding a symbol from a block "Szczegół". That block stores only the view of the loupe, not the pin, so it does not know which symbol it shows.

### Consequences

- Good: an exhibition can explain a motif right beside the artwork that shows it, with the learner's own detail, without copying the meanings.
- Good: the card has a fixed size, so the layout of an exhibition does not change when the atlas grows.
- Good: the import and export of the atelier keep the ids of symbols and meanings, so the references survive a round trip.
- Bad: the switch hides the symbols until the learner picks "Symbol".
- Bad: the exhibition page reads the symbols with their meanings and lenses when a symbol block is shown, and the panel needs the list of symbols.
- Bad: one migration more, because the database lists the nodes a document may hold.

## More information

Issue [ATL-745](https://linear.app/kamil-nawrot/issue/ATL-745); build [ATL-747](https://linear.app/kamil-nawrot/issue/ATL-747). Adds R-300 and R-301 and updates R-207 and R-233.
