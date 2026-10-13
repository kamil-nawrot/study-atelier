# 0036. Run Supabase locally in Docker for development and migration testing

- Status: proposed
- Date: 2026-10-13

## Context and problem statement

The free Supabase plan has no branching and both free project slots are taken, so `develop` and `main` share one database ([ADR-0012](0012-database-migrations-from-github-actions.md)). A migration reaches that database from CI without having been tried anywhere first, and the web app can only be developed against the shared data and accounts.

## Decision drivers

- Migrations can be tried before they reach the shared database.
- The app can run against auth, storage and the database with throw-away test accounts.
- The same stack can later run database tests in CI ([ATL-58](https://linear.app/kamil-nawrot/issue/ATL-58)).
- Zero cost, and works on the owner's Windows machine.

## Considered options

1. The Supabase CLI local stack (`supabase start`, Docker)
2. A second hosted project
3. Plain Postgres in Docker with hand-made stand-ins for auth and storage

## Decision outcome

Chosen option: 1, the Supabase CLI local stack.

- The CLI is a root dev dependency pinned to the version CI uses (2.120.0), so `pnpm exec supabase` behaves the same locally and in the `database` job.
- [`supabase/config.toml`](../../supabase/config.toml) starts only what the app uses: database, API, auth, storage, Studio and the local mail catcher. Realtime, edge functions and analytics are off. Email confirmation is on, as in the hosted project, and the confirmation mails are read in the mail catcher.
- The local stack replays `supabase/migrations` on `supabase db reset`, so a new migration is tried there first. Migrations stay backward compatible with the app on `main`, because the hosted database is still shared.
- There is no seed file: test accounts and artworks are made in the running app.
- The web app reads `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from `apps/web/.env`; for the local stack they come from `pnpm db:env`.

### Consequences

- Good: a migration is applied from scratch on a clean database before it can reach the shared one.
- Good: no test data in the shared database.
- Bad: Docker must be installed and running, and the first start downloads several images.
- Bad: the local stack is a different Postgres setup than the hosted project, so it catches SQL and policy errors but not every hosted difference.

## More information

Setup is described in the [web README](../../apps/web/README.md#local-supabase). Running the stack in CI for database and end-to-end tests is left to ATL-58.
