# @study-atelier/web

The study-atelier web app, built with SvelteKit (Svelte 5, TypeScript) and deployed to Cloudflare Pages.

Run commands from the repository root with pnpm, or from this folder:

| Command              | What it does                                                           |
| -------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`           | Start the development server                                           |
| `pnpm check`         | Type check (svelte-check) and verify generated Cloudflare types        |
| `pnpm lint`          | Prettier check and ESLint                                              |
| `pnpm format`        | Format all files with Prettier                                         |
| `pnpm test`          | Run unit and component tests once (Vitest)                             |
| `pnpm test:coverage` | Run the tests once and measure coverage into `coverage/`               |
| `pnpm build`         | Production build for Cloudflare Pages                                  |
| `pnpm gen`           | Regenerate `worker-configuration.d.ts` after changing `wrangler.jsonc` |

## Environment variables

The app needs the Supabase project URL and publishable key at build time ([ADR-0016](../../docs/decisions/0016-supabase-auth-in-the-browser.md)). Put them in `apps/web/.env` (ignored by git) or export them in the shell. The `wrangler types` scripts run with `--env-file /dev/null`, so the `.env` file does not leak into the generated Worker types.

| Variable                   | Value                                               |
| -------------------------- | --------------------------------------------------- |
| `SUPABASE_URL`             | Project URL, for example `https://abcd.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key from Project Settings, API Keys     |

In CI the web job reads them from the repository secrets of the same names.

## Local Supabase

A full Supabase stack runs in Docker, so migrations and the app can be tried without touching a hosted database ([ADR-0036](../../docs/decisions/0036-run-supabase-locally-in-docker.md)). Requirements: Docker running (Docker Desktop with the WSL 2 backend on Windows, or [Docker on WSL 2](#docker-on-wsl-2)).

```sh
pnpm db:start   # start the stack and apply supabase/migrations (first start downloads images)
pnpm db:env     # print API_URL and the keys
```

Copy `API_URL` to `SUPABASE_URL` and the publishable key (`PUBLISHABLE_KEY`, or `ANON_KEY` on older output) to `SUPABASE_PUBLISHABLE_KEY` in `apps/web/.env`, then run `pnpm dev`. Sign in with the seeded account `test@example.com` and password `password123`; it already owns a few sample artworks. Other accounts can be signed up with any email address; the confirmation mail arrives in the mail catcher at http://127.0.0.1:54324. The database can be browsed in Studio at http://127.0.0.1:54323.

[`supabase/seed.sql`](../../supabase/seed.sql) creates the account and the artworks. It runs when the local database is created, that is on the first `pnpm db:start` and on every `pnpm db:reset`, but not on a later `pnpm db:start` of a database that already exists. Hosted databases never get it. To load it into an existing local database, run `pnpm db:reset`.

| Command          | What it does                                                 |
| ---------------- | ------------------------------------------------------------ |
| `pnpm db:start`  | Start the stack                                              |
| `pnpm db:stop`   | Stop the stack and keep its data                             |
| `pnpm db:reset`  | Drop the local database, replay all migrations, run the seed |
| `pnpm db:status` | Show URLs and keys                                           |
| `pnpm db:env`    | Print URLs and keys as `NAME=value` lines                    |
| `pnpm db:types`  | Regenerate `src/lib/database.types.ts`                       |

To try a new migration, add it to `supabase/migrations` and run `pnpm db:reset`; it must apply cleanly on an empty database. CI does the same on every pull request (the `migrations` job), and the `database` job waits for it. After a migration changes tables, columns or functions, run `pnpm db:types` with the stack running and commit `src/lib/database.types.ts`; the Supabase client in `lib/supabase.ts` is typed with it, so a query that no longer matches the schema fails `pnpm check`. CI regenerates the file from the replayed migrations and fails when the committed one differs. A migration only has to work with the code of its own release ([ADR-0037](../../docs/decisions/0037-separate-databases-for-develop-and-production.md)), so the local database matches the code of the branch it was last reset on. After switching to a branch whose `supabase/migrations` differ, run `pnpm db:reset`; the reset drops everything you added locally and restores the seeded account and artworks. Switch back to the hosted project by restoring its values in `apps/web/.env`.

### Docker on WSL 2

Docker Engine installed inside the WSL distribution works without Docker Desktop.

- Install Docker Engine for the distribution (see the [Docker docs](https://docs.docker.com/engine/install/)). Enable systemd by adding `[boot]` and `systemd=true` to `/etc/wsl.conf`, then run `wsl --shutdown` in PowerShell.
- Add yourself to the `docker` group with `sudo usermod -aG docker $USER` and restart WSL with `wsl --shutdown`. Without it `pnpm db:start` fails with `permission denied` on `/var/run/docker.sock`. Do not run the pnpm scripts with `sudo`.
- Keep the repository in the WSL file system (for example `~/projects/study-atelier`), not under `/mnt/c`.
- Limit memory and swap in `%UserProfile%\.wslconfig` (create the file if it does not exist), then run `wsl --shutdown`:

  ```ini
  [wsl2]
  memory=6GB
  swap=0
  ```

- The distribution's `ext4.vhdx` disk grows with the Docker images and does not shrink by itself. Make it return freed space with `wsl --manage <distribution> --set-sparse true`, and move it to another drive with `wsl --manage <distribution> --move <folder>` when the system drive is short of space. Both need a recent WSL (`wsl --update`).

## Tests

Vitest runs two projects. `*.spec.ts` files are unit tests in Node. `*.svelte.spec.ts` files are component tests that render Svelte components in headless Chromium through Playwright ([ADR-0018](../../docs/decisions/0018-component-tests-in-vitest-browser-mode.md)). Install the browser once before running them:

```sh
pnpm --filter @study-atelier/web exec playwright install --only-shell chromium
```

The tests also need `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to be set, or Vitest does not start. Any values work, because tests never call Supabase:

```sh
SUPABASE_URL=https://test.supabase.co SUPABASE_PUBLISHABLE_KEY=test-key pnpm test
```

`pnpm test:coverage` runs the same tests and measures coverage of `src/` with V8: a summary in the terminal and a browsable report in `coverage/index.html`. CI shows the summary in the job summary of the Web app job; there is no minimum yet.

The project was scaffolded with:

```sh
npx sv@1.1.1 create --template minimal --types ts --add prettier eslint vitest="usages:unit" sveltekit-adapter="adapter:cloudflare+cfTarget:pages" --no-install web
```
