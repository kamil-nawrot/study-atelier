# 0347. Offer curated albums of artworks to take into the atelier

- Status: accepted; a similar title deciding nothing is superseded by [0348](0348-open-a-similar-album-artwork-as-a-comparison-while-adding.md); the actions of the comparison with an album version are superseded by [0349](0349-pick-the-values-to-keep-in-the-comparison-with-an-album-version.md); the comparison link of a similar tile is superseded by [0353](0353-pick-an-atelier-artwork-by-hand-while-adding-from-an-album.md)
- Date: 2026-11-26

## Context and problem statement

A learner builds the atelier artwork by artwork. An empty or small atelier gives the reviews, the wall and Kartoteka little to work with, and finding the first artworks of a topic costs time. The owner wants ready, curated sets of artworks on one theme ("Albumy") that a learner can take from, while the atelier stays the learner's own work: every artwork still passes through the learner's hands ([ATL-856](https://linear.app/kamil-nawrot/issue/ATL-856), the earlier ideas [ATL-465](https://linear.app/kamil-nawrot/issue/ATL-465) and [ATL-832](https://linear.app/kamil-nawrot/issue/ATL-832)).

How does a learner take artworks and their related data from an album, how does an album meet what the atelier already holds, and how is an album stored and published?

## Decision drivers

- Albums are an addition, not the main way to work: the learner still writes each artwork in the form, with own fields and own wording, and earns the usual points.
- Nothing is added silently: every artwork, term, event and description from an album is shown to the learner before it is saved.
- Matching what the atelier already holds stays simple and predictable, both in the code and on the screen; free-text values are not guessed.
- An album is made outside the app by the owner, who is its only curator and answers for the licences of its images. The app receives the finished product.
- An album can later be translated without a change in the code ([ADR-0015](0015-typed-message-dictionaries-for-i18n.md)).

## Considered options

Taking artworks:

1. Add the ticked artworks at once, with an optional edit afterwards.
2. Tick the artworks in a gallery, then go through the add form for each ticked artwork, prefilled from the album.

Matching values and artworks:

1. Similarity of names (as the value suggestions of the form do) for every value and every artwork.
2. Only certain matches: the Wikidata id, the same name ignoring letter case, or an alternative name given by the curator; everything else comes in as a new value, marked as such.

An artwork the learner already has:

1. Skip it.
2. Fill its empty fields silently.
3. Compare it with the album's version and let the learner merge them field by field.

Storage of an album:

1. Rows in the database, filled by a migration.
2. Static files in the repository, published by pull request and release, as the exhibits are.

Images:

1. Links to Commons and to the other sources.
2. Resized copies stored next to the album's files, one copy for all learners.

The link between an artwork and its album:

1. Two columns on the artwork: the album entry and its revision.
2. A separate table of everything taken from every album.

## Decision outcome

Chosen by the owner: option 2 for taking artworks, option 2 for matching, option 3 for an artwork already in the atelier, static files, resized copies and two columns on the artwork, because they keep the learner's work in the form, keep matching readable and keep an album a product the owner publishes like any other change.

### Albums in the app

- "Albumy" is a quiet item in the lower part of the menu. "Dodaj dzieło" does not change. A wall without artworks says under its greeting that Albumy can help to start, and a wall with fewer than 5 artworks shows one line above the artworks that points to them. Announcements of new albums come later.
- The list of albums shows each album as a card with a mosaic of its images, its counts and how many of its artworks the learner already has. The cards are grouped by era with the same headers and folding as Kartoteka. The era of an album is set by the curator and does not follow the learner's era bounds ([ADR-0191](0191-let-the-learner-change-the-era-bounds.md)); an artwork taken from it keeps its own era.

### Taking artworks

- An album opens as a gallery that flows like the Atelier wall, in passe-partout tiles that are ticked as artworks are ticked for a visit ([ADR-0285](0285-tick-several-items-with-one-shared-tile.md)), with a search as wide as elsewhere and two columns on a phone. Every artwork the learner does not have yet starts ticked.
- The learner then goes through the add form once for each ticked artwork, prefilled from the album, with a strip of thumbnails in the top bar that shows the progress. "Pomiń" leaves one artwork out, "Zakończ" ends the artworks, and saving goes to the next one. Each saved artwork is a normal artwork with the usual points; there is no way to save them all at once.
- A value of the album is the learner's value when its Wikidata id matches, when its name is the same ignoring letter case, or when it matches one of the alternative names the curator gave it. Any other value comes in as a new value, marked "nowa wartość" in the field, so the learner can pick an own value instead. The app does not guess by similar names.

### An artwork the learner already has

- An album artwork is in the atelier for sure only when it was taken from that album entry or when its Wikidata id matches. The gallery marks it with the record number and does not tick it.
- A similar title only adds a line "Wygląda podobnie do #0007." to the tile, which opens the comparison; it decides nothing.
- The comparison of an artwork with the album's version extends "Porównaj" ([ADR-0203](0203-show-the-palette-on-the-stage-and-compare-two-artworks-side-by-side.md)): it lists the fields of both versions in rows, as [ATL-832](https://linear.app/kamil-nawrot/issue/ATL-832) asked for every comparison, and against an album version each row has an action that takes the value into the learner's artwork: moving it into an empty field, adding it to a list, replacing a value, and withdrawing the change. A replaced value stays struck through until the changes are saved. An image of the album is added as another image of the artwork, and the album's description is appended to the end of the note. Nothing is saved until "Zapisz zmiany".

### The closing step

- After the artworks, the album offers its other contents: glossary terms, figures, timeline events and descriptions of authors, places, periods and styles in Kartoteka. The items related to the saved artworks start ticked.
- Each item has its state: new, already in the atelier, filling empty fields of a value the learner has, or a new description where the learner has an own one. Filling the empty fields of a matched value happens here, never silently in the form.
- Each ticked item goes through its own form, as the artworks did. "Pomiń wszystkie" ends the album without them. The last message says how many artworks and other items were added.

### The album and the artwork afterwards

- A taken artwork remembers its album entry and the entry's revision. Its page says which album it came from, and when the album holds a newer revision of the entry it says so and opens the comparison; saving the comparison records the newer revision.
- Deleting a taken artwork works as for any artwork: it goes to the archive, and the album shows it as not taken again.
- Withdrawing an album from the app changes nothing in any atelier: the artworks stay, only the notice of a newer revision goes.
- The export and the import of an atelier carry the album entry and the revision with the artwork ([ADR-0121](0121-export-the-atelier-as-a-zip-file.md), [ADR-0122](0122-import-an-atelier-into-an-empty-atelier-through-one-function.md)).
- Glossary terms, figures, events and descriptions do not remember an album; they are matched by their Wikidata id and their name each time.

### Storage and publication

- An album is a folder `apps/web/static/albums/<slug>/` with a language-neutral file (entry ids, revisions, years, eras, Wikidata ids, images, licences and attributions, alternative names), one file of texts per language (titles, descriptions, glossary texts; Polish only for now) and the images. An album is listed only in the languages that have its text file; texts taken into an atelier become the learner's data in that language.
- Every entry has a stable id and a revision number that grows when the curator changes it.
- The files are checked against a schema in `pnpm verify`, and a new or changed album reaches the app through a pull request and a release.
- The images are resized copies from Commons and other freely licensed sources, each with its licence and attribution, stored once for all learners. They do not count towards the storage of an account ([ADR-0133](0133-limit-the-storage-and-the-rows-of-one-account.md)); the row limits still apply. An artwork image gets a new kind, an album image, shown with its licence and attribution as a Commons image is ([ADR-0007](0007-images-from-open-sources.md)).
- How an album is made, its research and the choice of its images, is a process outside the app's code.

### Consequences

- Good: an empty atelier can start from a theme, and every artwork still goes through the form, so the learner meets it and earns its points.
- Good: matching is explainable in one sentence, and anything uncertain is shown to the learner as new or as a comparison.
- Good: an album is versioned with the app, reviewed in a pull request and translated by adding a file.
- Good: the comparison gets the rows of information that [ATL-832](https://linear.app/kamil-nawrot/issue/ATL-832) asked for, for every pair of artworks.
- Bad: going through the form for ten artworks takes longer than a bulk add; the owner accepted it as the cost of learning.
- Bad: a value named differently by the learner and the album ("marmur" and "marmur z Carrary") comes in as a new value unless the learner picks the own one; the curator's alternative names reduce it.
- Bad: album images grow the repository and the deployed assets.
- Bad: the comparison is no longer only a viewing tool: against an album version it writes to the learner's artwork.

## More information

- Mockups and the chosen texts: `/mnt/project-files/atl-856/` (outside the repository); the texts are recorded in [ATL-856](https://linear.app/kamil-nawrot/issue/ATL-856).
- Requirements R-345 to R-356.
- Open for later: announcing new albums, and whether merging is offered between two of the learner's own artworks.
