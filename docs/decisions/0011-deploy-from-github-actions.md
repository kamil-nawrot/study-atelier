# 0011. Deploy to Cloudflare Pages from GitHub Actions

- Status: accepted
- Date: 2026-10-10

## Context and problem statement

The web app is hosted on Cloudflare Pages ([0006](0006-zero-cost-hosting.md)). Cloudflare can either build the app itself from GitHub, or receive a ready build from GitHub Actions.

## Decision drivers

- Nothing should be deployed unless lint, type check, unit tests and the build pass.
- One place to see the pipeline.
- Zero cost.

## Considered options

1. Deploy from GitHub Actions with Wrangler, after the CI steps
2. Cloudflare Pages Git integration, building separately from CI

## Decision outcome

Chosen option: 1, deploy from GitHub Actions.

- The CI job builds the app once and, when the checks pass, uploads `.svelte-kit/cloudflare` with `wrangler pages deploy`.
- A push to `main` is a production deployment. A push to `develop` and every pull request get a preview deployment named after the branch.
- Credentials are repository secrets `CLOUDFLARE_API_TOKEN` (permission: Account, Cloudflare Pages, Edit) and `CLOUDFLARE_ACCOUNT_ID`. The deploy steps are skipped while the secrets are missing.
- The workflow creates the Pages project `study-atelier` on its first run if it does not exist.

### Consequences

- Good: a failing check blocks the deployment; builds and deployments are visible in one GitHub Actions run.
- Bad: a Cloudflare API token is stored in GitHub and has to be rotated by hand if it leaks or expires.
