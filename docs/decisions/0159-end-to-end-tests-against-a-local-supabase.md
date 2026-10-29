# 0159. End-to-end tests against a local Supabase

- Status: accepted
- Date: 2026-10-29

## Context and problem statement

The tests are Vitest only ([ADR-0018](0018-component-tests-in-vitest-browser-mode.md)): unit tests and component tests with Supabase mocked. Nothing checks a whole flow of the learner in a real browser against the real database, its row level security and its functions, although the app is open to other learners since 0.13. How are such flows tested, and how much does a failure weigh?

## Decision drivers

- A flow runs against what production runs: the migrations, RLS and database functions.
- No shared database is touched ([ADR-0012](0012-database-migrations-from-github-actions.md)), and no data stays behind.
- Tests do not depend on Wikipedia, Wikidata or Commons.
- The first runs show whether the tests are stable before they block anything.

## Considered options

- Playwright with canned Supabase answers (`page.route`)
- Playwright against a local Supabase stack

## Decision outcome

Chosen by the owner: Playwright against a local Supabase stack, informational at first.

- `@playwright/test` runs `apps/web/e2e/*.spec.ts` with `pnpm test:e2e`; the config reads the local stack with `supabase status` and starts `vite dev` against it.
- Every test gets its own learner, created through the local admin API with an accepted legal version and deleted after the test with all its data.
- Requests to Wikipedia, Wikidata, Wikimedia and Wiktionary are aborted.
- The first flows: signing in and out, a wrong password, adding an artwork and moving it to the archive and back, and adding an author in the card index that the artwork form then suggests.
- The workflow "End-to-end" runs on every pull request touching the web app, the UI library or `supabase/`, with a fresh `supabase start`. It is not required for merging until the owner decides it has proven stable; the traces of failed tests are kept for a week.

### Consequences

- Good: the flows that matter most are checked against the real database on every change.
- Bad: each run adds a few minutes, and a local run needs a local Supabase with every migration applied.

## More information

- Issue ATL-58. Supplements ADR-0018, which covers Vitest only.
