# Hosted environments

Two environments, each with its own Supabase project ([ADR-0037](../decisions/0037-separate-databases-for-develop-and-production.md)).

| Environment  | Branch    | App                               | Supabase project                                |
| ------------ | --------- | --------------------------------- | ----------------------------------------------- |
| `production` | `main`    | `study-atelier.pages.dev`         | the original project, holds the real collection |
| `develop`    | `develop` | `develop.study-atelier.pages.dev` | the second project, holds sample data           |

## GitHub environments

Settings, Environments: `develop` and `production`, each with these secrets:

| Secret                     | Value                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_URL`             | Project URL of that environment's project                                                                                                                                            |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key of that project                                                                                                                                                      |
| `SUPABASE_ACCESS_TOKEN`    | Personal access token with read access to Project Settings, API Keys and API Key Secrets for that project; it can be one token for both projects                                     |
| `SUPABASE_DB_PASSWORD`     | Database password of that project                                                                                                                                                    |
| `SUPABASE_SECRET_KEY`      | Secret key of that project (Project Settings, API Keys), used only by the unused images clean-up ([ADR-0090](../decisions/0090-clean-up-unused-images-daily-from-github-actions.md)) |

Deployment branches: `production` allows `main` and `develop`, `develop` allows `develop`. The scheduled keep-alive and the unused images clean-up run from the default branch, `develop`, so they need access to `production`; the consequence is that code merged to `develop` can read the production secrets, and only the owner merges.

The same five names must not remain as repository secrets: an environment secret overrides a repository secret, but a missing one would silently fall back to it and point `develop` at production.

## New Supabase project

1. Create the project on the Free plan in the same region as production and check that the creation screen shows no paid compute add-on.
2. In Authentication, URL Configuration, set the Site URL to `https://develop.study-atelier.pages.dev` and add it, with `http://localhost:5173`, to the redirect URLs.
3. In Authentication, Providers, Email, keep the same settings as production (email confirmation on).
4. Push to `develop`: the `database` job applies all migrations, including the `artwork-images` bucket and the `keep_alive()` function.
5. Sign up in the develop app, then fill it with the sample artworks by running the seed files in the SQL Editor.
6. Run the `Supabase keep-alive` workflow manually and check that both jobs pass. Run the `Unused images clean-up` workflow manually from `develop` and, after the next release, from `main`: a manual run cleans only the environment of its branch, the daily one both ([ADR-0092](../decisions/0092-clean-up-images-by-hand-for-one-environment.md)).

## Releasing

A merge to `main` applies pending migrations to the production database and deploys the production build. Review the new files in `supabase/migrations` before merging the release.

## Testing reviews on the develop database

Reviews plan one day at a time ([ADR-0071](../decisions/0071-put-the-plan-first-on-the-review-start.md)), so a second session the same day finds nothing new. To try the next day without waiting, run [`supabase/scripts/shift-review-dates.sql`](../../supabase/scripts/shift-review-dates.sql) in the SQL Editor of the develop project, with the learner's e-mail and the number of days to move. It moves every due date, last review, card creation and answer of that learner into the past by that many days, so the app sees the days as passed: the artworks due in them are waiting, the daily limit of new artworks starts again, and FSRS counts the elapsed time correctly. It is for the develop and local databases only, never production.
