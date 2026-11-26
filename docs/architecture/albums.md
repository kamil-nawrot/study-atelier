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

Every folder is listed once, with exactly the languages of its text files. An album with `"sample": true` is listed only in development and tests; `sample-album` is the made-up album the tests use.

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

"Albumy", the first of the smaller items of the menu, opens `/atelier/albums`: every album listed in the app's language, grouped under the era of `album.json` with the era rows of Kartoteka (`CardIndexEra` on `CardIndexEraAxis`, folded per device under `study-atelier:albums-folded-eras`). An album opens at `/atelier/albums/<slug>` as a wall of `TickTile`s laid out like the Atelier wall (`distribute` and `columnCount`, two columns on a phone). An album that is not listed, such as the sample album in production, is not found.

Both views ask the database only for the learner's artworks that can match (`album-matches-data.ts`): the artworks outside Archiwum whose `album_entry` starts with the album's slug or, in the gallery, whose title is one of the album's titles (`ilike`, then compared exactly ignoring letter case in the app), and the images whose `source_wikidata_id` is the Wikidata id of an album artwork. An album artwork is in the atelier when an artwork was taken from its entry or has its Wikidata id, and only looks similar when the titles are equal (`album-matching.ts`). "Dodaj N dzieł" hands the ticked entry ids to `onadd` of `AlbumGallery`, the start of the form flow.

## Images

The images are resized copies from Commons and other freely licensed sources, stored once for all learners, and each carries its licence and attribution. An artwork image taken from an album is a row of `artwork_images` with `album_image_path` (`<slug>/images/<name>`), the licence columns and the Wikidata id of the artwork in `source_wikidata_id`, and no other source. It does not count towards the storage of an account and is never removed by the cleanup of unused images, which reads only `own_image_path`. The app shows it with "Z albumu" and its licence and attribution where a Commons image shows "Wikimedia Commons".

## The link of an artwork to its entry

`artworks.album_entry` (`<slug>/<entry id>`) and `artworks.album_revision` are both set or both empty. `save_artwork` stores them for a new artwork and changes them on an edit only when the artwork it is given has the keys, so the usual form keeps them. The export carries both columns and the album image path, and `import_atelier` restores them.

## Matching the learner's values

A value of an album is the learner's value when the Wikidata id matches, when the name is the same ignoring letter case, or when one of its alternative names is ([ADR-0347](../decisions/0347-offer-curated-albums-of-artworks-to-take-into-the-atelier.md)). The Wikidata id of an author is the one of the author's portrait (`author_details.source_wikidata_id`) and of a place `location_details.wikidata_id`; periods, styles and materials have none and match by name only. `#lib/albums/album-values-data/album-values-data.ts` asks only for the values with those names (an exact `ilike` per name) and those ids, never for the whole card index, and `#lib/albums/album-version/album-version.ts` turns an album artwork into an artwork with the learner's names, listing the values that would be new.

## Comparing an artwork with its album version

The comparison of an artwork with its album version opens at `/atelier/compare?left=<record number>&album=<slug>/<entry id>` (`compareAlbumHref` in `#lib/compare/compare-address/compare-address.ts`). `#lib/compare/album-merge/album-merge.ts` decides the action of every row: a single value is moved into an empty field or replaces a different one, a list gets the album's values it lacks, and the album's description is appended to the note after an empty line. Values that differ only in letter case count as the same. An album image is offered while the artwork has fewer than five images, counting the ones already taken in the comparison, and is added after the artwork's own images. "Zapisz zmiany" saves the merged artwork through `saveArtwork` with the album entry and its revision; it is also enabled with no change when the artwork was taken from this entry at an older revision, so the learner can record the newer revision after reading it. Saving also links an artwork that was found only by its Wikidata id or a similar title to the entry, so the album shows it as taken from then on. The view of a taken artwork reads its album with the same loader and shows the notice of a newer revision when the album's entry has a higher revision than the artwork remembers.
