# 0262. Show symbols as the victor's skull

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

Version 0.23 adds symbols to the glossary: recurring motifs with their meanings, marked on pins of the learner's artworks ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)). No exhibit of the display case counts them; "Biblioteka w Lejdzie" counts only the definitions of terms. The owner chose to cover the new area with a tiered exhibit. The look and the texts are designed first; the counting is built later in its own issue.

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after a thing or a place it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md), `voice-and-tone.md`).
- The engraving should be read through its symbols, as the learner reads the symbols of an artwork.
- The reward follows work and knowledge ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)): a symbol counts once it is shown on an artwork, not as a bare entry.
- A tiered exhibit's curiosities follow its own theme, one per tier, with a checked source each.

## Considered options

For the object:

- Athanasius Kircher, _Obeliscus Pamphilius_, Rome 1650: the fold-out plate of the four faces of the obelisk (Commons `Obeliscvs Pamphilivs 1650 (21965465).jpg`, Polona); Kircher read hieroglyphs as symbols. Kept for a later exhibit; his story became a curiosity.
- Crispijn de Passe, an owl in spectacles between torches and candles, in Gabriel Rollenhagen, _Nucleus emblematum_ II, Utrecht 1613: a small scan, and the candles repeat "Ćmy przy świecy".
- Wallerant Vaillant, a skull on a book in a niche, mezzotint, 1658–1677, Rijksmuseum RP-P-H-1086.
- Reinier van Persijn after Adriaen van Nieulandt, the title page of Ripa's _Iconologia, of uytbeeldingen des verstands_, Amsterdam 1644, Rijksmuseum RP-P-1884-A-7928, with Painting gagged and with a mask on a chain. Kept for a later exhibit.
- Jeremias Wachsmuth after Gottfried Eichler, "Tempus" and "Hora" from Hertel's edition of Ripa, Augsburg about 1758–1760, Rijksmuseum RP-P-1907-5401 and -5402: time repeats the orloj and the hourglass of the case.
- A vanitas still life with a laurelled skull, published by Gerard Valck (chosen).

The owner first ruled out Ripa's allegories as persons, then accepted that a person in the engraving does not exclude it; the object of the name still has to be a thing.

For the crop: the whole scene without the verse (`valck-vanitas-whole`); the skull with the candle (`valck-vanitas-skull-candle`); the skull with the bubbles (`valck-vanitas-skull-bubbles`), which cuts off the jaw. A mezzotint has no lines to trace, but the render keeps the skull and the laurel readable in every metal.

For the name: "Czaszka w laurach", "Czaszka w wieńcu laurowym", "Stół marności", "Laur zwycięzcy", "Wieniec zwycięzcy", "Czaszka zwycięzcy".

For the third curiosity: Artemisia Gentileschi's self-portrait as Painting after Ripa; Ripa's description of Painting alone; the Rijksmuseum's note that Ripa explained how to show abstract ideas through symbols. For the sixth: Erwin Panofsky's iconology; Jan van Eyck's _Arnolfini Portrait_, once read as a wedding.

## Decision outcome

Chosen by the owner in ATL-687.

### Counting

- A tiered exhibit counting the symbols that have at least one pin on an artwork outside the trash, with six tiers at 1, 5, 10, 25, 50 and 100. The local data had no symbols yet, so the thresholds follow "Biblioteka w Lejdzie" (definitions, 1 to 500) at a lower scale, since a symbol on a pin is more work than a definition. What happens to a deleted pin or symbol is settled in the build's issue.

### Display case

- Object: a skull crowned with laurel lying on an open music book, with a snuffed candle, a book with a skeleton, a cup, a flower and soap bubbles. The verse under the plate reads "Geen overwinnaer noyt soo groot / Sijn hooft verciert met louwer bladen / Of hij moet swichten voor de Doot / Want bij die Vorst is geen genade": no victor is so great, his head decked with laurel, that he need not yield to Death, for that prince has no mercy.
- Engraving: anonymous, published by Gerard Valck, _Vanitas stilleven_, mezzotint, 1662–1726, Rijksmuseum RP-P-OB-17.493 (Hollstein Dutch 236), CC0, Commons `Vanitas stilleven, RP-P-OB-17.493.jpg`. The whole scene without the verse, variant `valck-vanitas-whole` in `tools/exhibit-art/manifest.json`; the other two crops stay as alternatives.
- Credit: Autor nieznany, wyd. Gerard Valck, „Martwa natura vanitas”, 1662–1726.
- Exhibit code: `laurel_skull`.
- The room of the display case: Skryptorium, right after `glossary` ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).
- Name "Czaszka zwycięzcy", after the verse of the plate: the laurel is the victor's wreath, and the skull says what it is worth before death.
- The counter label: "symboli wskazanych na dziełach", as in "3 z 5 symboli wskazanych na dziełach".
- The story of the object: "Na mezzotincie wydanej przez Gerarda Valcka czaszka w laurowym wieńcu leży na nutach obok zgaszonej świecy, a wiersz pod nią przypomina, że przed Śmiercią ustąpi każdy zwycięzca."
- Theme of the curiosities, a new row in `voice-and-tone.md`: how symbols were read: vanitas, emblem books, Ripa's _Iconologia_, hieroglyphs taken for symbols and iconology.
- The curiosities of its tiers:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                                                                           | Source                                                                                                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | „Homo bulla”, czyli „człowiek jest bańką”, to starożytne powiedzenie, które w XVI wieku przywrócił Erazm z Rotterdamu w zbiorze przysłów „Adagia”. Bańka jest krucha i piękna tylko przez chwilę, zanim pęknie, dlatego malarze przedstawiali dzieci puszczające bańki, by mówić o kruchości ludzkiego życia.                                                                       | [V&A](https://collections.vam.ac.uk/item/O127482/children-blowing-bubbles-oil-painting-unknown/)                                                                                                |
| 2    | Pierwszą drukowaną książką uznaną za księgę symboli był „Emblematum liber” Andrei Alciata, wydany w Augsburgu 28 lutego 1531 roku. Miał 104 emblematy, z czego 97 z drzeworytami, które zamówił humanista Conrad Peutinger. Sam Alciato najpewniej nie miał z tym wydaniem nic wspólnego.                                                                                           | [University of Glasgow](https://www.emblems.arts.gla.ac.uk/alciato/books.php?id=A31a)                                                                                                           |
| 3    | „Iconologia” Cesarego Ripy, podręcznik symboli dla artystów, opisuje Malarstwo jako kobietę o rozwichrzonych czarnych włosach, z ustami przewiązanymi chustą, bo malarstwo jest nieme, i z maską na złotym łańcuchu. Artemisia Gentileschi namalowała się jako ta alegoria, pomijając knebel. Jej koledzy mężczyźni nie mogli tak utożsamić się z kobiecą personifikacją Malarstwa. | [Royal Collection Trust](https://www.rct.uk/collection/exhibitions/the-art-of-italy-in-the-royal-collection/the-queens-gallery-buckingham/self-portrait-as-the-allegory-of-painting-la-pittura) |
| 4    | W XVII wieku jezuitę Athanasiusa Kirchera, jednego z pierwszych badaczy starożytnego Egiptu, uważano za tego, który odczytał hieroglify. W 1650 roku wydał w Rzymie przekład napisów z obelisku, który do dziś stoi na Fontannie Czterech Rzek Berniniego. Przekład był błędny, a hieroglify odczytano naprawdę dopiero 150 lat później.                                            | [Loyola Marymount University](https://digitalcommons.lmu.edu/mobydick-asc-galleryexhibit/20/)                                                                                                   |
| 5    | Grecki autor Horapollon z Aleksandrii objaśniał w V wieku znaczenia hieroglifów, a według jego dzieła czytano je potem jak szyfr-rebus dla wtajemniczonych, który nie zapisuje mowy. Dopiero w 1822 roku Jean-François Champollion pokazał na imionach Ptolemeusza i Kleopatry, że Egipcjanie zapisywali obce imiona znakami oddającymi dźwięki.                                    | [BnF Essentiels](https://essentiels.bnf.fr/fr/article/1fa13963-21a8-4e08-950a-05f6515b7d34-1822-champollion-perce-secret-hieroglyphes)                                                          |
| 6    | Niemiecki historyk sztuki Erwin Panofsky w 1934 roku wyemigrował na stałe do Stanów Zjednoczonych. W książce „Studies in Iconology” z 1939 roku oddzielił ikonologię od ikonografii, czyli odczytywania tematów dzieł przez symbole znane z literatury i innych dzieł sztuki.                                                                                                       | [Dictionary of Art Historians](https://arthistorians.info/panofskye/)                                                                                                                           |

The Royal Collection page refused automated reading, so the owner pasted its text. "Księga symboli" in the second curiosity is the owner's deliberate simplification of "emblem book", to avoid repeating "emblematy". The sixth curiosity does not call Panofsky the first permanent professor of the Institute for Advanced Study, as the dictionary does: the Institute's own pages name Benjamin Meritt as its first professor in humanistic studies and Panofsky as the second, in 1935. The fourth and fifth curiosities pair Kircher's error with its correction.

### Consequences

- Good: the exhibit rewards symbols shown on artworks, the work of the atlas of symbols, and its engraving is itself read through its symbols.
- Good: the curiosities lead from a single motif to a method of art history, and the fourth and fifth tell a misreading of signs and its correction.
- Bad: a mezzotint is darker and softer than the line engravings of the case.
- Bad: the thresholds were not checked against real data, since no learner had symbols when the exhibit was designed.

## More information

Designed in ATL-687; the build, with the counting, is ATL-692. The WebP images go to `apps/web/static/exhibits/laurel_skull/` with `exhibit-art publish --only laurel_skull` once the exhibit exists in the app and the database.
