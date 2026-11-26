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

## Images

The images are resized copies from Commons and other freely licensed sources, stored once for all learners, and each carries its licence and attribution. An artwork image taken from an album is a row of `artwork_images` with `album_image_path` (`<slug>/images/<name>`), the licence columns and the Wikidata id of the artwork in `source_wikidata_id`, and no other source. It does not count towards the storage of an account and is never removed by the cleanup of unused images, which reads only `own_image_path`. The app shows it with "Z albumu" and its licence and attribution where a Commons image shows "Wikimedia Commons".

## The link of an artwork to its entry

`artworks.album_entry` (`<slug>/<entry id>`) and `artworks.album_revision` are both set or both empty. `save_artwork` stores them for a new artwork and changes them on an edit only when the artwork it is given has the keys, so the usual form keeps them. The export carries both columns and the album image path, and `import_atelier` restores them.
