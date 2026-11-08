# 0228. Group the exhibits of the display case into rooms

- Status: accepted
- Date: 2026-11-08

## Context and problem statement

The display case ([ADR-0162](0162-show-the-exhibits-as-toned-engravings-in-frames.md)) shows every exhibit in one flat grid, in a rough order kept by the `place` column of `private.exhibit_values`. Develop has 29 exhibits (19 tiered, 10 hidden), and three more are on the way: "Kryształowy Pałac" ([ADR-0220](0220-show-exhibitions-as-the-crystal-palace.md), ATL-566), the exhibit for artwork types (ATL-580) and a hidden exhibit for an exhibition through all six eras (ATL-567). The page grows long, and the learner cannot fold away what is finished or not started. How are the exhibits grouped, and how does the learner narrow what is shown?

## Decision drivers

- The display case is a museum: a grouping should read as rooms of a museum, not as a list of app modules.
- A learner who is not technical understands at once what a group holds and how to fold it.
- Folding and hiding are a convenience of the view, not data of the learner.
- The names must not repeat the names of exhibits ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).

## Considered options

For the grouping: by module of the app (collection, eras, reviews, chronicle, glossary and timeline, exhibitions); by kind of activity, as rooms of a museum; only tiered against hidden.

For the hidden exhibits: in the room of their domain; all together in one room.

For hiding: two switches above all rooms; one choice of four (all, in progress, finished, locked); finished and locked folded into one line at the end of each room. Then for their look: switches, toggle tags with counts ("Ukryj ukończone 5"), one line of text buttons.

For remembering: in the browser of the device; on the account, in the preferences; not at all.

For the order inside a room: fixed; by progress, nearest to the next tier first.

For the room header: the library `Disclosure` with a count; the name in the title font with "1 z 4 ukończonych"; the same with an overline "Sala I" and a square per exhibit in the colour of its metal.

For the names: plain domains (Zbiory, Epoki, Pamięć, Wiedza, Podróże, Wystawy, Osobliwości); rooms of a museum; free names.

## Decision outcome

Chosen by the owner in ATL-581.

### Rooms

Seven rooms by kind of activity, in the order of a visitor route. Hidden exhibits stand in the room of their domain, after the tiered ones. The order inside a room is fixed:

| Room          | Exhibits, in order                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Sala główna   | `collection`, `vasari_lives`, the artwork types exhibit (ATL-580), `own_eye`, `pinacotheca`          |
| Amfilada epok | `eras`, `prehistory`, `antiquity`, `middle_ages`, `early_modern`, `modern`, `contemporary`           |
| Czytelnia     | `memory`, `bullseye`, `regular`, `back_from_storage`, `night_watch`, `marathon`, `amateur_magnifier` |
| Skryptorium   | `glossary`, `timeline`, `hortus_cliffortianus`, `figure_alphabet`                                    |
| Sala map      | `chronicle`, `grand_tour`, `seen_live`, `trevi_fountain`, `seven_league_boots`                       |
| Pawilon       | `crystal_palace` (ATL-566), the hidden exhibit for an exhibition through six eras (ATL-567)          |
| Krypta        | `mouth_of_truth`, `candle_moths`                                                                     |

"Ogród Clifforta" goes to Skryptorium, since describing values in the card index is knowledge rather than collecting. Krypta holds the exhibits that belong to no domain. The names avoid Pracownia, Biblioteka, Salon and Gabinet, which exhibits already carry. "Amfilada" is a row of rooms one leads into the next, as the eras do; "Skryptorium" is where things are written down.

A room with no exhibit in the app yet is not shown. A new exhibit is placed in a room by the issue that builds it.

### Room header

- An overline "Sala I", "Sala II" and so on in Roman numerals, in small capitals, counted over the rooms shown.
- The name of the room in the title font, in italics, like the names of exhibits.
- A row of small squares, one per exhibit of the room in its order, in the colour of its metal (empty without a tier or while hidden; platinum as silver with a gold outline), so a folded room still shows its progress.
- A chevron at the right; the whole header folds and unfolds the room, and a hairline divides the rooms.

### Showing and hiding

- Two switches, once, above all rooms at the right: "Pokaż ukończone" and "Pokaż nieodblokowane".
- Finished: all tiers reached, or a hidden exhibit that has been found. Not unlocked: no tier yet, or a hidden exhibit not found yet.
- A room whose exhibits are all hidden by the switches keeps its header and says "Wszystkie eksponaty tej sali są teraz schowane."
- The folded rooms and both switches are remembered in the browser of the device, so a phone and a computer can differ and no migration is needed. At first every room is open and both switches are on.

### Texts

- The lead of the page starts "Sale z eksponatami, które udało Ci się zgromadzić…" instead of "Sala z eksponatami…"; the rest stays.

### Consequences

- Good: 32 exhibits read as seven short rooms on a route, and a learner folds or hides what does not interest them.
- Good: the squares keep the progress of a folded room in sight, and the rooms keep the museum of the display case.
- Good: nothing changes in the database; the room of an exhibit lives in the app.
- Bad: rooms are uneven (two to seven exhibits), and Krypta is a room for what fits nowhere else.
- Bad: every new exhibit needs a room, and the order kept by `place` in the database no longer decides the order on the page.

## More information

Designed in ATL-581 on mockups in the project files (`kategorie-osiagniec/`); the build is ATL-582. Requirement [R-237](../product/requirements.md).
