# 0325. Remember images that stopped loading and list them in Zaplecze

- Status: accepted
- Date: 2026-11-19

## Context and problem statement

Zaplecze lists an artwork as missing an image only when no image is attached ([ADR-0313](0313-collect-flagged-weak-items-and-missing-data-in-zaplecze.md)). An attached image whose file is gone is not detected: the wall shows "obraz niedostępny" and nothing remembers it ([ATL-811](https://linear.app/kamil-nawrot/issue/ATL-811)). The owner chose on 2026-11-19 to remember the failure when the browser meets it, without a manual "Sprawdź obrazy" button.

Facts checked in the code before the decisions:

- An image has one of three sources: a Commons file (`source_image_file`), an own file in Storage (`own_image_path`) and a link to another site (`own_image_url`).
- Storage answers `createSignedUrls` with an error per path for a file it does not have; when the whole request fails (no network), every own image of the batch shows as unavailable, so that state must not be stored.
- The Commons API answers a page with `missing` for a deleted or renamed file; a 429 or no answer ends the lookup without an answer.
- For a link the browser only says that the image did not load, with no status, so a site that is down for a moment looks the same as a deleted file.
- `save_artwork` keeps the ids of the images, and a trigger already forgets the palette of an image whose source changes.

## Decision drivers

- No false alarms: a moment without network or a busy Commons never marks an image.
- Writes only when the state changes, never one per view.
- The fix in Zaplecze opens the image field, and one artwork is one item of "Poprawiaj po kolei".

## Considered options

1. Which failures are stored: only the certain ones (own file, Commons file); also links after failing on two different days; every failure after the retry of `ArtworkImage`.
2. The row in "Braki danych": the reason added to the artwork's row of missing data; a separate row per broken image, at the top, with a tag of its source.
3. The review: hold the artwork while its main image is broken; ask as today with "obraz niedostępny".

## Decision outcome

Chosen by the owner on 2026-11-19: the first option of each question.

1. **Only certain failures.** An image is marked broken when Storage answers that its own file is gone, or the Commons API answers that its file is missing. A link to another site is never marked. The mark is cleared when the same source answers again with the file. Nothing is stored when the whole request fails or the browser is offline.
2. **Where it is checked.** The wall checks the main images when it signs own files and looks up Commons thumbnails (also in Zaplecze, Archiwum and other views that use the wall's images). The artwork view and the edit form check all own images when they sign them; a Commons image is checked when it fails to load on the stage, and an image already marked is checked again when the artwork opens.
3. **Data.** `artwork_images.broken_at timestamptz`, which the owner may update (RLS as for the palette). A write sets it only where it is null and clears it only where it is set, and only while the image still has the checked source. A session sends at most one write per image and state. A trigger clears it when the source of the image changes, so replacing the image in the form fixes it. A partial index on `owner_id where broken_at is not null` serves Zaplecze. Export and import carry the column like the palette; a stale mark clears itself on the next check.
4. **Zaplecze.** The artwork's row of missing data starts with "obraz nie działa" for the main image or "obraz {n} nie działa" for another, before "brak stylu" and "brak roku". "Popraw" and "Poprawiaj po kolei" open the image field first, and the thumbnail of a broken main image shows the crossed image icon. The menu count stays the learner's flags only.
5. **Review.** `review_round` holds an artwork whose main image is broken, like a held image flag ([ADR-0315](0315-skip-a-broken-review-question-and-hold-it-until-fixed.md)): it leaves the round, the menu count and the plan until the image is fixed. A broken extra image holds nothing.

### Texts

| Place                                                   | Text                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Reason, main image (row and note under the image field) | obraz nie działa                                                         |
| Reason, another image                                   | obraz {n} nie działa                                                     |
| Empty "Braki danych" tab                                | Wszystkie dzieła mają styl, rok i działający obraz, a pojęcia definicje. |

### Consequences

- Good: a gone file shows up in Zaplecze by itself, and its artwork stops asking questions without an image.
- Good: no false alarms and almost no writes; the stored state follows what the sources answer.
- Bad: a broken link to another site is not detected.
- Bad: an extra image is checked only when its artwork is opened, and an image remembered on the device is checked only after its address expires.

## More information

- Design files and mockups: `/mnt/project-files/atl-811/` (outside the repository).
- Builds on [ADR-0313](0313-collect-flagged-weak-items-and-missing-data-in-zaplecze.md) and [ADR-0315](0315-skip-a-broken-review-question-and-hold-it-until-fixed.md).
