# Architecture

A lightweight [arc42](https://arc42.org) outline. Sections are filled in as the system takes shape.

## 1. Introduction and goals

See [product vision](../product/vision.md).

## 2. Constraints

- Single user for now; running costs must stay at zero ([ADR-0006](../decisions/0006-zero-cost-hosting.md)).
- Monorepo ([ADR-0003](../decisions/0003-monorepo.md)) with a Svelte frontend ([ADR-0004](../decisions/0004-svelte-frontend.md)) and no custom backend: Supabase provides the database, auth and server functions ([ADR-0005](../decisions/0005-no-custom-backend.md), [ADR-0008](../decisions/0008-supabase-database-and-auth.md)).

## 3. Context and scope

To be described with a C4 system context diagram.

## 4. Solution strategy

To be described once the stack decisions are accepted.

## 5. Building blocks

To be described with C4 container and component diagrams.

- `apps/web`: the SvelteKit app.
- `packages/ui`: shared Svelte components, token CSS, fonts and base styles, documented in Storybook ([ADR-0013](../decisions/0013-component-library-with-storybook.md)); interface icons come from Lucide through its `Icon` component ([ADR-0017](../decisions/0017-ui-icons-from-lucide.md)).

### Data model

The atelier lives in Supabase Postgres ([ADR-0014](../decisions/0014-artwork-collection-data-model.md)):

- `artworks`: one row per artwork, with its per-learner record number and image references.
- `category_values` and `artwork_values`: authors, periods, styles, materials and locations, shared between a learner's artworks.
- `categories` and `artwork_types`: fixed lists, extended by migrations.
- Storage bucket `artwork-images`: the learner's own images, private, one folder per learner.

Every learner-owned row is protected by Row Level Security on `owner_id`.

## 6. Runtime view

### Opening the atelier

1. The `/atelier` page load asks Supabase for the learner's artworks outside the trash, newest first, with their authors (`#lib/collection/artworks.ts`).
2. In parallel it asks the Wikimedia Commons API for the size and direct thumbnail URL of every Commons image (up to 50 files per request, identified by an `Api-User-Agent` header, one retry after `Retry-After` on 429) and Supabase Storage for signed URLs of uploaded images. Tiles load thumbnails straight from `upload.wikimedia.org`; only when the API does not answer they fall back to `Special:FilePath`, which redirects.
3. The wall places each tile into the shortest column by its image proportions. Without a known size a tile counts as 4:5, and if Commons does not answer the wall still shows every image.
4. Search by title runs in the browser on the loaded list.

## 7. Deployment view

- The web app is a SvelteKit build for Cloudflare Pages, project `study-atelier`.
- GitHub Actions ([`ci.yml`](../../.github/workflows/ci.yml)) runs lint, type check, unit and component tests and the build, then deploys with Wrangler ([ADR-0011](../decisions/0011-deploy-from-github-actions.md)).
- The same workflow checks `packages/ui` and builds its Storybook without deploying it ([ADR-0013](../decisions/0013-component-library-with-storybook.md)).

| Trigger | Deployment |
| --- | --- |
| Push to `main` | Production at `study-atelier.pages.dev` |
| Push to `develop` | Preview at `develop.study-atelier.pages.dev` |
| Pull request | Checks only, no deployment |

- The database is one Supabase project shared by `develop` and `main`. Migrations in [`supabase/migrations`](../../supabase/migrations) are applied by the `database` job in `ci.yml` after a push to `develop` ([ADR-0012](../decisions/0012-database-migrations-from-github-actions.md)).
- The scheduled workflow [`supabase-keep-alive.yml`](../../.github/workflows/supabase-keep-alive.yml) calls the `keep_alive()` database function daily so the free project is not paused.

## 8. Crosscutting concepts

- Authentication: Supabase Auth from the browser with email and password; the session lives in `localStorage` and server-side rendering is off ([ADR-0016](../decisions/0016-supabase-auth-in-the-browser.md)).
- UI text: typed message dictionaries in `apps/web/src/lib/i18n`, Polish only for now ([ADR-0015](../decisions/0015-typed-message-dictionaries-for-i18n.md)).
- UI patterns: tokens, the component library and base styles carry the shared look and behaviour; the remaining rules are in [ui-patterns.md](../guidelines/ui-patterns.md) ([ADR-0019](../decisions/0019-encode-ui-standards-in-tokens-and-the-library.md)).

## 9. Architecture decisions

See [decisions/](../decisions/).

## 10. Quality requirements

Not yet described.

## 11. Risks and technical debt

- The free Supabase project is paused after one week without database activity ([ADR-0008](../decisions/0008-supabase-database-and-auth.md)); the daily keep-alive runs only from the default branch (`develop`).
- `develop` and `main` share one database, so a migration reaches it before the release ([ADR-0012](../decisions/0012-database-migrations-from-github-actions.md)).

## 12. Glossary

See [product glossary](../product/glossary.md).
