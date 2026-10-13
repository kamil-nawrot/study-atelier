# @study-atelier/web

The study-atelier web app, built with SvelteKit (Svelte 5, TypeScript) and deployed to Cloudflare Pages.

Run commands from the repository root with pnpm, or from this folder:

| Command       | What it does                                                           |
| ------------- | ---------------------------------------------------------------------- |
| `pnpm dev`    | Start the development server                                           |
| `pnpm check`  | Type check (svelte-check) and verify generated Cloudflare types        |
| `pnpm lint`   | Prettier check and ESLint                                              |
| `pnpm format` | Format all files with Prettier                                         |
| `pnpm test`   | Run unit and component tests once (Vitest)                             |
| `pnpm build`  | Production build for Cloudflare Pages                                  |
| `pnpm gen`    | Regenerate `worker-configuration.d.ts` after changing `wrangler.jsonc` |

## Environment variables

The app needs the Supabase project URL and publishable key at build time ([ADR-0016](../../docs/decisions/0016-supabase-auth-in-the-browser.md)). Put them in `apps/web/.env` (ignored by git) or export them in the shell. The `wrangler types` scripts run with `--env-file /dev/null`, so the `.env` file does not leak into the generated Worker types.

| Variable                   | Value                                               |
| -------------------------- | --------------------------------------------------- |
| `SUPABASE_URL`             | Project URL, for example `https://abcd.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key from Project Settings, API Keys     |

In CI the web job reads them from the repository secrets of the same names.

## Local Supabase

A full Supabase stack runs in Docker, so migrations and the app can be tried without touching the shared hosted database ([ADR-0036](../../docs/decisions/0036-run-supabase-locally-in-docker.md)). Requirements: Docker running (Docker Desktop on Windows, with the WSL 2 backend).

```sh
pnpm db:start   # start the stack and apply supabase/migrations (first start downloads images)
pnpm db:env     # print API_URL and the keys
```

Copy `API_URL` to `SUPABASE_URL` and the publishable key (`PUBLISHABLE_KEY`, or `ANON_KEY` on older output) to `SUPABASE_PUBLISHABLE_KEY` in `apps/web/.env`, then run `pnpm dev`. Sign up in the app with any email address; the confirmation mail arrives in the mail catcher at http://127.0.0.1:54324 and the database can be browsed in Studio at http://127.0.0.1:54323.

| Command          | What it does                                      |
| ---------------- | ------------------------------------------------- |
| `pnpm db:start`  | Start the stack                                   |
| `pnpm db:stop`   | Stop the stack and keep its data                  |
| `pnpm db:reset`  | Drop the local database and replay all migrations |
| `pnpm db:status` | Show URLs and keys                                |
| `pnpm db:env`    | Print URLs and keys as `NAME=value` lines         |

To try a new migration, add it to `supabase/migrations` and run `pnpm db:reset`; it must apply cleanly on an empty database. CI does the same on every pull request (the `migrations` job), and the `database` job waits for it. The hosted database is still shared by `develop` and `main`, so every migration has to stay compatible with the app on `main` ([ADR-0012](../../docs/decisions/0012-database-migrations-from-github-actions.md)). Switch back to the hosted project by restoring its values in `apps/web/.env`.

## Tests

Vitest runs two projects. `*.spec.ts` files are unit tests in Node. `*.svelte.spec.ts` files are component tests that render Svelte components in headless Chromium through Playwright ([ADR-0018](../../docs/decisions/0018-component-tests-in-vitest-browser-mode.md)). Install the browser once before running them:

```sh
pnpm --filter @study-atelier/web exec playwright install --only-shell chromium
```

The tests also need `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to be set, or Vitest does not start. Any values work, because tests never call Supabase:

```sh
SUPABASE_URL=https://test.supabase.co SUPABASE_PUBLISHABLE_KEY=test-key pnpm test
```

The project was scaffolded with:

```sh
npx sv@1.1.1 create --template minimal --types ts --add prettier eslint vitest="usages:unit" sveltekit-adapter="adapter:cloudflare+cfTarget:pages" --no-install web
```
