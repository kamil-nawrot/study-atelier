# 0344. Give Claude a read-only login to the production database

- Status: rejected
- Date: 2026-11-24

## Context and problem statement

Claude checks how the app behaves on the owner's real data before a design and when a bug is reported ([working agreement](../guidelines/working-agreement.md#decisions)). Claude writes a read-only query, the owner runs it in the Supabase SQL Editor as their own account and pastes the result back. A question that needs several queries takes several round trips; on 2026-11-23 the review counter after a finished day needed two ([ATL-851](https://linear.app/kamil-nawrot/issue/ATL-851/decide-on-read-only-access-for-claude-to-the-production-database)).

Should Claude get its own access to the production database?

## Decision drivers

- Claude reads the data and runs the app's functions as the owner's account, so the results match what the app shows.
- A write to production must be impossible, not only unlikely.
- No secret reaches the repository or the conversation, and no token with rights over the whole Supabase account.

## Considered options

- Keep the SQL Editor round trips.
- A login role that can become `authenticated`, with read-only transactions by default, used by `psql` from the owner's machine.
- A login role with only `select` on the tables, bypassing RLS and filtering by the owner's account id in every query.
- The Supabase MCP server in read-only mode.
- A login as `postgres`.

## Decision outcome

Chosen by the owner on 2026-11-24: keep the SQL Editor round trips. Claude does not get its own access to the production database.

The proposed option, a role that becomes `authenticated`, was rejected because its read-only mode is only a default of the session (`default_transaction_read_only`): any session can turn it off with `set transaction read write` and then write the owner's data as the app does. A rule in the guard hook against that would be a workaround, not a permission.

The other options were rejected too:

- **`select` only, bypassing RLS**: a real limit, but the app's functions such as `review_round` rely on RLS and would not compute as in the app, so their behaviour would still need the SQL Editor; Supabase may also not let `postgres` grant `bypassrls`.
- **Supabase MCP in read-only mode**: needs a personal access token, which carries the rights of the whole Supabase account.
- **`postgres`**: full write rights and RLS bypassed.

### Consequences

- Good: no new credential to production exists.
- Bad: a question about production data still costs a round trip to the owner per query.

## More information

To keep the round trips few, Claude writes one query that answers the whole question, returning a single `jsonb_build_object` with every number needed, and includes a check that the query ran as the owner (their `profiles` row is visible).
