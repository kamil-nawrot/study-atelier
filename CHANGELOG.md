# Changelog

All notable changes to study-atelier are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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
