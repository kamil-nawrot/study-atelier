# 0006. Host on free tiers: Cloudflare Pages for the frontend, GitHub Actions for CI/CD

- Status: accepted
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

The app has a single user for now, so running costs should be zero. The project should still have a simple CI/CD pipeline.

## Considered options

- Cloudflare Pages
- Vercel
- Netlify

## Decision outcome

- Frontend: Cloudflare Pages.
- CI/CD: GitHub Actions (free minutes for private repositories).
- Backend and database hosting are covered by [0005](0005-go-backend.md) and [0008](0008-supabase-database-and-auth.md).

### Consequences

- Good: no cost; preview deployments per pull request.
- Bad: free-tier limits and policies can change; to be reviewed if the app gains more users.
