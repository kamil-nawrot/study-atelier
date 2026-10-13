# study-atelier

An app for learning art history, where the learner builds their own atelier: a personal database of artworks assembled as part of studying.

> Status: project setup. The web app is an empty skeleton.

## Development

Requirements: Node.js 22 (see `.nvmrc`) and pnpm 10.

```sh
pnpm install
pnpm dev      # start the web app
pnpm storybook # browse the UI components
pnpm lint     # Prettier, ESLint and Stylelint
pnpm check    # type check
pnpm test     # unit tests
pnpm build    # production build
```

Deployment to Cloudflare Pages runs in GitHub Actions; see [ADR-0011](docs/decisions/0011-deploy-from-github-actions.md).

Database migrations in [`supabase/migrations`](supabase/migrations) are applied to Supabase from GitHub Actions: to the develop database after a push to `develop`, to the production database after a push to `main`; see [ADR-0037](docs/decisions/0037-separate-databases-for-develop-and-production.md) and [hosted environments](docs/architecture/hosted-environments.md). To try migrations first, run Supabase locally in Docker; see [Local Supabase](apps/web/README.md#local-supabase).

CI runs the same checks on every pull request ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Documentation

Project documentation, decisions and working rules live in [`docs/`](docs/).
