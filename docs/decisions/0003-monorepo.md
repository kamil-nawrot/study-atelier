# 0003. Keep all project code in one repository

- Status: accepted
- Date: 2026-10-10

## Context and problem statement

The app has a web frontend and server-side parts (at first Supabase migrations and Edge Functions, possibly a custom backend later). They can live in one repository or in separate ones.

## Considered options

- Monorepo
- Separate repositories for frontend and server-side code

## Decision outcome

Chosen option: monorepo (`kamil-nawrot/study-atelier`, private), because the project is small, has one developer, and changes often span frontend, database and docs at once.

The exact folder layout will be decided when application code is introduced.

### Consequences

- Good: one pull request can change API, UI and docs together; one place for CI.
- Bad: CI must avoid running every job on every change; to be handled with path filters.
