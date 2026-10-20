# 0058. Mark artworks as favourites with a heart

- Status: accepted
- Date: 2026-10-15

## Context and problem statement

The learner wants to mark artworks to come back to, from the wall and from the artwork view, and to see only those. The collection has no marker today, and the filter panel ([ADR-0042](0042-filter-the-collection-in-the-browser.md)) has no field for one. Where does the marker live, how does the learner set it and how does the filter treat it?

## Decision drivers

- One click from the places where the learner already looks at artworks.
- Discreet: the marker must not compete with the artwork ([ADR-0021](0021-collection-view-as-a-wall-of-framed-artworks.md)).
- Reuse what exists: the top bar actions, the filter tags and the toast.
- The collection is loaded whole into the browser, so the marker travels with each artwork ([ADR-0041](0041-load-the-whole-collection-in-pages-of-1000.md)).

## Considered options

1. A column on the artwork, a heart on the tile and in the top bar of the artwork view, a tag in the filter panel
2. A separate table or a tag value "favourite" among the category values
3. A marker kept only on the device

## Decision outcome

Chosen option: 1, because it is a single flag per artwork, needs no new table, filters in the browser like every other field and survives a change of device.

- Data: `artworks.favourite boolean not null default false`, set by the learner through an update on that one column (a migration with its column grant). A new artwork starts as not a favourite, the form neither shows nor changes it, and the trash and a restore keep it.
- Tile: a heart at the right end of the caption band, on the passe-partout, always visible, 16 px (in a `--size-control` touch area), in `--color-mat-fg-muted`; an outline when the artwork is not a favourite and filled when it is. It is a button next to the tile's link, never inside it, so it does not open the artwork.
- Artwork view: an icon-only `Button` with the heart, 48 px like its neighbours, before "Edytuj" in the top bar, `aria-pressed` and filled when the artwork is a favourite. This is the one action in the bar that does not open a form or delete.
- Filter: a `ToggleTag` with a heart and the count, "Ulubione", alone at the top of the panel without a heading. Pressed means only favourites. It follows [R-54](../product/requirements.md#browsing-and-search): the count is taken with the other fields' filters, and the tag is shown among the active filters and kept in the URL as `ulubione=1` ([R-56](../product/requirements.md#browsing-and-search), [R-57](../product/requirements.md#browsing-and-search)).
- Feedback: the heart changes at once and a `Toast` confirms each change: "Dodano do ulubionych." and "Usunięto z ulubionych.". When the save fails the heart goes back and an `Alert` at the top of the view says "Nie udało się zapisać zmiany. Spróbuj jeszcze raz.".
- With only favourites chosen and none matching, the wall says "Nie ma jeszcze ulubionych dzieł." in place of its usual empty text.
- Accessible names: "Dodaj do ulubionych" and "Usuń z ulubionych", also as the tooltip of the button in the top bar.

### Consequences

- Good: one column, no new table, and the filter stays in the browser.
- Good: the heart is reachable where the learner already is, and reuses the bar, the filter tag and the toast.
- Bad: an extra update path (one column) besides the form and the card-index functions; it needs its own grant and test.
- Bad: the tile gets a second control, so `ArtworkTile` stops being a single link and its caption narrows by the heart.

## More information

Mockups: `atl-152/` in the project files. Linear: ATL-152, milestone 0.4. The favourites can later feed a review of the learner's own collection (idea list), which is why they are stored, not only filtered.
