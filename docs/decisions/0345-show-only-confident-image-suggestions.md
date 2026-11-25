# 0345. Show only confident image suggestions

- Status: accepted
- Date: 2026-11-24

## Context and problem statement

The image suggestions of the artwork form search Wikidata for the title and keep every item with an image except people, taxa and disambiguation pages. Without an author, the dialog "Które to dzieło?" also shows towns, rituals, horses, writing systems and general concepts whose name resembles the title ("Byblos", "Tower of London", "Balkon"). The portrait search of an author and of a glossary figure keeps humans only, so "Herkules" finds only Herkules I d'Este and "Święty Hieronim" finds nothing ([ATL-852](https://linear.app/kamil-nawrot/issue/ATL-852/show-only-confident-image-suggestions-for-an-artwork)).

Which candidates should the dialog show, so that noise goes and correct matches stay?

## Decision drivers

- A correct match must not be cut: the owner asked first for the risk, measured on the real collection.
- Candidates below the rule are removed, not hidden behind a button (the owner's choice).
- The search stays in the browser and does not get noticeably slower.

## Considered options

1. A type allow list, no general concepts, and a title that must contain the typed title.
2. A type allow list and no general concepts, without the title requirement.
3. Option 2, where a collection (P195) or a creator (P170, P84) also proves an object, and an item without any type is kept.

Each was measured on an export of the owner's production collection: 428 titles, 90 of them with a Wikidata match the owner had accepted.

| Option | Correct match kept (of 90) | Empty dialogs (of 428) | Cards removed (of 407 today) |
| ------ | -------------------------- | ---------------------- | ---------------------------- |
| Today  | 86                         | 199                    | 0                            |
| 1      | 72                         | 244                    | not counted                  |
| 2      | 83                         | 210                    | 44                           |
| 3      | 85                         | 205                    | 35                           |

## Decision outcome

Chosen option: 3, accepted by the owner on 2026-11-24, because it removes most of the noise and loses one correct match.

- A candidate stays when one of its types (P31) is, through its superclasses, a visual artwork (Q4502142), an archaeological artefact (Q220659), an architectural structure (Q811979), an archaeological site (Q839954) or a monument (Q4989906); or when it is in a collection, has a creator, or has no type at all.
- Audiovisual, written and musical works and periodicals never count as artworks, so a film named like a painting does not pass as a visual artwork.
- A candidate that is itself a class (has P279), such as "balkon" or "astronom", goes unless it has a creator or a collection.
- The author match works as before: when a candidate's creator matches an author, only those candidates are shown. Below it, the type of the form (buildings first for architecture, artworks first otherwise) and the distance from the year of the form only order the candidates; they never remove one.
- The title of a candidate does not have to contain the typed title: that requirement cut 14 of the 90 correct matches ("Zamek krzyżacki w Malborku" is "Zamek w Malborku" in Wikidata).
- The query reads the types, collections and superclasses of each item. Walking the superclasses of every candidate inside the search took a median of 1.9 s more and up to 40 s, so the app knows the 157 classes that the measured candidates used, and asks the Wikidata Query Service about any other class once per session, in batches of 30, at the same time as the Commons thumbnails are fetched. A class it could not ask about counts as unknown, so such a candidate needs a collection or a creator to stay.
- Portraits: an author is still looked for among humans only, since a broader search found the mythological Polydoros and Hades for two Greek sculptors. A glossary figure is also looked for among mythological, biblical and legendary characters and deities, and a saint prefix ("Święty", "Święta", "św.", "Błogosławiony", "bł.") is left out of the search. When the form has exact life years, a person born or dead more than 10 years away from them is left out; approximate years and years known only to the century do not filter. On the 18 portraits the owner had accepted, nothing is lost.
- The empty text of the portrait search speaks of a "postać" instead of an "osoba", since a figure may be a character.

### Consequences

- Good: 35 cards of towns, concepts, rituals and the like leave the dialog; without the noise, a single candidate for an artwork without an author is filled in by itself more often (R-110).
- Good: glossary figures from myth and the Bible get portraits, and saints are found by their name.
- Bad: Stela Hammurabiego and Płyta wiślicka are no longer suggested, because Wikidata types them as a code of law and as flooring, without a creator or a collection; a few odd items with a creator stay (the Artemis Accords for "Artemida"). A heritage designation (P1435) would save neither; a material (P186) would save Płyta wiślicka and no other dropped item of the collection, but the owner kept the rule without it. The stele itself is a separate item in the Louvre's collection that passes the rule, but it has no Polish label, so the search does not find it.
- The built code was compared with the code on `develop` on the same 428 titles: the correct match stays in 86 of 90 in both, the dialogs hold 372 cards instead of 396, and the time to the candidates is the same (median 0.70 s, the slowest 15 s in both).
- Bad: items that are buildings of the same name stay (Hôtel Byblos), and other artworks of the same title stay; only the author tells them apart.
- Bad: the list of known classes reflects the measured collection; other classes cost one more query the first time they appear.

## More information

- Finding the 199 titles that return nothing: [ATL-860](https://linear.app/kamil-nawrot/issue/ATL-860/find-artworks-wikidata-misses-through-polish-wikipedia). Semantic re-ranking and a language model for descriptive titles: questions of [ATL-857](https://linear.app/kamil-nawrot/issue/ATL-857/spike-read-a-museum-label-from-a-photo-with-workers-ai).
- The measurement scripts and data stayed in the owner's `tmp/atl-852/`, outside the repository.
