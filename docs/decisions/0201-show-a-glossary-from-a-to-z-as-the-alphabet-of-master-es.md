# 0201. Show a glossary from A to Z as the alphabet of Master E.S.

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

The owner wants a hidden single-tier exhibit of the display case for a glossary with an entry on every letter of the alphabet, which sends the learner after rare terms (idea ATL-515), like "Paszcza prawdy", "Pinakoteka motyli" and "Fontanna di Trevi" ([ADR-0187](0187-reward-a-sent-idea-with-a-hidden-exhibit.md), [ADR-0193](0193-show-an-image-full-of-pins-as-a-butterfly-pinacotheca.md), [ADR-0196](0196-show-an-artwork-seen-twice-as-the-trevi-fountain.md)). "Biblioteka w Lejdzie" counts the entries only; the glossary groups them by their first letter. Which alphabet counts, which object and engraving does the exhibit show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A hidden exhibit keeps its secret until found, but its hint still points the way through the motif of its engraving (`voice-and-tone.md`).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.
- The owner's glossary on 2026-11-06 held six entries, on K, M, Q, S, Ś and T.

## Considered options

For the alphabet: the 26 letters A–Z, a letter with a diacritic counting as its base letter, which needs foreign terms or names on Q, V and X (quattrocento, veduta, xoanon, Velázquez); the 23 letters of the Polish alphabet without diacritics, A–Z without Q, V and X; the full Polish alphabet of 32 letters, which no glossary can complete, since no word starts with Ą, Ę or Ń.

For the object: a letter of the Figure Alphabet of Master E.S., c. 1466–1467; the plate "Imprimerie en Lettres, l'Opération de la casse" of the _Encyclopédie_ (CC0), with compositors at their type cases; a collage of several letters of the Figure Alphabet.

For the letter and its scan: the letter E at the Metropolitan Museum of Art (CC0, 2660 × 3276); the letter A as a book reproduction on Wikimedia Commons, plain or with generated wall hatching; the letter A by Israhel van Meckenem after Master E.S. in the Kupferstichkabinett of the Staatliche Museen zu Berlin (Public Domain Mark), with its mount or within the plate, with generated hatching or without, at the archive's tone or with stronger contrast. Two photographs of the letters H and N on Commons are CC BY-SA, which the exhibits do not use.

For the name: "Figuralna litera A"; "Litera A Mistrza E.S."; "Zwierzęca litera A"; "Alfabet Mistrza E.S.".

For the hint: "Mistrzowi wystarczyły 23 litery. Tobie też wystarczą."; "Lew zaczyna, ale ktoś musi skończyć."; "Kto ma już A, niech szuka Z."; "W tym alfabecie nawet zwierzęta trzymają szyk."; "Bestiarium ma swoje A. A czy ma swoje Z?"; "Mistrz E.S. podpisywał się dwiema literami. Tobie trzeba ich wszystkich."; "Z ludzi i zwierząt można ułożyć każdą literę. A z Twoich słów?"; "Lew zaczyna alfabet, ale do końca jeszcze daleko."; "Najtrudniej znaleźć słowo na przedostatnią literę."; "Każda litera czeka na swoje słowo."; "Bestie trzymają szyk, dopóki żadnej litery nie zabraknie."; "Kto powiedział A, ten nie spocznie przed Z."; "Kto powiedział A, musi dojść do Z."; "Kto powiedział A, nie może zatrzymać się na B."; "Prawdziwy znawca zna sztukę od A do Z."; "Prawdziwy koneser zna sztukę od A do Z."; "Prawdziwy znawca zgłębił sztukę od A do Z.".

For what it was awarded for: "Za pojęcia na każdą literę od A do Z."; "Za słowniczek od A do Z."; "Za pojęcia w Słowniczku na każdą literę alfabetu.".

For the curiosity: Israhel van Meckenem's copies after Master E.S.; Master E.S.'s two decks of playing cards; Master E.S. himself, his monogram, his goldsmith's punches and the 23 surviving letters.

## Decision outcome

Chosen by the owner in ATL-524.

### Counting

- The exhibit counts the 23 letters of the Polish alphabet without diacritics (A–Z without Q, V and X), a letter with a diacritic counting as its base letter (Ś as S, Ł as L). Y stays, the hardest letter, open to terms such as yamato-e or names such as Yves Klein. The number matches the 23 surviving letters of Master E.S. How the build reads the first letter of an entry is settled in its issue.

### Display case

- Object: the alphabet of Master E.S. The owner preferred the letter A, which opens the alphabet and matches the glossary's icon, to the better-photographed E. A collage of letters was dropped: the other letters on Commons are small scans of uneven tone.
- Engraving: the letter A, engraved by Israhel van Meckenem after the Figure Alphabet of Master E.S., in the Kupferstichkabinett of the Staatliche Museen zu Berlin, 92-1890, photo Volker-H. Schneider, marked with the Public Domain Mark 1.0 on the museum's [object page](https://id.smb.museum/object/1543315). The Albertina dates Meckenem's copies of the alphabet to the last third of the 15th century ([the letter z](https://sammlungenonline.albertina.at/objects/103670/der-buchstabe-z)). The crop of the plate with a narrow margin of its mount and stronger contrast, variant `meckenem-letter-a-smb-mount-close` in `tools/exhibit-art/manifest.json`; the other crops of this scan stay as alternatives, the book reproduction and the hatched variants as rejected. Generated hatching competed with the real texture of the paper.
- `exhibit-art` takes the image from the museum through `source_url` and `source_page`, since the scan is not on Commons.
- Credit: Israhel van Meckenem według Mistrza E.S., litera A z „Alfabetu figuralnego”, ostatnia tercja XV wieku.
- Exhibit code: `figure_alphabet`.
- Name "Alfabet Mistrza E.S.", the owner's own text.
- The story of the object: "Israhel van Meckenem wyrył w ostatniej tercji XV wieku literę A z figuralnego alfabetu Mistrza E.S., ułożoną z lwa, psów, ptaków i człowieka."
- The hint while hidden: "Prawdziwy znawca zgłębił sztukę od A do Z."
- What it was awarded for: "Za pojęcia w Słowniczku na każdą literę alfabetu.", the owner's own text.
- The curiosity of its tier, about the master himself so that it does not repeat the story of the object:

| Tier | Curiosity                                                                                                                                                                                                                                                                                                                                              | Source                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| 1    | O Mistrzu E.S. wiadomo niewiele, a przydomek zawdzięcza inicjałom, które pojawiają się na jego późniejszych pracach. Na to, że był z wykształcenia złotnikiem, wskazują punce – złotnicze narzędzia wbijane młotkiem w płytę, którymi wybijał wzory drobnych kwiatków i kółek. Jego figuralny alfabet przetrwał w 23 rzadkich, pojedynczych odbitkach. | [The Met, The Letter E](https://www.metmuseum.org/art/collection/search/428829) |

The Met page answered automated reading with HTTP 429, so the owner pasted its text. The Met's remark that alphabets of the period lack j, v and w is left out: a letter V of the same alphabet is on Commons. Master E.S.'s playing cards, from the Met's exhibition [The World in Play](https://www.metmuseum.org/exhibitions/listings/2016/world-in-play/exhibition-galleries), stay unused.

### Consequences

- Good: the exhibit sends the learner after rare terms on letters such as Y, and its 23 letters echo the 23 surviving prints of the master.
- Good: the first engraving of the case from a museum's own image service, a real impression with the texture of its paper.
- Bad: the scan is an old black-and-white archive photograph with grey paper; the stronger contrast only partly makes up for it.
- Bad: the source depends on the museum's image address, which the manifest pins and `exhibit-art` caches.

## More information

Designed in ATL-524 from the idea ATL-515; the build, with the counting, is ATL-550. The WebP images go to `apps/web/static/exhibits/figure_alphabet/` with `exhibit-art publish --only figure_alphabet` once the exhibit exists in the app and the database.
