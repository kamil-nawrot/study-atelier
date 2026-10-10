# @study-atelier/web

The study-atelier web app, built with SvelteKit (Svelte 5, TypeScript) and deployed to Cloudflare Pages.

Run commands from the repository root with pnpm, or from this folder:

| Command       | What it does                                                           |
| ------------- | ---------------------------------------------------------------------- |
| `pnpm dev`    | Start the development server                                           |
| `pnpm check`  | Type check (svelte-check) and verify generated Cloudflare types        |
| `pnpm lint`   | Prettier check and ESLint                                              |
| `pnpm format` | Format all files with Prettier                                         |
| `pnpm test`   | Run unit tests once (Vitest)                                           |
| `pnpm build`  | Production build for Cloudflare Pages                                  |
| `pnpm gen`    | Regenerate `worker-configuration.d.ts` after changing `wrangler.jsonc` |

The project was scaffolded with:

```sh
npx sv@1.1.1 create --template minimal --types ts --add prettier eslint vitest="usages:unit" sveltekit-adapter="adapter:cloudflare+cfTarget:pages" --no-install web
```
