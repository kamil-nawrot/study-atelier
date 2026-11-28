# Albums

An album is a curated set of artworks on one theme, with the values, glossary terms, figures and timeline events around them, which a learner can take into the atelier through the usual forms ([ADR-0347](../decisions/0347-offer-curated-albums-of-artworks-to-take-into-the-atelier.md)). Albums are static files of the app, published by pull request and release; nothing about an album lives in the database except the link of a taken artwork to its entry.

## Files

```
apps/web/static/albums/
  index.json                 the published albums
  <slug>/
    album.json               the entries, without texts
    pl.json                  the texts of one language, one file per language
    images/<name>.webp       resized copies of the images, .webp, .jpg or .png
```

The app reads them with `#lib/albums/album-files/album-files.ts` and serves the images from `/albums/<slug>/images/<name>`. Every file is checked by `#lib/albums/album-folder/album-folder.ts`, whose spec runs on the real folder in CI and in `pnpm verify` whenever a file under `static/albums` or `src/lib/albums` changes. The checks name the file and the field of every error, and refuse unknown keys, so a typo does not pass silently.

### index.json

```json
{ "format": 1, "albums": [{ "slug": "sample-album", "languages": ["pl"], "sample": true }] }
```

Every folder is listed once, with exactly the languages of its text files. An album with `"sample": true` is listed only in development and tests; `sample-album` is the made-up album the tests use. `paleolithic-venuses` ("Wenus paleolityczne") is the first real album, 13 sculptures of the Upper Palaeolithic; it is listed in production. A museum of an album has no city in the format, so its text names the city in its summary.

### album.json

| Field               | Holds                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format`            | `1`                                                                                                                                                                                                              |
| `era`               | the era the list of albums groups it under, set by the curator                                                                                                                                                   |
| `artworks`          | at least one artwork: `id`, `revision`, `images` (1 to 5), and optionally `wikidata`, `type`, `era`, `yearFrom`, `yearTo`, `yearApproximate`, `values`, `terms` and `events` (ids of the album's entries below)  |
| `artworks[].images` | `file` (`images/<name>.<webp, jpg or png>`), `width` and `height` of the file, `licence`, and optionally `licenceUrl`, `attribution` and `source` (the page the image came from, for the curator only)           |
| `values`            | `id`, `revision`, `category` (`author`, `period`, `style`, `material`, `location`), optionally `wikidata`; an author also `birthYear`, `deathYear`, `yearsApproximate`, a location `countryCode` and `placeType` |
| `terms`             | glossary entries: `id`, `revision`, `kind` (`term` or `figure`), optionally `category` of that kind and `wikidata`; a figure also `birthYear`, `deathYear`, `yearsApproximate`                                   |
| `events`            | timeline events: `id`, `revision`, `yearTo`, optionally `yearFrom` (before `yearTo`) and `yearApproximate`                                                                                                       |

An id is a lowercase slug (`venus-of-willendorf`), unique among the entries of its kind in the album and never changed once published. The revision is a whole number that the curator raises whenever the entry changes, so an atelier can tell that it took an older version. Years are signed whole numbers without a year 0, as in the forms. An artwork has no author when it names no `author` value, and at most one location.

### Texts: pl.json

`format`, `title`, `description` of the album, and the texts of every entry by its id: an artwork `title`, `alternativeTitles` and `description`; a value `name`, `alternativeNames`, `summary` (300 characters), `description` and, for an author, `country`; a term or figure `name`, `alternativeNames`, `definition`, a figure's `country` and a `source` (`title`, `url`, `licence`) of the definition; an event `name`, `description` (300 characters) and `source`. Every entry of `album.json` has its texts and no other entry has any.

The alternative names are kept with the texts, not in `album.json` as the ADR says, because they are words of one language, like the names they stand for.

## Albums in the app

"Albumy", the first of the smaller items of the menu, opens `/atelier/albums`: every album listed in the app's language, grouped under the era of `album.json` with the era rows of Kartoteka (`CardIndexEra` on `CardIndexEraAxis`, folded per device under `study-atelier:albums-folded-eras`). An album opens at `/atelier/albums/<slug>` as a wall of `TickTile`s laid out like the Atelier wall (`distribute` and `columnCount`, two columns on a phone). An album that is not listed, such as the sample album in production, is not found. The `(app)` layout loads `albumsListed` beside the other menu data; while it is false the menu has no "Albumy" item and the wall gives no albums hint, so the list is empty only when opened by its address.

Both views ask the database only for the learner's artworks that can match (`album-matches-data.ts`): the artworks outside Archiwum whose `album_entry` starts with the album's slug or, in the gallery, whose title is one of the album's titles (`ilike`, then compared exactly ignoring letter case in the app), and the images whose `source_wikidata_id` is the Wikidata id of an album artwork. An album artwork is in the atelier when an artwork was taken from its entry or has its Wikidata id, and only looks similar when the titles are equal (`album-matching.ts`). "Dodaj N dzieł" hands the ticked entry ids to `onadd` of `AlbumGallery`, which opens `/atelier/albums/<slug>/add?entries=<ids>` (`albumAddHref` in `#lib/albums/album-add-address/album-add-address.ts`).

## Images

The images are resized copies from Commons and other freely licensed sources, stored once for all learners, and each carries its licence and attribution. An artwork image taken from an album is a row of `artwork_images` with `album_image_path` (`<slug>/images/<name>`), the licence columns and the Wikidata id of the artwork in `source_wikidata_id`, and no other source. It does not count towards the storage of an account and is never removed by the cleanup of unused images, which reads only `own_image_path`. The app shows it with "Z albumu" and its licence and attribution where a Commons image shows "Wikimedia Commons".

## The link of an artwork to its entry

`artworks.album_entry` (`<slug>/<entry id>`) and `artworks.album_revision` are both set or both empty. `save_artwork` stores them for a new artwork and changes them on an edit only when the artwork it is given has the keys, so the usual form keeps them. The export carries both columns and the album image path, and `import_atelier` restores them.

## Matching the learner's values

A value of an album is the learner's value when the Wikidata id matches, when the name is the same ignoring letter case, or when one of its alternative names is ([ADR-0347](../decisions/0347-offer-curated-albums-of-artworks-to-take-into-the-atelier.md)). The Wikidata id of an author is the one of the author's portrait (`author_details.source_wikidata_id`) and of a place `location_details.wikidata_id`; periods, styles and materials have none and match by name only. `#lib/albums/album-values-data/album-values-data.ts` asks only for the values with those names (an exact `ilike` per name) and those ids, never for the whole card index, and `#lib/albums/album-version/album-version.ts` turns an album artwork into an artwork with the learner's names, listing the values that would be new.

## Comparing an artwork with its album version

The comparison of an artwork with its album version opens at `/atelier/compare?left=<record number>&album=<slug>/<entry id>` (`compareAlbumHref` in `#lib/compare/compare-address/compare-address.ts`). `#lib/compare/album-merge/album-merge.ts` decides the action of every row: a single value is moved into an empty field or replaces a different one, a list gets the album's values it lacks, and the album's description is appended to the note after an empty line. Values that differ only in letter case count as the same. An album image is offered while the artwork has fewer than five images, counting the ones already taken in the comparison, and is added after the artwork's own images. "Zapisz zmiany" saves the merged artwork through `saveArtwork` with the album entry and its revision; it is also enabled with no change when the artwork was taken from this entry at an older revision, so the learner can record the newer revision after reading it. Saving also links an artwork that was found only by its Wikidata id or a similar title to the entry, so the album shows it as taken from then on. The view of a taken artwork reads its album with the same loader and shows the notice of a newer revision when the album's entry has a higher revision than the artwork remembers.

## Taking the artworks one by one

`/atelier/albums/<slug>/add?entries=<ids>` reads the album and keeps the ticked entries in the order of the album (`artworksToAdd`); an address without a known entry returns to the gallery. The page creates an `AlbumWalk` (`#lib/albums/album-walk/album-walk.svelte.ts`), which holds the position, the outcome of every artwork (saved or skipped) and the album version of the open one. It loads that version only when the artwork opens (`loadArtworkVersion`), so values created by the artworks saved before are matched too. `AlbumWalkForm` renders the usual `ArtworkForm` for it, keyed by the entry: `prefill` fills the form from the version, `album` adds the entry and revision to what `saveArtwork` stores, `newValues` marks the values that are new with "nowa wartość" (`ValueField` `marked`), and `secondary` adds "Pomiń" beside the primary button; "Save and next" of the usual form is off. `AlbumWalkBar` shows the strip of thumbnails and the position in the top bar. "Zakończ" asks to discard unsaved changes of the open artwork, and ending the walk, early or after the last artwork, returns to the gallery with the message "Gotowe, z albumu „…” dodano N dzieł." in `page.state.albumMessage`. "Mam je już w atelier" beside "Pomiń" switches the walk to `picking` ([ADR-0353](../decisions/0353-pick-an-atelier-artwork-by-hand-while-adding-from-an-album.md)): `AlbumWalkForm` shows the `ComparisonPicker` of the comparison with `onpick`, so a plain click on a tile hands its record number over instead of following the link to the artwork's page, and `compareWith` loads that artwork and opens it as the comparison of a similar one, remembered for the entry so the comparison shows "Porównujesz je z dziełem …". Going back to the form drops a pick still loading.

## The closing step: terms, figures, events and Kartoteka

The add page runs an `AlbumAdd` (`#lib/albums/album-add/album-add.svelte.ts`), which owns the `AlbumWalk` and moves through the phases `artworks`, `loading`, `choose`, `items` and `done`. When the walk ends, early or after the last artwork, `albumItems` (`#lib/albums/album-items/album-items.ts`) lists what the album holds besides artworks, and the page goes straight to the gallery if that list is empty.

- `loadItemData` (`album-items-data`) reads what the learner has under the album's names: the glossary index and the entries whose name or alternative name is the same ignoring case, the timeline events of the same names (`loadTimelineEventsByName`), and the card index records with their details. Matching is certain only, like the values of an artwork (`sameName`).
- Every item is a term or figure (parts "Pojęcia" and "Postacie"), an event, or a Kartoteka value of the category author, location, period or style that has a summary or a description. Its state is `new`, `present` (everything the album gives is already there; not selectable), `fill` (the learner's text, years, country or place are empty where the album has them) or `description` (the learner has notes that lack the album's description).
- What belongs to the artworks that were saved starts ticked; the rest starts unticked. "Pomiń wszystkie" ends the step, "Dodaj N elementów" opens each ticked item in its own form.
- `AlbumItemForm` reuses `GlossaryForm`, `EventForm` and `ValueForm` with `prefill` (the drafts of `album-item-drafts`: a new item takes everything from the album with its source; an existing one only fills the fields the learner left empty), `labels` and the `secondary` snippet holding "Pomiń". The forms' unsaved-changes check compares with the prefilled start, so "Zakończ" does not ask while nothing was edited. For the state `description`, `ValueForm` shows "Dopisz na końcu notatki" under the notes, which appends the album's text to the learner's notes.
- The end message counts the artworks and the other items: "Gotowe, z albumu „…” dodano N dzieł oraz M innych elementów."
