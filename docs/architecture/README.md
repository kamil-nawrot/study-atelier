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
- `packages/ui`: shared Svelte components, token CSS, fonts and base styles, documented in Storybook ([ADR-0013](../decisions/0013-component-library-with-storybook.md)).

## 6. Runtime view

Not yet described.

## 7. Deployment view

- The web app is a SvelteKit build for Cloudflare Pages, project `study-atelier`.
- GitHub Actions ([`ci.yml`](../../.github/workflows/ci.yml)) runs lint, type check, unit tests and the build, then deploys with Wrangler ([ADR-0011](../decisions/0011-deploy-from-github-actions.md)).
- The same workflow checks `packages/ui` and builds its Storybook without deploying it ([ADR-0013](../decisions/0013-component-library-with-storybook.md)).

| Trigger | Deployment |
| --- | --- |
| Push to `main` | Production at `study-atelier.pages.dev` |
| Push to `develop` | Preview at `develop.study-atelier.pages.dev` |
| Pull request | Checks only, no deployment |

- The database is one Supabase project shared by `develop` and `main`. Migrations in [`supabase/migrations`](../../supabase/migrations) are applied by the `database` job in `ci.yml` after a push to `develop` ([ADR-0012](../decisions/0012-database-migrations-from-github-actions.md)).
- The scheduled workflow [`supabase-keep-alive.yml`](../../.github/workflows/supabase-keep-alive.yml) calls the `keep_alive()` database function daily so the free project is not paused.

## 8. Crosscutting concepts

Not yet described.

## 9. Architecture decisions

See [decisions/](../decisions/).

## 10. Quality requirements

Not yet described.

## 11. Risks and technical debt

- The free Supabase project is paused after one week without database activity ([ADR-0008](../decisions/0008-supabase-database-and-auth.md)); the daily keep-alive runs only from the default branch (`develop`).
- `develop` and `main` share one database, so a migration reaches it before the release ([ADR-0012](../decisions/0012-database-migrations-from-github-actions.md)).

## 12. Glossary

See [product glossary](../product/glossary.md).
