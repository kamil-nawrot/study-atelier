# Hosted environments

Two environments, each with its own Supabase project ([ADR-0037](../decisions/0037-separate-databases-for-develop-and-production.md)).

| Environment | Branch | App | Supabase project |
| --- | --- | --- | --- |
| `production` | `main` | `study-atelier.pages.dev` | the original project, holds the real collection |
| `develop` | `develop` | `develop.study-atelier.pages.dev` | the second project, holds sample data |

## GitHub environments

Settings, Environments: `develop` and `production`, each with these secrets:

| Secret | Value |
| --- | --- |
| `SUPABASE_URL` | Project URL of that environment's project |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key of that project |
| `SUPABASE_ACCESS_TOKEN` | Personal access token with read access to Project Settings, API Keys and API Key Secrets for that project; it can be one token for both projects |
| `SUPABASE_DB_PASSWORD` | Database password of that project |

Deployment branches: `production` allows `main` and `develop`, `develop` allows `develop`. The scheduled keep-alive runs from the default branch, `develop`, so it needs access to `production`; the consequence is that code merged to `develop` can read the production secrets, and only the owner merges.

The same four names must not remain as repository secrets: an environment secret overrides a repository secret, but a missing one would silently fall back to it and point `develop` at production.

## New Supabase project

1. Create the project on the Free plan in the same region as production and check that the creation screen shows no paid compute add-on.
2. In Authentication, URL Configuration, set the Site URL to `https://develop.study-atelier.pages.dev` and add it, with `http://localhost:5173`, to the redirect URLs.
3. In Authentication, Providers, Email, keep the same settings as production (email confirmation on).
4. Push to `develop`: the `database` job applies all migrations, including the `artwork-images` bucket and the `keep_alive()` function.
5. Sign up in the develop app, then fill it with the sample artworks by running the seed files in the SQL Editor.
6. Run the `Supabase keep-alive` workflow manually and check that both jobs pass.

## Releasing

A merge to `main` applies pending migrations to the production database and deploys the production build. Review the new files in `supabase/migrations` before merging the release.
