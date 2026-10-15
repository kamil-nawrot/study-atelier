 # Decisions

Architecture Decision Records in [MADR](https://adr.github.io/madr/) format. New records start from [template.md](template.md). Rules: [documentation guidelines](../guidelines/documentation.md#architecture-decision-records).

| #                                                                 | Decision | Status |
|-------------------------------------------------------------------| --- | --- |
| [0001](0001-record-decisions-in-adrs.md)                          | Record decisions as ADRs and keep docs in the repository | accepted |
| [0002](0002-gitflow-and-conventional-commits.md)                  | Use gitflow, Conventional Commits and owner-approved pull requests | accepted |
| [0003](0003-monorepo.md)                                          | Keep all project code in one repository | accepted |
| [0004](0004-svelte-frontend.md)                                   | Build the frontend with SvelteKit (Svelte 5) in TypeScript | accepted |
| [0005](0005-no-custom-backend.md)                                 | Do not build a custom backend for now; use Supabase directly | accepted |
| [0006](0006-zero-cost-hosting.md)                                 | Host on free tiers: Cloudflare Pages, GitHub Actions | accepted |
| [0007](0007-images-from-open-sources.md)                          | Load artwork images on the fly from open sources | accepted |
| [0008](0008-supabase-database-and-auth.md)                        | Use Supabase for the database and authentication | accepted |
| [0009](0009-linear-for-tracking.md)                               | Track work in Linear | accepted |
| [0010](0010-design-tokens-figma-sync.md)                          | Keep the design system in code and sync design tokens with Figma through Tokens Studio | accepted |
| [0011](0011-deploy-from-github-actions.md)                        | Deploy to Cloudflare Pages from GitHub Actions | accepted |
| [0012](0012-database-migrations-from-github-actions.md)           | Apply database migrations from GitHub Actions | superseded by 0037 |
| [0013](0013-component-library-with-storybook.md)                  | Build Svelte components in a workspace package documented in Storybook | accepted |
| [0014](0014-artwork-collection-data-model.md)                     | Store the atelier in shared category-value tables with per-learner record numbers | accepted |
| [0015](0015-typed-message-dictionaries-for-i18n.md)               | Keep UI text in typed message dictionaries, one file per language | accepted |
| [0016](0016-supabase-auth-in-the-browser.md)                      | Sign in with Supabase Auth from the browser, email and password only | accepted |
| [0017](0017-ui-icons-from-lucide.md)                              | Use Lucide icons through a shared Icon component | accepted |
| [0018](0018-component-tests-in-vitest-browser-mode.md)            | Test Svelte components and pages in Vitest browser mode | accepted |
| [0019](0019-encode-ui-standards-in-tokens-and-the-library.md)     | Encode UI standards in design tokens and the component library | accepted |
| [0020](0020-logo-passe-partout-mark-and-wordmark.md)              | Draw the logo as a passe-partout mark with a one-font wordmark | accepted |
| [0021](0021-collection-view-as-a-wall-of-framed-artworks.md)      | Show the atelier as a wall of framed artworks | accepted |
| [0022](0022-add-and-edit-an-artwork-in-one-full-form.md)          | Add and edit an artwork in one full form on its own page | accepted |
| [0023](0023-atelier-routes-and-commons-thumbnails.md)             | Address artworks by record number and load Commons thumbnails through the API | accepted |
| [0024](0024-save-an-artwork-in-one-database-function.md)          | Save an artwork with its values in one database function | accepted |
| [0025](0025-upload-the-own-image-when-the-artwork-is-saved.md)    | Upload the learner's own image when the artwork is saved | accepted |
| [0026](0026-artwork-view-as-a-stage-with-an-information-panel.md) | Show one artwork on a stage with an information panel beside it | accepted |
| [0027](0027-artwork-view-refinements.md)                          | Label the closed artwork panel with vertical text, animate it and widen the top bar | accepted |
| [0028](0028-trash-as-a-list-with-confirmed-deletes.md)            | Move artworks to a trash shown as a list, and confirm every delete | accepted |
| [0029](0029-format-notes-with-a-visual-markdown-editor.md)        | Format artwork notes with a visual editor that stores Markdown | accepted |
| [0030](0030-loading-states-for-the-first-load-and-images.md)      | Show loading as a primed canvas, for the first app load and for artwork images | accepted |
| [0031](0031-full-width-top-bar-in-every-atelier-view.md)          | Run the top bar of every atelier view across the full width of the page | accepted |
| [0032](0032-paste-the-own-image-from-the-clipboard.md)            | Paste the learner's own image from the clipboard | accepted |
| [0033](0033-order-the-wall-by-period-with-a-period-rail.md)       | Order the wall by period, with a period rail that follows the scroll | accepted |
| [0034](0034-catalogue-cross-for-artworks-without-an-image.md)     | Show an artwork without an image as a catalogue cross in a hairline frame | accepted |
| [0035](0035-wide-artworks-span-two-wall-columns.md)               | Let wide artworks span two wall columns, with a fixed-height tile caption | accepted |
| [0036](0036-run-supabase-locally-in-docker.md)                    | Run Supabase locally in Docker for development and migration testing | accepted |
| [0037](0037-separate-databases-for-develop-and-production.md)     | Use a separate Supabase database for `develop` and for production | accepted |
| [0038](0038-chain-era-period-and-style.md)                        | Chain era, period and style, with the era from a fixed list | accepted |
| [0039](0039-confirm-saving-a-duplicate-artwork.md)                | Confirm saving an artwork whose title and authors match another one | accepted |
| [0040](0040-manage-category-values-in-a-card-index.md)            | Manage category values in a card index view | accepted |
| [0041](0041-load-the-whole-collection-in-pages-of-1000.md)        | Load the whole collection in pages of 1000 rows | accepted |
| [0042](0042-filter-the-collection-in-the-browser.md)              | Filter the collection in the browser, from a panel, with the filter in the URL | accepted |
| [0043](0043-generate-database-types-from-the-migrations.md)       | Generate database types from the migrations | proposed |
| [0044](0044-load-wall-images-near-the-screen.md)                  | Show the wall first and load its images near the screen | accepted |
| [0045](0045-seed-the-local-database.md)                           | Seed the local database with a test account and artworks | accepted |
| [0046](0046-enter-the-date-of-creation-as-a-year-span.md)         | Enter the date of creation as a year span, as an alternative to a single year | accepted |
| [0047](0047-no-links-from-values-into-a-filtered-wall.md) | Leave values in the artwork view and the card index without links into a filtered wall | accepted |
| [0048](0048-flip-through-the-wall-from-the-artwork-view.md) | Flip through the wall from the artwork view in place of the history entry | accepted |
| [0049](0049-give-every-category-value-a-page-of-its-own.md) | Give every category value a page of its own with the learner's notes | accepted |
| [0050](0050-store-value-pages-in-details-tables.md)              | Store value pages in details tables and settle the details of the build | accepted |
| [0051](0051-load-and-save-a-value-page.md)                        | Load a value page from the collection and save its form in steps | accepted |
| [0052](0052-remember-wall-images-and-cap-their-width.md) | Remember the wall images for the session and cap their width | accepted |
| [0053](0053-link-values-and-artworks-from-notes.md) | Link values and artworks from notes with @ and # | accepted |
| [0054](0054-switch-to-the-light-theme-from-the-menu.md) | Switch to the light theme from the menu | accepted |
| [0056](0056-author-portrait-years-of-life-and-sort-name.md) | Give an author a portrait from a people search, two years of life and a sort name | accepted |
