# 0028. Move artworks to a trash shown as a list, and confirm every delete

- Status: accepted; the empty trash is superseded by [0130](0130-show-empty-views-in-one-centred-pattern.md)
- Date: 2026-10-12

## Context and problem statement

Deleting an artwork moves it to the trash, from where the learner restores it or deletes it permanently ([R-23](../product/requirements.md#artworks)). [ADR-0026](0026-artwork-view-as-a-stage-with-an-information-panel.md) put "Usuń" in the top bar of the artwork view and [ADR-0023](0023-atelier-routes-and-commons-thumbnails.md) gave the trash the route `/atelier/trash`, which still shows a placeholder. What happens when the learner presses "Usuń", how does the trash look, and how do artworks leave it for good?

## Decision drivers

- A deleted artwork is easy to get back.
- Nothing is lost for good without the learner saying so.
- The trash is a place to tidy up, not to study artworks.
- No own backend ([ADR-0005](0005-no-custom-backend.md)), so nothing that runs on a schedule.

## Considered options

Moving to the trash:

1. Ask first: a dialog, then the wall with a toast
2. No question, a toast with "Cofnij"
3. No question, a toast only; the trash is the undo

The trash view:

1. The wall's tiles with the actions under each tile
2. A list with the actions in each row
3. The wall's tiles without actions; the artwork view of a trashed artwork holds the actions

Deleting permanently:

1. One artwork at a time
2. One at a time, plus "Opróżnij kosz" for all
3. One at a time, plus automatic deletion after 30 days

## Decision outcome

Chosen options: ask first, a list, one artwork at a time. The owner chose them in the project thread "ATL-64 Kosz" on 2026-10-12, with the mockups in the project files (`atl-64/`).

Moving to the trash:

- "Usuń" in the artwork view opens a small dialog "Przenieść #0042 do kosza?" with "Dzieło zniknie z atelier. Przywrócisz je z kosza.", "Anuluj" and "Przenieś do kosza".
- After confirming, the learner is back on the wall, where a toast says "Przeniesiono #0042 do kosza.".
- The artwork disappears from the wall and from suggestions of category values, and its page and edit form show "Nie ma dzieła #0042".

The trash view at `/atelier/trash`:

- The heading "Kosz" with the number of artworks, then a list across the full width of the content.
- Each row: a thumbnail cropped to 4:5 in the passe-partout, so every row has the same height whatever the image; the title in the title font; authors and date as on the wall's tile; "#0042 · w koszu od <date>" in small muted text; on the right "Przywróć" and "Usuń na zawsze" in `--color-danger`.
- Newest in the trash first.
- An empty trash shows "Kosz jest pusty." and "Wróć do atelier".
- On a phone the two actions are icon buttons with labels for assistive technology, as "Edytuj" and "Usuń" are in the artwork view.
- Rows do not open the artwork view: a trashed artwork is not shown until it is restored.

Restoring and deleting permanently:

- "Przywróć" restores at once, without a question, keeps the record number and shows the toast "Przywrócono #0042.".
- "Usuń na zawsze" opens a small dialog "Usunąć #0042 na zawsze?" with "Dzieło i Twoje zdjęcie znikną bezpowrotnie. Numer #0042 nie wróci do użycia.", "Anuluj" and "Usuń na zawsze". After it, a toast says "Usunięto #0042 na zawsze.".
- Deleting permanently also removes the learner's uploaded image from storage. The record number is not reused ([R-2](../product/requirements.md#artworks)).
- There is no "Opróżnij kosz" and no automatic deletion.

### Consequences

- Good: two steps protect against a slip of the finger, and the trash keeps every deleted artwork until the learner removes it.
- Good: the list shows when each artwork was deleted and keeps its actions at hand, and it needs no change to the tile or the artwork view.
- Good: no scheduled jobs and no storage clean-up outside the app.
- Bad: moving to the trash asks a question even though it can be undone, one click more than a toast would need.
- Bad: emptying a full trash takes one confirmation per artwork.

## More information

- Requirements: [R-23](../product/requirements.md#artworks), [R-35](../product/requirements.md#artworks), [R-36](../product/requirements.md#artworks).
- Implementation: ATL-64.
