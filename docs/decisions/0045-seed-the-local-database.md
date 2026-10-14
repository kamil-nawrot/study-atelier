# 0045. Seed the local database with a test account and artworks

- Status: accepted
- Date: 2026-10-14

## Context and problem statement

[ADR-0036](0036-run-supabase-locally-in-docker.md) decided that the local stack has no seed: test accounts and artworks are made in the running app. Since then the owner resets the local database whenever a branch brings different migrations ([ADR-0037](0037-separate-databases-for-develop-and-production.md) dropped the backward compatibility rule), and each reset costs a new sign-up, a confirmation mail and a collection entered by hand.

## Decision drivers

- A reset must leave the local database ready to use.
- The seed must not reach the hosted databases or the owner's real collection.
- It must keep working as migrations change, so a stale seed fails in CI instead of on the owner's machine.

## Considered options

1. A seed file in `supabase/seed.sql`, run by the Supabase CLI
2. A script that signs up through the app's API and saves artworks through `save_artwork`
3. No seed; dump and restore data around each reset

## Decision outcome

Chosen option: 1, a seed file.

- [`supabase/seed.sql`](../../supabase/seed.sql) is enabled in [`supabase/config.toml`](../../supabase/config.toml). The CLI runs it when the local database is created: on the first `supabase start` and on every `supabase db reset`. It does not run on a later start of an existing database, and `supabase db push` to the hosted projects never runs it.
- It creates one confirmed account, `test@example.com` with the password `password123`, and eight artworks for it: four with a Wikimedia Commons image, three without an image and one in the trash. Authors, period, style, material and location are filled in, with the era, period and style chained as in [ADR-0038](0038-chain-era-period-and-style.md), and a value shared by several artworks. The names are in Polish, like the app.
- The `migrations` CI job runs `supabase db reset`, so it runs the seed against every migration. A migration that breaks the seed fails the pull request, and the seed is updated in the same pull request.
- The seed writes straight into the tables as the database owner, with the account id set explicitly, instead of calling `save_artwork` as the account.

### Consequences

- Good: `pnpm db:reset` returns a working app with data, and the wall, the card index, the trash and the duplicate check have something to show.
- Good: the seed is tested by CI on every change to `supabase/`.
- Bad: the seed has to follow the schema; a new required column or table touched by the app needs an update.
- Bad: the account has a known password, which is acceptable only because the local stack is reachable from the owner's machine only.
- Bad: the Commons file names and Wikidata ids are fixed strings; a renamed or moved file shows a broken image in the seeded artwork.

## More information

Narrows [ADR-0036](0036-run-supabase-locally-in-docker.md), which stays accepted for the rest: its line "There is no seed file" no longer applies.
