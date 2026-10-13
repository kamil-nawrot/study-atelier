# 0037. Use a separate Supabase database for `develop` and for production

- Status: accepted
- Date: 2026-10-13

## Context and problem statement

[0012](0012-database-migrations-from-github-actions.md) made `develop` and `main` share one Supabase database, because the free plan was assumed to leave room for one project only. A migration merged to `develop` therefore changes the owner's real collection at once, while production still runs the older code from `main`. Test data created on the `develop` preview lands in the real collection, and a faulty migration has nothing in front of it. The owner has since created a second free Supabase project, so the constraint is gone. Release 0.1 waits on this decision.

## Decision drivers

- A migration must be proven on a database that holds no real data before it reaches one that does.
- The existing project holds the owner's real collection and must not move.
- Zero cost.
- Keep one workflow and one set of secret names.

## Considered options

1. Two projects: the existing one stays production, a new one is the `develop` database
2. One shared project with expand/contract migrations and database backups
3. A paid plan with Supabase branching

## Decision outcome

Chosen option: 1, two Supabase projects.

- The existing project is production. The new project is the `develop` database, filled with sample artworks by hand.
- GitHub environments `develop` and `production` hold the same secret names: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`. Jobs select the environment by branch: `main` uses `production`, every other ref uses `develop`. The Supabase secrets are no longer repository secrets; the Cloudflare ones stay repository secrets.
- A push to `develop` applies migrations to the develop database and deploys the preview built against it. A push to `main`, which is the release, applies the same migrations to the production database and deploys the production build against it. Pull requests build against the develop environment and deploy nothing.
- The keep-alive workflow pings both databases.
- Migrations still have to stay backward compatible with the app on `main`, because production runs the older code until the release. A column or function is removed only in a migration that follows a release which no longer uses it.
- Setup of the environments and the develop project is described in [hosted environments](../architecture/hosted-environments.md).

### Consequences

- Good: migrations and test data reach the real collection only through a release.
- Good: the `develop` preview can be used and broken freely.
- Bad: both free project slots are used.
- Bad: a release now carries a migration step that has to succeed on the production database; the develop run is the rehearsal, but it uses different data.
- Bad: two sets of Supabase credentials and two Auth configurations to keep in step by hand.
- Bad: on a release the production deployment is uploaded before the migrations are applied, so a short window exists in which the new build runs against the old schema.

## More information

Supersedes [0012](0012-database-migrations-from-github-actions.md); the rest of 0012 (migrations from GitHub Actions, scoped access token, keep-alive) still applies per environment. Narrows [0036](0036-run-supabase-locally-in-docker.md), which assumed a shared hosted database.
