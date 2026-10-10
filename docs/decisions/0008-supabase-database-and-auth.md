# 0008. Use Supabase for the database and authentication

- Status: proposed
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

The app needs a relational database and, eventually, login. Kamil already has a Supabase project on the free tier.

## Considered options

- Supabase (Postgres, Auth, Storage)
- Neon (Postgres only)

## Decision outcome

Proposed option: Supabase, for the database, authentication, and storage of user-uploaded image overrides.

Free tier limits checked on 2026-10-10 (https://supabase.com/pricing): 2 active projects, 500 MB database per project, 1 GB file storage, 5 GB egress, and projects are paused after one week of inactivity.

Awaiting Kamil's confirmation.

### Consequences

- Good: database, auth and storage from one free service; plain Postgres, so the Go backend can connect directly.
- Bad: inactive projects are paused; mitigated with a scheduled weekly request from GitHub Actions.
