# 0012. Apply database migrations from GitHub Actions

- Status: accepted
- Date: 2026-10-10

## Context and problem statement

The database schema, functions and Row Level Security policies live as SQL migrations in `supabase/migrations` ([0005](0005-no-custom-backend.md), [0008](0008-supabase-database-and-auth.md)). They have to reach the hosted Supabase project somehow. The free plan leaves room for one project for this app, so `develop` and `main` share one database.

## Decision drivers

- The repository is the source of truth for the schema.
- Nothing changes in the database unless CI passes.
- Zero cost.

## Considered options

1. GitHub Actions runs `supabase db push` after a push to `develop`
2. The owner pastes each migration into the SQL editor in the Supabase dashboard

## Decision outcome

Chosen option: 1, apply migrations from GitHub Actions.

- The `database` job in [`ci.yml`](../../.github/workflows/ci.yml) runs after the web checks on every push to `develop`. It links the project and runs `supabase db push` with the Supabase CLI.
- `main` uses the same database, so a release to `main` applies no migrations of its own.
- Credentials are repository secrets: `SUPABASE_URL` (the project reference is read from it), `SUPABASE_ACCESS_TOKEN` (a personal access token scoped to this project with read access to Project Settings, API Keys and API Key Secrets, which `supabase link` needs) and `SUPABASE_DB_PASSWORD`. The job is skipped while any of them is missing.
- Migrations must stay compatible with the app version on `main`, because both use the same database.

### Consequences

- Good: the database always matches the migrations on `develop`; every change is reviewed in a pull request.
- Bad: a Supabase access token that can read the project's secret API keys is stored in GitHub, together with the database password; both have to be rotated by hand if they leak, and the token expires after at most a year.
- Bad: a migration that breaks the app on `main` reaches the shared database before the release.

## More information

The free project is paused after a week without database activity. The scheduled [`supabase-keep-alive.yml`](../../.github/workflows/supabase-keep-alive.yml) workflow calls the `keep_alive()` database function once a day with the publishable key (secret `SUPABASE_PUBLISHABLE_KEY`). Scheduled workflows run only from the repository's default branch, which is `develop`.
