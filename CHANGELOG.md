# Changelog

All notable changes to study-atelier are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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
