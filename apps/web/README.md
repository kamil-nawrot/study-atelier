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

## Tests

Vitest runs two projects. `*.spec.ts` files are unit tests in Node. `*.svelte.spec.ts` files are component tests that render Svelte components in headless Chromium through Playwright ([ADR-0018](../../docs/decisions/0018-component-tests-in-vitest-browser-mode.md)). Install the browser once before running them:

```sh
pnpm --filter @study-atelier/web exec playwright install --only-shell chromium
```

The project was scaffolded with:

```sh
npx sv@1.1.1 create --template minimal --types ts --add prettier eslint vitest="usages:unit" sveltekit-adapter="adapter:cloudflare+cfTarget:pages" --no-install web
```
