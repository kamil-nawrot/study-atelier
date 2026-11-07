# 0214. Record the first hour on one artwork and rename its exhibit

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The hidden exhibit `amateur_magnifier` is unlocked by staying on the details of one artwork for an hour without a break ([ADR-0205](0205-show-an-hour-with-one-artwork-as-a-connoisseur-s-magnifier.md)). The app does not measure time spent on a view. What counts as a break, where is the time measured, and what is recorded? The name chosen in ADR-0205, "Lupa znawcy", also suggests the loupe of the artwork view, which the exhibit does not ask for.

## Decision drivers

- Exhibits are counted in the database and an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- A learner who already has the record makes no further request, as for "Nocny lichtarz" ([ADR-0212](0212-record-the-first-switch-to-the-light-theme-at-night.md)).
- Exhibits are named after an object or a place of their engraving ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)), and a name should not point to a feature of the app.

## Considered options

For a break: leaving the artwork view or moving to another artwork, a hidden tab or a reload; the same, plus 10 minutes without any input.

For the name: "Galeria Daumiera"; "Sala obrazów"; "Ściana obrazów"; "Obraz z bliska"; "Szkło powiększające"; "Szkło znawcy"; "Soczewka znawcy"; "Szkło powiększające znawcy"; "Zapatrzony znawca" and "Znawca z Charivari", which make a person the object.

## Decision outcome

Chosen by the owner in ATL-553.

- The artwork view (`/atelier/[number]`) runs a timer in the browser while it is visible. Leaving the view, moving to another artwork, hiding the tab or reloading starts it again. Input is not tracked: an hour with the view open and visible counts, and the learner is trusted, as with the other hidden exhibits.
- After an hour the profile gets `long_look_at`, set once by `record_long_look()`. Nothing was measured before the release, so nothing before it counts. A failed record is tried again on the next visit to an artwork.
- The own profile says whether the hour is recorded; then the timer does not start. The career is refreshed right after the record, unless it is hidden.
- `amateur_magnifier` counts a recorded hour, has one tier and gives 50 points once as an easter egg. It stands at the end of the display case, after "Nocny lichtarz".
- The exhibit is named "Soczewka znawcy", replacing "Lupa znawcy" of ADR-0205; the code stays `amateur_magnifier`.

### Consequences

- Good: one nullable column and one call in a learner's life; a timer only on the artwork view and only until the hour is recorded.
- Bad: an artwork left open on a visible screen counts as an hour of looking.
- Bad: a device that sleeps without hiding the page may finish the hour late or count the sleep.

## More information

Designed in ATL-526 ([ADR-0205](0205-show-an-hour-with-one-artwork-as-a-connoisseur-s-magnifier.md)); built in ATL-553.
