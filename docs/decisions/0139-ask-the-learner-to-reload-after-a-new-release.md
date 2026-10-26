# 0139. Ask the learner to reload after a new release

- Status: accepted
- Date: 2026-10-26

## Context and problem statement

The app is a single-page app that stays open in a tab for hours. A release migrates the database first ([ADR-0037](0037-separate-databases-for-develop-and-production.md)), so a tab with the previous code can call a changed function or save data in the old shape. With more learners this happens on every release. How does an old tab learn about the new version, and how does it switch without losing unsaved work?

## Decision drivers

- No change to a form the learner is filling in without the learner's consent.
- A quiet message, not a dialog that interrupts a review.
- Use what SvelteKit already does: it checks the version when the tab comes back into view or gets the focus, and on an interval.

## Considered options

- A floating notice at the bottom, like a toast that stays, or an alert under the top bar that pushes the content down
- Reloading only on the click, or also on the next navigation in the app

## Decision outcome

Chosen by the owner: a floating notice at the bottom with "Pojawiła się nowa wersja aplikacji. Odśwież stronę, żeby z niej skorzystać." and "Odśwież".

- SvelteKit polls the version every 10 minutes (`version.pollInterval`), besides its checks on focus and visibility.
- `NewVersionNotice` in `AtelierLayout` appears once `updated.current` is true. It stands above the `FormActions` bar (marked `data-action-bar`) so the save button stays free. "Odśwież" reloads the page; with unsaved changes the browser asks first.
- The next navigation in the app after an update loads the target page from the server (`onNavigate` in the root layout). It runs only when the navigation was not stopped, so "Odrzucić zmiany?" in a form still comes first.
- Migrations follow expand and contract: what the previous release calls is removed only in the release after the one that stopped calling it (code conventions, Database).

### Consequences

- Good: an old tab switches to the new code at the next page change at the latest, and the learner decides when.
- Good: no dialog, and no layout shift while the learner works.
- Bad: a learner who stays on one page, for example a long review, keeps the old code until clicking "Odśwież"; the two-step migrations cover that time.
- Bad: removing anything from the database takes two releases.

## More information

- Issue ATL-332.
