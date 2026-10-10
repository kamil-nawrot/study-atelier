# 0008. Use Supabase for the database and authentication

- Status: accepted
- Date: 2026-10-10

## Context and problem statement

The app needs a relational database and, eventually, login. The owner already has a Supabase project on the free tier.

## Considered options

- Supabase (Postgres, Auth, Storage)
- Neon (Postgres only)

## Decision outcome

Chosen option: Supabase, for the database, authentication, Edge Functions, and storage of user-uploaded image overrides. The app reuses the second free project slot in the owner's Supabase account.

Free tier limits checked on 2026-10-10 (https://supabase.com/pricing): 2 active projects, 500 MB database per project, 1 GB file storage, 5 GB egress, and projects are paused after one week of inactivity.

### Consequences

- Good: database, auth and storage from one free service; plain Postgres, so a custom backend could be added later without migrating data (see [0005](0005-no-custom-backend.md)).
- Bad: inactive projects are paused; mitigated with a scheduled weekly request from GitHub Actions.
