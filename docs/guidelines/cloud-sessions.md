# Cloud sessions

How a Claude Code cloud session gets a working environment and how it takes screenshots of the app. Both exist so a session does not spend time or tokens on manual setup.

## Session start hook

[`.claude/hooks/session-start.sh`](../../.claude/hooks/session-start.sh) runs at the start of every cloud session (it exits at once anywhere else, so it never touches a local machine). It:

- runs `pnpm install`;
- exports `SUPABASE_URL=https://abcd.supabase.co` and `SUPABASE_PUBLISHABLE_KEY=dummy`, because `pnpm build`, `pnpm test` and the dev server fail with `env_invalid` without them (the tests and screenshots never call a real Supabase project);
- when the Chromium headless shell in `/opt/pw-browsers` is an older build than the one Playwright expects, builds a folder with symlinks under `~/.cache/study-atelier/pw-browsers` that Vitest accepts, and points `PLAYWRIGHT_BROWSERS_PATH` at it. Nothing is downloaded: never run `playwright install` in a cloud session.

After the hook, `pnpm lint`, `pnpm check`, `pnpm test` and `pnpm build` work without extra steps. The hook is registered in [`.claude/settings.json`](../../.claude/settings.json) and only takes effect for sessions started after it is on the default branch.

## Screenshots

```sh
pnpm screenshot /atelier --combine
```

Starts the dev server on port 5199, opens the route in Chromium at a desktop (1440 x 900) and a phone (390 x 844, 2x) viewport and writes PNGs to `tmp/screenshots/` (ignored by git). Options:

| Option              | Effect                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--out <dir>`       | Output folder, for example a folder in the project files                                                                                                               |
| `--name <name>`     | File name prefix (default derived from the route)                                                                                                                      |
| `--viewport <v>`    | `desktop`, `phone` or `both` (default)                                                                                                                                 |
| `--combine`         | Also write `<name>-both.png` with both shots side by side                                                                                                              |
| `--full-page`       | Capture the whole page instead of the first screen                                                                                                                     |
| `--signed-out`      | No fake session (automatic for sign-in, sign-up and password pages)                                                                                                    |
| `--storage k=v`     | Set a localStorage entry first, for example `study-atelier:wall-order=period`                                                                                          |
| `--session k=v`     | Set a sessionStorage entry first, for example the wall sequence that gives the artwork view its arrows: `'study-atelier:wall-sequence={"query":"","numbers":[9,3,1]}'` |
| `--wait <selector>` | Wait for a selector before capturing                                                                                                                                   |
| `--type <text>`     | Click the notes editor and type this text first, for example `' @ba'` to open the link suggestions                                                                     |
| `--script <file>`   | Run a JavaScript file in the page first, for example to mock an option                                                                                                 |
| `--url <base>`      | Use a dev server that is already running                                                                                                                               |

Combine desktop and phone shots into one image when attaching to a thread: a thread accepts at most 24 attachments.

### What is mocked

All of it lives in [`apps/web/scripts/screenshot/`](../../apps/web/scripts/screenshot/).

- **Supabase** (`https://abcd.supabase.co/**`): a fake session in the `sb-abcd-auth-token` localStorage entry; `/rest/v1/artworks` answers from the sample artworks in `fixtures.mjs` (filters on `deleted_at`, `record_number` and `id`, and the single-object `Accept` header); `value_usage`, `period_era_usage` and `style_period_usage` answer from the values of the sample artworks, and the details tables from `VALUE_DETAILS` (Leonardo da Vinci has a portrait, years of life and a sort name) (a value's id is its kind and its name in lowercase, for example `/atelier/values/period/period-renaissance`); other tables and storage answer with empty lists; other RPCs answer with the first sample artwork.
- **Images**: own image URLs on `https://images.mock.test`, Wikimedia Commons (`api.php`, `upload.wikimedia.org`, `thumb.wikimedia.org`, `Special:FilePath`) and Wikidata are all answered locally with generated SVG gradients (a people search answers with `PEOPLE`), so nothing depends on the network and Commons rate limits do not matter.
- **Data**: ten sample artworks (plus one in the trash) with English titles and no personal data. Add or change rows in `fixtures.mjs` to show another state, for example an artwork with a long title or a very wide image.

When a view needs data the mock does not return yet, extend `mockSupabase` in `screenshot.mjs` rather than writing a one-off script in the session. If the app's queries change shape (for example a new column), update the sample rows in the same pull request.

### Gotchas

- Do not kill the dev server with `pkill -f 'vite dev'` from a command whose own text contains the same pattern: it kills the shell. The script stops the server it started by itself.
- `pnpm check` rewrites `.svelte-kit` env; a dev server that was already running then signs the fake session out. Start the screenshot after the check, or let the script start its own server.
