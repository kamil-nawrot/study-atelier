# 0005. Build the backend in Go and run it on Google Cloud Run

- Status: proposed
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

The app needs a backend API. Kamil would prefer Go but is open to alternatives. Hosting must be free while the app has a single user.

## Considered options

- Go service on Google Cloud Run
- Go service on another free host (for example Render or Koyeb)
- No custom backend: frontend talks to Supabase directly

## Decision outcome

Proposed option: a Go service on Google Cloud Run, because Go is simple and fast, Kamil wants to use it, and Cloud Run scales to zero and fits within its free tier.

Awaiting Kamil's confirmation, in particular of the backend host.

### Consequences

- Good: a real backend to learn on; container-based, so the host can be changed later.
- Bad: Cloud Run requires a Google Cloud billing account with a card, even when usage stays free; cold starts after idle periods.
