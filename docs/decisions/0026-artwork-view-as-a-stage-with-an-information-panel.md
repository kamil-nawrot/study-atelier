# 0026. Show one artwork on a stage with an information panel beside it

- Status: accepted
- Date: 2026-10-12

## Context and problem statement

The wall shows each artwork with only its image, title, authors, date and record number; everything else is in the artwork view at `/atelier/<record number>` ([ADR-0021](0021-collection-view-as-a-wall-of-framed-artworks.md), [ADR-0023](0023-atelier-routes-and-commons-thumbnails.md)). The learner opens it to look at the artwork, read what they wrote and go on to edit it ([ADR-0022](0022-add-and-edit-an-artwork-in-one-full-form.md)) or delete it (R-23). How does the view look on a larger screen and on a phone, and how does it handle an artwork without an image or with fields not yet filled in?

## Decision drivers

- The artwork is the central element of the view.
- Over the following weeks the learner comes back to an entry to add more ([main scenario](../product/requirements.md#main-scenario)), so what is still missing should be easy to see.
- The view looks like the rest of the app: passe-partout, a dark stage, the artwork title in Newsreader italic, record numbers as `#0012`.
- The MVP stays small.

## Considered options

For the layout on a larger screen:

1. Two columns: the image on the left, the details on the right, as in the form
2. The image on a stage across the full width, the details below it
3. The image on a stage, the details in a side panel that the learner can close

For fields that are not filled in: hidden, shown with a dash, or hidden with one sentence listing what is missing.

## Decision outcome

Chosen option: 3, a stage with a side panel, because the artwork gets the most room and the learner can close the panel to look at the artwork alone.

- Stage: the image on a paper passe-partout, centred, with the image credit under it ([R-16](../product/requirements.md#images)). Behind it the same image covers the stage, blurred and dimmed with `--color-scrim`, so only the artwork's colours remain. This is the stage of the start and sign-in screens with a blur added, so the motif does not appear twice in focus.
- Information panel on the right: the record number, the title (artwork title role), the authors and the date, then type, period, style, material and location, then the notes. Category values show as tags. Every field is always shown in the same order; a field that is not filled in shows a muted dash.
- The panel has a close button. A closed panel leaves a narrow strip on the right with a chevron and an info icon that open it again, like the collapsed side menu on the left. The panel is open by default, and the device remembers whether the learner closed it.
- Top bar: "Atelier" with a back arrow on the left, which returns to the wall at the scroll position it had. On the right "Edytuj", which opens `/atelier/<record number>/edit`, and "Usuń" in `--color-danger`. Both stay visible when the panel is closed.
- Clicking the image opens it full screen on the dark stage, at the largest size that fits the screen. Escape or a close button returns to the view.
- An artwork without an image keeps the same layout: the stage shows the empty 4:5 window, as on the wall, with "Dodaj zdjęcie" under it, which opens the edit form at the image field ([R-14](../product/requirements.md#images)). The stage has no backdrop. How the empty window itself looks is designed in ATL-62.
- Phone: one column. The stage with the image comes first, the information below it, and the page scrolls as a whole. "Edytuj" and "Usuń" are icons in the top bar, as "Dodaj dzieło" is on the wall.
- An unknown record number or an artwork in the trash shows "Nie ma dzieła #0042", one sentence and "Wróć do atelier", like the edit form.
- Going to the previous or next artwork from this view is left for later (idea ATL-65).

### Consequences

- Good: the artwork fills most of the screen, and the learner can still read everything about it without scrolling on a larger screen.
- Good: dashes show at a glance what the learner has not filled in yet, and every artwork view has the same shape.
- Good: the stage reuses the backdrop of the start and sign-in screens.
- Bad: the stage and the panel differ from the two columns of the form, so the image moves when the learner goes from the view to editing.
- Bad: the blurred backdrop loads the image twice on the page; the browser cache makes the second load cheap.
- Bad: the panel's open or closed state is per device, not per learner.

## More information

- Design: thread "ATL-63 Widok szczegółów dzieła", 2026-10-12; screenshots were shown in the thread and are not kept in the repository.
- The closed panel strip, the panel animation and the top bar width are refined in [ADR-0027](0027-artwork-view-refinements.md).
- Implementation: ATL-63. Deleting and restoring an artwork ("Usuń"): ATL-64. The empty image window: ATL-62.
