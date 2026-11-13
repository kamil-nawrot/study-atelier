# 0284. Apply the migrations before deploying the app

- Status: accepted
- Date: 2026-11-13

## Context and problem statement

[ADR-0037](0037-separate-databases-for-develop-and-production.md) deploys the build in the `web` job of `ci.yml` and applies the migrations afterwards in the `database` job, and accepts "a short window in which the new build runs against the old schema". On a release that window holds the encrypted dump of the production database and `supabase db push`, and when the migrations fail the new build stays on the old schema with nothing to bring it back. [ADR-0139](0139-ask-the-learner-to-reload-after-a-new-release.md) and the architecture docs describe the opposite order. Which order should CI use?

## Decision drivers

- The new build never runs against a schema it was not made for.
- A failed migration leaves production as it was: the previous build on the previous schema.
- The build that is deployed is the build that passed the checks.

## Considered options

- Deploy, then migrate (as before)
- Migrate, then deploy the build kept from the `web` job
- Migrate, then build again and deploy

## Decision outcome

Chosen by the owner: migrate, then deploy (ATL-722). The deployed build is the one the checks passed on: the `web` job builds the app and keeps `apps/web/.svelte-kit/cloudflare` as an artifact for one day; a new `deploy` job runs after `web` and `database` succeed, takes the artifact and uploads it with Wrangler. This supersedes the order of deployment and migrations in [ADR-0037](0037-separate-databases-for-develop-and-production.md).

### Consequences

- Good: when the migrations fail, nothing is deployed and the previous build keeps running on the untouched schema.
- Good: the new build starts on the schema it needs.
- Bad: while the migrations run, and until the deploy finishes, the previous build runs against the new schema. When a release renames or drops something the previous build uses (ATL-721), it fails there until the new build is live and the tab reloads.
- Bad: a release takes one job longer (install and upload, about a minute).

## More information

- Issue ATL-722, from the quality audit of 2026-11-13.
