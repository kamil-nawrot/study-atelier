# 0005. Do not build a custom backend for now; use Supabase directly

- Status: accepted
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

The app needs server-side data access and some server logic. Kamil initially preferred a Go backend, but asked what would be lost by skipping a custom backend entirely.

## Decision drivers

- Zero running cost and minimal setup for a single-user app.
- The app is mostly create, read, update and delete of artworks, plus learning features.
- Learning Go was a secondary goal.

## Considered options

- Go service on Google Cloud Run (free tier, requires a billing account with a card)
- Go service on Render or Koyeb (free tier, slower cold starts)
- No custom backend: the frontend talks to Supabase directly

## Decision outcome

Chosen option: no custom backend for now. The frontend uses the Supabase client directly:

- data access through the Supabase API, protected by Row Level Security
- logic that belongs next to the data as Postgres functions and triggers
- logic that needs a server (external API calls, secrets, scheduled jobs) as Supabase Edge Functions in TypeScript

A Go backend can be added later if a real need appears; that would be a new ADR superseding this one.

### Consequences

- Good: no backend to host or deploy; one language (TypeScript) across the codebase; fastest path to a working app.
- Bad: no Go learning for now; logic in SQL and RLS policies is harder to test and review, so migrations and policies must be versioned in the repository and covered by tests; stronger coupling to Supabase.
