# 0018. Test Svelte components and pages in Vitest browser mode

- Status: accepted
- Date: 2026-10-11

## Context and problem statement

The sign-in, sign-up and password views talk to Supabase Auth from the browser ([ADR-0016](0016-supabase-auth-in-the-browser.md)). Only their logic (validation, error mapping) had unit tests; the views themselves were checked by hand. The app needs a way to test components and pages that is fast, runs in CI without a Supabase project, and keeps working when the views are refactored.

## Decision drivers

- Tests run on every pull request in GitHub Actions at no cost.
- Behaviour is checked in a real browser: focus, form submission, ARIA roles.
- No Supabase project or network is needed.
- Tests survive refactors of the component structure.

## Considered options

1. Vitest browser mode with Playwright Chromium and `vitest-browser-svelte`, Supabase mocked
2. Vitest with jsdom and Testing Library, Supabase mocked
3. End-to-end tests with Playwright against a running app and Supabase

## Decision outcome

Chosen option: 1, because it is the setup the Svelte CLI (`sv`) adds for component tests, it runs in a real browser engine instead of a DOM emulation, and it reuses the existing Vitest configuration.

- `apps/web` has two Vitest projects: `server` (Node, `*.spec.ts`) and `client` (headless Chromium, `*.svelte.spec.ts`).
- Tests mock `#lib/supabase.ts` and `$app/navigation` and query the page by role, label and text.
- CI installs the Chromium headless shell before the tests.

### Consequences

- Good: the auth views are covered without a test Supabase project.
- Good: tests do not depend on component internals, so ATL-28 can restructure the views.
- Bad: CI downloads a browser on each run, which adds time to the web job.
- Bad: a mocked Supabase does not catch changes in the real API; that needs end-to-end tests once Supabase runs locally (ATL-25).

## More information

- Vitest browser mode: https://vitest.dev/guide/browser/
- vitest-browser-svelte: https://github.com/vitest-community/vitest-browser-svelte
