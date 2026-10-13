# Changelog

All notable changes to study-atelier are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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
