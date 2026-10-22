# Changelog

All notable changes to study-atelier are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.8.0] - 2026-10-22

The learner can define their own artwork fields, fill them in with every artwork, see them in the artwork view and filter the wall by them.

### Added

- Own fields in a new Kartoteka tab "Własne pola", at the right of the tabs: "Dodaj pole" asks for a name, an optional description and a kind, "Tekst", "Lista" (one or several values with suggestions) or "Zaznaczenie"; the kind cannot change afterwards. A name cannot repeat another own field or a built-in one ("Dzieło ma już wbudowane pole „Styl”."). Each field has a "…" menu to rename it, move it up or down, or delete it after a confirmation that names how many artworks lose it.
- The values of an own list are listed in the tab under "Wartości" with their number of artworks, closed at first; renaming a value to another one's name merges the two after a confirmation.
- The artwork form shows the own fields after "Miejsce", with their description as the hint, and the artwork view shows the filled ones: a list as tags, a text as text, a ticked field as "Tak".
- The "Filtry" panel of the wall offers the own fields after "Miejsce": the values of a list, a search inside a text field, and the ticked fields in one section "Zaznaczone"; the filter stays in the address.

### Changed

- The arrow in the top bar of a form names where it leads ("← Mona Lisa", "← Atelier", "← Słowniczek") instead of the form's title, which is no longer shown.
- Kalendarium has no line above the timeline any more ("1640 · w tym czasie: …"), so the timeline does not move while panning; a screen reader still hears the events at the reading line.
- Internal: tab and text button variants in the component library, `BackHeading` removed, and fixes from the code review of the version.

### Fixed

- After saving an edit, the back arrow returns to the page before the artwork, value or entry in one step instead of showing the same page again.
- A new glossary entry's arrow names Słowniczek, not the page before it.
- The "Widok" dialog of the wall fits the width of a phone instead of scrolling sideways.

### Migrations run on production

Two migrations run on production with this release and change no existing data: `artwork_fields` creates the `artwork_fields` and `artwork_field_entries` tables with their policies and grants, lets `categories` hold a learner's own list categories (an optional owner and field, a read policy for the shared ones and the learner's own, the position unique only among the shared ones), makes `category_values` follow a deleted category, and replaces `save_artwork` with a version that takes optional field entries and replaces only the categories it is given, so the calls of the previous version, which send all five categories, keep working; `artwork_field_position_default` gives the position of an own field a default.

## [0.7.1] - 2026-10-21

The way back now leads where the learner came from, scrollbars no longer move the page, and free reviews draw a new set of artworks every time.

### Added

- The arrow in the top bar of an artwork, a value or a glossary entry goes back to the place the learner came from and names it ("← Kalendarium", "← Leonardo da Vinci"), also after the browser's back and forward buttons; a page opened directly links to its list. The modules have no back arrow, and the menu moves between them.
- The wall, Słowniczek, Kartoteka and Kalendarium keep the learner's place, search and filters when the learner comes back to them.
- On a larger screen, thin overlay scrollbars in the app's colours replace the native ones, so they take no space and never shift the content; they widen under the pointer and while dragged.

### Changed

- Every free review round draws up to 20 of the artworks already reviewed at random, so no two rounds are the same; the caption reads "Dodatkowa runda losowo wybranych dzieł, które już powtarzasz.".
- The artworks at the reading line of Kalendarium stand in a row under the timeline, the nearest first, so the timeline no longer jumps while panning.
- The review quizzes call the artwork "dzieło" ("W jakim stylu powstało to dzieło?"), because the collection also holds buildings and sculptures.
- The wall's address names its filters in English (`era`, `style`, `favourites`, …); an old or unknown parameter is ignored instead of breaking the page.
- Every form has the width of the artwork form, the event form included; the top bar keeps the way back on the left and the actions on the right.
- Internal: shared top bar pieces and a not-found block in the component library, a Markdown check in CI, and fixes from the code review of the version.

### Fixed

- The review counter in the menu now updates after a review round and after a restore from the trash.
- Going back from a glossary entry returns to the place in the list instead of its top.
- A panel with an overlay scrollbar no longer scrolls past its content.

### Migrations run on production

One migration runs on production with this release and changes no existing data: `draw_free_review_rounds_at_random` replaces `review_session` with the same signature, drawing free rounds at random, so the calls of the previous version keep working.

## [0.7.0] - 2026-10-21

A new module, "Kalendarium", shows the learner's artworks and their own historical events at true scale on a timeline, one era at a time.

### Added

- "Kalendarium" in the menu after "Słowniczek": one era at a time on a timeline at true scale, chosen on an era strip with the eras' icons, with the name of the current era above the scale. The scale changes in steps ("Epoka", "Tysiąclecie", "Stulecie", "Pokolenie" and others) with buttons, the mouse wheel or a pinch, and the timeline pans by dragging or with the arrow keys. A reading line in the middle shows the exact year, and the line above names the events of that year ("1640 · w tym czasie: …"). Prehistory starts at 40000 BCE or at the oldest entry, and the contemporary era reaches the latest one.
- Every dated artwork is a dot at its end year, with a thin line from its start year for a span, spread across the timeline without overlapping and the same on every visit; hovering a dot, or tapping it on a phone, shows the artwork's tile.
- Historical events and periods of the learner's own, added with "Dodaj wydarzenie": a name, a year or a span written like a date of creation, and a short description. They stand in their own band above the artworks, and a chosen one opens a card with its length, the artworks of its time, "Pokaż cały okres na osi", "Edytuj" and "Usuń".
- When a new event is named, its dates and a short description are filled in from Polish Wikipedia and Wikidata, quietly and only where the form is still empty, with "Wybierz inny artykuł" and "Usuń źródło"; the event keeps the source.
- A "Filtry" panel on the timeline: up to five periods and styles of the era, each in its own coloured lane (on a phone they colour the dots), plus favourites, artwork type and author, and the switches "Wydarzenia" and "Dzieła w linii czytania".
- On a phone the timeline runs from top to bottom.

### Changed

- Years can go back to 3 000 000 BCE and forward to 2500, for artworks, events and the life years of authors; a year outside gets its own message instead of a general error.
- The filter panel of the wall first takes the free side margins and narrows the wall only when they run out.
- The component library has five lane colours and a highlight colour, and the wall and the timeline share the filter side panel.

### Migrations run on production

Two migrations run on production with this release and change no existing data: `timeline_events` creates the `timeline_events` table with its policy and column grants; `timeline_event_sources` adds four optional source columns to that table with their checks and grants, so rows without a source stay valid.

## [0.6.3] - 2026-10-20

An artwork can have up to five images, a new artwork gets its image from Wikidata on its own, and a large photo from a phone can be added as it is.

### Added

- Up to five images per artwork: a row of slots above the image in the form adds further images ("Dodaj kolejny obraz"), each found in Wikidata, uploaded or given as a link, and the star "Ustaw jako główne" makes one the main image. The artwork page shows thumbnails under the main image, and the full-screen viewer steps through all of them. The wall, the reviews and the filters keep using the main image.
- In the add form, once the title and an author are filled in, the main image is looked up in Wikidata and the candidate whose creator matches an author is filled in, with "Z Wikidata: …" under it; without an author only a single result is used. "Wybierz inny" opens every candidate.
- A file or pasted image over 5 MB is made smaller in the browser before it is uploaded (the longer side at most 3200 px, as a JPEG); files up to 50 MB are accepted, and the location stored in a phone photo is not uploaded.

### Changed

- The artwork's image is called "obraz" everywhere in the app, and the image search speaks in the first person ("Szukam w Wikidata…", "Nie znalazłem…"). The search button reads "Wybierz inny" once an image from Wikidata is set.
- Uploaded images that no artwork or author has used for a day are removed by a daily job, so files left behind by an interrupted save do not pile up.
- The texts of the component library are set once for the whole app, the file picker and field messages come from the library, and the add artwork tests run faster.

### Migrations run on production

Two migrations run on production with this release and change no existing data: `artwork_images` creates the `artwork_images` table with its policy and grants, and replaces `save_artwork` with a version that takes an optional list of further images, so the calls of the previous version keep working; `unused_images` creates the `unused_images` function, callable only with the secret key.

## [0.6.2] - 2026-10-20

The wall can be grouped by era, period and style without filtering anything out, reviews go on after the day is done, and the artwork image search answers again.

### Added

- Grouping of the wall: by era, by era and period, or by era, period and style, chosen in steps from a button in the top bar (in "Widok" on a phone). Every group has a heading with its count and its own wall, can be collapsed, and "Zwiń wszystkie" collapses them all; artworks without a value go to "Bez epoki", "Bez okresu" or "Bez stylu", and an artwork with several styles stands in each. Grouping works together with the filters, the search and the order, and is kept in the address.
- Free review rounds: when nothing waits today, "Powtórka swobodna" offers rounds of the artworks the learner knows least, without changing the review plan or the streak.
- The inflected forms of a term's synonyms come from Polish Wiktionary too, so a term is found in notes under any of its names in any case; a term has at most three synonyms.

### Changed

- The order "Według epok" is replaced by "Według daty powstania"; grouping by era with this order shows the wall as before, with headings.
- The review summary lays out each group as the artwork wall, the groups can be collapsed, and their counts stand in a box.
- "Filtry" and "Dodaj dzieło" in the top bar of the wall are icons with tooltips, and the top bar keeps the width of the wall.
- Tooltips no longer stay open after a click.
- The search field of the top bar uses the same font size as the other controls.

### Fixed

- The search for an artwork's image on Wikidata no longer hangs for a minute and ends with an error; a request to Wikimedia that gets no answer gives up after 30 seconds.

### Migrations run on production

One migration runs on production with this release and changes no data: `free_review_session` replaces the `review_session` function with a version that takes an optional `free_round`, so the calls of the previous version keep working.

## [0.6.1] - 2026-10-18

The glossary joins the rest of learning: a term card leads to its page, terms are marked in definitions and on review flashcards, and the inflected forms of a term come from Polish Wiktionary.

### Added

- Forms from Wiktionary: a new term fetches its inflected forms from Polish Wiktionary, also for two-word terms made of a noun and an adjective; an existing term offers "Pobierz z Wikisłownika", and "Pobierz ponownie" after a rename.
- Synonyms of a term, kept apart from its inflected forms and shown as "też: …" on the term's page.
- An optional sort name for a term ("Sortuj jako"), used to sort and group the glossary list, like the sort name of an author.
- "Otwórz w Słowniczku" in the card of a marked term, leading to the term's page; the card can be reached with the keyboard.
- Other terms are marked in the definition on a term's page, and terms are marked in the notes of a review flashcard after it is turned.

### Changed

- The glossary list shows the number of terms next to its title, puts the search field before the category filters and leaves more space between letters and terms.
- The inflected forms in the term form sit in a collapsible "Odmiana" frame with their count.
- Page data is loaded when a link is pressed instead of when the pointer rests on it, so moving across the wall no longer sends requests.
- "Wspomniane w" and "Pojawia się w notatkach" find the notes that mention a value or a term in one request instead of seven.

### Fixed

- The forms of "Ty" and "Twój" that address the learner start with a capital letter in the glossary and card index texts.

### Migrations run on production

Two migrations run on production with this release, both additive and neither changes existing data: `glossary_synonyms_and_sort_name` adds the `synonyms` (empty by default) and nullable `sort_name` columns to `glossary_entries` with their grants; `notes_mentions` creates the `notes_mentions` function.

## [0.6.0] - 2026-10-17

The glossary: a place for terms and people that are not values of any artwork field, with definitions filled from Polish Wikipedia and marked in notes.

### Added

- Glossary ("Słowniczek"): a menu module with entries in six categories (person, architecture, painting, sculpture, technique and material, general term), a dictionary-style list with letters, category filters and a search field from 20 entries, and a page for every entry.
- Definitions filled from Polish Wikipedia with the source and licence line kept, freely editable, with a dialog to pick another article and a confirmation before an edited text is replaced; extra forms of a term can be written by hand.
- Glossary terms in notes: the first occurrence of an entry in the notes of artworks and card index values is marked, with the definition in a popover, and the entry page lists the notes that mention it.
- A starter list of 725 art museums in the place field, with the country shown on the right.
- A "Zgłoś uwagę" menu item with a dialog for sending bug reports and ideas, stored in a table the owner reads.
- A streak on the review start: the number of days in a row with reviews, counted in the time zone of the device.

### Changed

- Fetched Wikipedia definitions are trimmed to the lead sentence, and a very short one gets a second sentence.
- Toggle tags centre their icon and text, and the glossary list has a hairline between letters from 768 px.
- Wall tiles under the period strip fade like the rest of the wall.

### Fixed

- Extra spacing at the top of the review options when only the form section is open.

### Migrations run on production

Four migrations run on production with this release, all additive and none changes existing data: `glossary` creates the `glossary_entries` table with its policy and grants; `museum_catalogue` creates and fills the `catalogue_museums` table, adds the nullable `catalogue_wikidata_id` column to `location_details` and replaces the `save_artwork` function; `feedback` creates the insert-only `feedback` table; `review_streak` creates the `review_streak` function.

## [0.5.0] - 2026-10-16

The learning module: the learner reviews the personal collection with flashcards and quizzes scheduled by a spaced repetition algorithm, in a session built from the "Powtórki" menu item.

### Added

- Reviews ("Powtórki"): a start page with a plan of the session, scopes (the whole collection, every era, and periods or styles with at least 20 artworks with an image) and forms (mixed, flashcards only, quizzes only); the menu item shows how many reviews are due, as a number or a small square in the collapsed rail.
- Flashcards with the image on a stage and the answer in a panel, rated in three steps, and a summary that offers another round.
- Quizzes: pick the image, pick the title or recognise the style, with distractors drawn from related artworks and the reason shown after an answer. New artworks of a session are drawn at random.
- Scheduling with FSRS: the next review of every artwork is stored in days; a quiz answer always updates the schedule.
- Icons for artwork types, shown like eras in the form, the artwork view and the filters; the museum place type has its own icon.
- Gallery as a type of place.
- Search fields in the card index lists of materials, authors and locations.
- The country of a place after its name in the artwork view.
- Wall tiles fade in and out while scrolling.

### Changed

- Own images get a 500 px copy for the wall and the quizzes; the copy is made at upload and, for older images, in the background on the first visit to the wall.
- Authors in the artwork view are separated by a comma and a space; category labels are centred on the first row of values.
- Era names in the filter panel use the extra small font.
- A period lands on the rail right after its first artwork.
- Periods, styles and materials in the filter panel show their first eight badges and a "Pokaż więcej" button, like authors and locations.

### Fixed

- Artworks answered only in quizzes no longer stay in FSRS learning, so the review counter clears.
- No style quiz is asked in a style scope, and a review start that fails to load can be retried.
- The header of the filter panel stays in view while the panel scrolls, so the panel can always be closed.
- Quiz icons are centred, the page scrolls to the top between questions and review images are larger on phones.

### Migration note

Six migrations run on production with this release, all additive or replacing functions without touching data: `review_cards` creates the `review_cards` and `review_log` tables with their policies and the `record_review` and `review_counts` functions; `gallery_place_type` widens the place type check constraint with `gallery`; `review_session`, `quiz_forgotten_artworks`, `no_style_quiz_in_a_style_scope` and `draw_new_artworks_at_random` create and then replace the `review_session` function. No existing data is changed.

## [0.4.1] - 2026-10-15

Hotfix for the wall: an image no longer loads forever after an artwork is marked as a favourite.

### Fixed

- Marking an artwork as a favourite from the wall no longer makes its image reload without end until the page is refreshed.
- The heart and the label of the favourites tag in the filter panel are aligned on one line with a gap between them.

## [0.4.0] - 2026-10-15

The card index becomes the learner's own knowledge: every era, period, style, material, author and location has a page of its own with a summary and notes, notes can link to values and artworks, and artworks can be marked as favourites.

### Added

- A page for every category value in the card index with a summary, notes and the wall of its artworks; each value is edited in a form page.
- Authors have a portrait (found through Wikidata or uploaded), years of life and a sort name; locations have a country and a type of place.
- The artwork view shows a card with the summary of a value from its badge.
- Links in notes: `@` links a value and `#` links an artwork, with a suggestion list and toolbar buttons; links keep the current name and fall back to plain text when the target is gone.
- A "Wspominasz o tym w notatkach" section on value pages and in the artwork view lists the notes that mention them.
- Favourite artworks: a heart on every tile and in the artwork view, and a "Favourites" filter.
- A light theme next to the dark one, switched from the side menu.
- Search fields for every value group in the filter panel.

### Changed

- Authors are ordered by their sort name (surname first).
- The image search lists only candidates that have an image.
- The left bar aligns with the page header and content in every view.
- The period rail is hidden when only one value remains.
- Merging two category values rewrites note links to the merged value so they point to the kept one.

### Fixed

- A value page shows fresh data after saving or deleting instead of stale content.

### Infrastructure

- Test coverage is measured in CI and shown in the job summary.
- Stylelint enforces that transitions and animations sit inside the reduced-motion media query.
- Restored the ADR numbering (two ADRs numbered 0047) and recorded what the value page sessions taught in the guidelines.

### Migration note

Four migrations run on production with this release, all additive: `value_details` creates the details tables, the value page function and their policies; `save_value_details` adds the functions that save them; `merge_rewrites_note_links` replaces `merge_category_values` so note links follow a merge; `artwork_favourite` adds `artworks.favourite` (default `false`). No existing data is changed.

## [0.3.1] - 2026-10-15

Polish after 0.3: the filter panel animates, a failed save is visible, and the artwork view and wall images behave on every screen.

### Added

- The filter panel on the wall opens and closes with a width animation, like the side menu and the information panel (off with reduced motion).

### Changed

- The field name in an active filter tag is muted and its value stronger, and the filter panel no longer jumps when a scrollbar appears.
- On phones a single image on the wall is at most as tall as the screen minus the top bar, so a whole artwork is always visible.

### Fixed

- A failed save shows its error: the message scrolls into view, integrity errors have their own text, and an expired session signs the learner out with a note on the sign-in page.
- The full-screen image preview keeps the proportions of tall images instead of stretching them.
- In the artwork view only the information panel scrolls when the description is long; the image stays fixed.

## [0.3.0] - 2026-10-15

The learner organises the collection by author and time: artworks can be sorted and searched by author, filtered from a side panel, and their creation date can be a year span.

### Added

- A year span for the date of creation (e.g., 1490–1510) in the artwork form and view.
- Sorting the wall by author and searching by authors.
- A filtering panel to narrow down the wall by era, period, style, author, material and location.
- Navigation between artworks: buttons to go to the previous and next work from the artwork view.
- A confirmation when restoring an artwork from the trash if its title and authors match an active one.

### Fixed

- A loading indicator is shown when switching artworks and the back button is ignored during transitions.
- The wall state is preserved correctly when navigating back (replaced deprecated `replaceState`).

### Performance

- Images on the wall are loaded only when they approach the viewport.
- The browser remembers wall image dimensions and caps their width to speed up layout and rendering.

### Infrastructure

- Database types are automatically generated from migrations.
- The local database is seeded with a test account and example artworks.
- Repository-wide enforcement of LF line endings.
- Security review and hardening of RLS policies, database grants and storage paths.
- Documentation: architecture decisions for browser-side filtering and value links, WSL setup guide, and updated migration notes.

### Migration note

The `year` column is renamed to `year_to`, and the new `year_from` field is empty.

## [0.2.0] - 2026-10-14

Eras, periods and styles become organised knowledge: every artwork sits in a chain of era, period and style, and the learner tidies all category values in one place.

### Added

- Era, period and style chain in the artwork form: the era is one of six fixed eras (prehistory to contemporary), the period and style are locked until their parent is chosen, and changing a parent clears what is below it.
- An era icon badge on wall tiles and on the period rail.
- The card index ("Kartoteka"), opened from the menu: a timeline of the six eras with their periods and styles, and tabs for materials, authors and places. One dialog renames a value, merges it into an existing one, moves a period between eras, links a style to periods and deletes a value that nothing uses.
- A confirmation when saving an artwork whose title and authors match an existing one.

### Changed

- An artwork has a single period (`era_code` is stored with it); the form always saves its era.

### Fixed

- The notes placeholder is hidden when a list is the only content.
- Focus stays off the remove button after picking a value with the pointer in single-value fields.
- The wall and the trash load every artwork, not only the first 1000, and skip needless work on resize.
- Unavailable own images show a clear state and expired image links are refreshed.
- The artwork form keeps unsaved changes and the leave guard works while saving.
- The Origin of the World is replaced in the start-page pool.

### Infrastructure

- Migrations for the era chain (`era_code`, one period per artwork) and the card index functions.
- CI runs the UI library and migration checks only when relevant files change.
- Cloud sessions prepare themselves and produce screenshots with `pnpm screenshot`.
- Documentation: bugfix branches, checking the owner's data before data changes.
- Collection modules share one mapping of artwork values.
- GitHub Actions workflows use Node 24 versions of the actions (checkout, setup-node, pnpm and Supabase CLI setup).

### Migration note

Artworks that had "starożytność" (ancient times) as their period now have it as their era only; their period has to be set again in each artwork. Styles are kept.

## [0.1.0] - 2026-10-13

First release: the learner signs in, builds a personal database of artworks and browses it as a wall.

### Added

- Sign-in, sign-up and password reset, with a clear message when the email already has an account.
- A start page for signed-out visitors and artwork backgrounds on the auth screens (a random work from a pool of 100).
- The atelier wall: framed artworks laid out by their image size, ordered by recently added or by period with a period rail, with search and a menu.
- Adding an artwork in one form: title, authors, year, type, era, period, style, material, location and notes, with suggestions for category values and a warning about near-duplicates.
- Finding the artwork image in Wikidata and Wikimedia Commons, or adding the learner's own image from a file, a URL or the clipboard.
- Editing an artwork in the same form.
- The artwork view: the image on a stage with an information panel.
- Notes formatted with a visual Markdown editor.
- A trash: artworks are moved to the trash, restored or deleted for good after confirmation.
- A catalogue cross for artworks without an image.
- Loading states for the first load and for images.
- Record numbers (`#0012`) that are never reused.

### Changed

- Every control and the top bar share one height; the top bar runs across the full width in every view.
- Tags are shown without the `#` prefix.
- The mobile menu fits the viewport and locks the page behind it.
- The page behind a dialog or the artwork panel is blurred.

### Fixed

- Dropdown options are picked on pointer release, so scrolling a list on a touch screen no longer selects an option.
- Loading animations are named in every shorthand, so they run in production builds.
- The paste shortcut is drawn as keys in the form hint.
- The Templo Mayor image in the landing pool is replaced with The Great Wave.

### Infrastructure

- Component library in Storybook with design tokens synced from Figma, enforced by Stylelint, and component tests in Vitest browser mode.
- Cloudflare Pages deployment from GitHub Actions: `develop` to the develop site, `main` to production.
- Supabase database with migrations applied from GitHub Actions and a daily keep-alive; separate databases for develop and production.
- Local Supabase in Docker, with migrations replayed from scratch on every pull request.
- Architecture decision records, product requirements and guidelines under `docs/`.

[0.1.0]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.1.0
[0.2.0]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.2.0
[0.3.0]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.3.0
[0.3.1]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.3.1
[0.4.0]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.4.0
[0.4.1]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.4.1
[0.5.0]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.5.0
[0.6.0]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.6.0
[0.6.1]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.6.1
[0.6.2]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.6.2
[0.6.3]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.6.3
[0.7.0]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.7.0
[0.7.1]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.7.1
[0.8.0]: https://github.com/kamil-nawrot/study-atelier/releases/tag/v0.8.0
