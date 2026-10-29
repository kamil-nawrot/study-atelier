# 0128. Log museum visits in a chronicle

- Status: accepted; the stub of the list ticket (point 5) is superseded by [0129](0129-show-one-faded-artwork-behind-the-ticket-stub.md)
- Date: 2026-10-25

## Context and problem statement

The learner studies artworks from books and screens, but some of them they also see in a museum, a gallery or a church. Today an artwork records where it is ("Miejsce", a location value of the card index), not whether the learner has stood in front of it, and nothing records the visit itself. The owner filed the idea as ATL-316 and settled its scope: a diary of visits plus "seen in person" on artworks, not a tool to prepare a visit. Reviews narrowed to seen artworks and visits on place pages are a later extension (ATL-318).

How should a visit be stored, tied to the artworks seen on it, and shown in the app?

## Decision drivers

- A visit is a memory: a place, a day and a note, and the artworks seen there.
- Ticking the artworks of a museum after a visit takes seconds, not a search per artwork.
- A temporary exhibition shows artworks whose place is elsewhere; they belong to the visit without changing their place.
- The visit does not repeat the place's own page in the card index, which already lists the artworks of that place.
- "Seen in person" follows from the visits, so it cannot disagree with them.

## Considered options

Artworks of a visit:

1. Two groups: the artworks of the place, computed from their location and ticked on the visit, plus artworks added from elsewhere
2. One list of the visit's artworks, stored as rows; the artworks of the place are only ticked in advance in the form of a new visit

"Seen in person" on an artwork:

1. Derived from the visits
2. A separate flag on the artwork

Layout, each with two or three mockups: the list of visits (a diary with the year in the margin, cover cards, a timeline with the date on the left), the visit view, the form, the line in the artwork view and the wall filter.

## Decision outcome

Chosen by the owner, question by question:

1. **The module is called "Kronika"** (the owner's choice in ATL-316, in the style of Kartoteka and Kalendarium), an entry is a "wizyta", and it sits in the menu after Kalendarium with the `footprints` icon, which no other context uses.
2. **One list of artworks per visit (option 2).** The owner rejected the two groups after the first mockups: the artworks of the place are already the place's page in the card index. A visit stores exactly the artworks the learner saw; the form ticks the artworks of the chosen place in advance.
3. **"Seen in person" is derived (option 1):** an artwork is seen in person when at least one visit holds it.
4. **A visit has a place, a date and a note.** The place is a location value of any place type (museum, private collection, on site, and the starter museum list), chosen in the same field as in the artwork form. The note uses the notes editor with `#` artwork and `@` value links ([ADR-0053](0053-link-values-and-artworks-from-notes.md)). There are no photos of a visit.
5. **The list of visits is a timeline of tickets.** Visits are grouped by year (the year in Newsreader italic), newest first. Each visit is a card on the surface colour: the day as a large number and the month under it on the left, then the place in italic, its type and the number of artworks seen, the beginning of the note in two lines, and on the right, behind a zigzag line with a semicircle notch at each end like a ticket stub, up to three thumbnails aligned to the right and "+N". On a phone the zigzag runs across the card and the thumbnails go under it. The owner asked for separate cards and a larger, sparser zigzag than a table with a thin line.
6. **The visit view stacks the ticket, the note and the wall.** The header is the same ticket with the number of artworks seen in its stub, the note follows with the text spine, and the artworks of the visit fill a wall "Widziane na żywo" of the usual tiles. The view has "Edytuj" and "Usuń" in the top bar and nothing to tick.
7. **The form ticks artworks in a grid.** Under "Miejsce", "Data" and "Notatki", the field "Dzieła" shows the artworks of the place as square thumbnails with a checkbox, all ticked for a new visit; an unticked one stays in the grid, dimmed, so a mistake is undone with one click. A search above the grid adds any other artwork of the collection to a second group under it. Changing the place of a new visit replaces the ticked artworks of the place and keeps the added ones; editing a visit shows the artworks of the place as saved, and an artwork that came to the place later is not ticked.
8. **The artwork view lists the visits as mini tickets** in a section "Widziane na żywo · N wizyty" under the information table: each visit a small ticket with the date and the place, linking to the visit.
9. **The wall gets one toggle "Widziane na żywo"** next to "Ulubione" in the filter panel, with a count, and it travels in the address like the other filters ([ADR-0042](0042-filter-the-collection-in-the-browser.md)). The owner chose one toggle over "seen / not yet".
10. **A date may be a day, a month or a year.** Older visits are often remembered only roughly, so the field "Data" takes "12.10.2026", "10.2026" or "2026". The ticket shows what is known: the day with the month under it, the month abbreviation with the year under it, or the year alone. Visits sort by the first day of what is known.
11. **Texts in the warm conversational set** of the proposal (set B), without gendered verb forms, for example "Zaznaczyliśmy wszystko z tego miejsca. Odznacz to, czego tym razem nie było."

### Storage

- `visits`: `id`, `owner_id`, `place_id` (a location value, enforced by a foreign key on `(place_id, owner_id, category_code)` with `category_code` fixed to `location`, like `location_details`), `visited_on date` (the first day of the known period), `date_precision` (`day`, `month` or `year`, with `visited_on` on the first of the month or of January to match), `notes`, `created_at`, `updated_at`. Row level security as for the other tables of the atelier.
- `visit_artworks`: `visit_id`, `artwork_id`, `owner_id`; the primary key is the pair, both foreign keys cascade on delete.
- The form saves a visit and its artworks in one call, so a visit never ends up without the artworks the learner ticked.

### Consequences

- Good: ticking a museum's artworks is one look at a grid, and a temporary exhibition needs no change of place.
- Good: "seen in person" can never contradict the visits.
- Good: the ticket repeats in the list, the visit and the artwork view, so a visit is recognised wherever it appears.
- Bad: a place with very many artworks gives a long grid in the form.
- Bad: places and artworks gain a new kind of use: a place with visits counts as used and cannot be deleted until its visits are, a merge of two places moves their visits, an artwork in the trash keeps its visits and returns with them, and deleting it for good removes it from its visits.
- Bad: other features must learn about visits: the export and import of the atelier ([ADR-0121](0121-export-the-atelier-as-a-zip-file.md), [ADR-0122](0122-import-an-atelier-into-an-empty-atelier-through-one-function.md)) carry visits and their artworks, and `notes_mentions` reads the notes of visits so that renamed values and artworks stay linked in them.

## More information

- Ideas and scope: ATL-316; later extension ATL-318 (visits on place pages, reviews of seen artworks).
- Design ATL-322 with the mockups of all options and the chosen texts; build ATL-323 (storage, list, visit view, form) and ATL-324 (artwork view, wall filter, places, trash, export and notes), milestone 0.12.
- The code goes into a new feature module `chronicle` in `apps/web/src/lib` ([ADR-0126](0126-organise-the-web-app-in-feature-modules-with-enforced-limits.md)).
