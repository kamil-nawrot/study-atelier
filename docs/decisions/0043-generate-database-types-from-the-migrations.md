# 0043. Generate database types from the migrations

- Status: proposed
- Date: 2026-10-14

## Context and problem statement

Row shapes such as `ArtworkRow` and the arguments of RPC calls are written by hand next to each query. A renamed column or a changed function signature compiles fine and fails only at runtime. How does the app learn the shape of the database from the schema itself?

## Decision drivers

- A schema change that breaks a query fails `pnpm check`, not the learner.
- The migrations stay the only source of truth for the schema ([ADR-0036](0036-run-supabase-locally-in-docker.md)).
- No new dependency and no database connection in `pnpm check`.

## Considered options

1. Generate `database.types.ts` with `supabase gen types` from the local stack, commit it, and let CI fail when it is stale
2. Generate the file at build time in CI and never commit it
3. Keep writing the shapes by hand

## Decision outcome

Chosen option: 1, because `pnpm check` and the editor keep working without Docker, and a stale file is caught where the migrations are replayed anyway.

- `pnpm db:types` writes `apps/web/src/lib/database.types.ts` from the running local stack. The file is generated: Prettier and ESLint ignore it and nobody edits it.
- `createClient<Database>` in `lib/supabase.ts` types every table query and RPC call.
- The `migrations` job regenerates the file after `supabase db reset` and fails with a diff when it differs from the committed one. The job also runs when the file changes.
- Hand-written row types for joined selects stay for now; they can be replaced one by one with types derived from `Database`.

### Consequences

- Good: a query on a missing column or an RPC with wrong arguments fails the type check.
- Good: the diff of the generated file shows what a migration changed in the schema.
- Bad: every migration that changes the schema needs `pnpm db:types` and a second file in the pull request.
- Bad: the generator output depends on the Supabase CLI version, so a CLI upgrade may rewrite the file. The output is formatted with Prettier without the repo config, so that the check does not depend on the CLI's own formatting.
