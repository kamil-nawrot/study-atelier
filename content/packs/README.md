# Packs of artworks

Curated packs of artworks prepared in the spike ATL-856. Each pack is a folder with a `pack.json`, written by hand from Wikidata and Wikimedia Commons and curated by the owner.

## The source file

`pack.json` is ordered by artwork; values are given by name and linked by keys inside the file.

- `slug`, `title`, `description` and `era` (the era code of every artwork).
- `periods`: a key, the Polish name and a one-sentence `summary` that any learner can read.
- `materials`: a key and the Polish name.
- `cities`: the real town of each museum, with its Wikidata id, country code and position, also when the town is missing from the towns catalogue.
- `places`: a museum with its name under the naming rule of [ADR-0267](../../docs/decisions/0267-keep-the-starter-list-of-museums-to-art-collections-under-one-naming-rule.md), its Wikidata id, its city and `catalogue: true` when it is on the starter list.
- `artworks`: the Wikidata id, title, type, years (`from`, `to`, `approximate`; BCE years are negative), period and material keys, the place where the artwork is today, one Commons image and a short `note` written for the pack, not copied from Wikipedia.

## Rules

- An image shows the original, never a replica or a cast, and its shorter side has at least 1000 px. An artwork without such an image leaves the pack.
- The attribution is the author's name as the author asks to be credited, not the raw text of the Commons page.
- The find site and other facts go in the note; the place is the museum.

## Building

```sh
node tools/packs/build-pack.mjs content/packs/<slug>
```

The script checks the pack and writes `tmp/packs/study-atelier-pack-<slug>.zip` in the export format of [ADR-0121](../../docs/decisions/0121-export-the-atelier-as-a-zip-file.md), which the import of [ADR-0122](../../docs/decisions/0122-import-an-atelier-into-an-empty-atelier-through-one-function.md) loads into an empty atelier.
