# 0003. Keep frontend and backend in one repository

- Status: accepted
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

The app has a web frontend and a backend API. They can live in one repository or in separate ones.

## Considered options

- Monorepo
- Separate repositories for frontend and backend

## Decision outcome

Chosen option: monorepo (`kamil-nawrot/study-atelier`, private), because the project is small, has one developer, and changes often span frontend, backend and docs at once.

The exact folder layout will be decided when application code is introduced.

### Consequences

- Good: one pull request can change API, UI and docs together; one place for CI.
- Bad: CI must avoid running every job on every change; to be handled with path filters.
