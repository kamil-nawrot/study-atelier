# 0344. Give Claude a read-only login to the production database

- Status: proposed
- Date: 2026-11-23

## Context and problem statement

Claude checks how the app behaves on the owner's real data before a design and when a bug is reported ([working agreement](../guidelines/working-agreement.md#decisions)). Today Claude writes a read-only query, the owner runs it in the Supabase SQL Editor as their own account and pastes the result back. A question that needs several queries takes several round trips; on 2026-11-23 the review counter after a finished day needed one ([ATL-851](https://linear.app/kamil-nawrot/issue/ATL-851/decide-on-read-only-access-for-claude-to-the-production-database)).

Should Claude get its own access to the production database, and of what kind?

## Decision drivers

- Claude can read the data and run the app's functions as the owner's account, so the results match what the app shows.
- An accidental write to production is not possible through the normal path.
- No secret reaches the repository or the conversation, and access ends with one statement.
- No paid service and no token with rights over the whole Supabase account.

## Considered options

- Keep the SQL Editor round trips.
- A login role that can only become `authenticated`, with read-only transactions by default, used by `psql` from the owner's machine.
- The Supabase MCP server in read-only mode.
- A login as `postgres`.

## Decision outcome

Proposed: "a login role that can only become `authenticated`", because it reads exactly what the owner's account reads through RLS, cannot write without deliberately switching the guard off, and needs only a password kept on the owner's machine.

1. **The role.** `claude_readonly` logs in with a password, has no privileges of its own on the tables and is a member of `authenticated` without inheriting its privileges. Every query runs in a transaction that sets the owner's account id as the JWT claims and switches to `authenticated`, as in the SQL Editor script, so RLS and the app's functions behave as in the app.
2. **Read-only.** The role's transactions are read-only by default (`default_transaction_read_only`), and its statements stop after 60 seconds so a slow query does not load the Free plan database. A function that writes fails instead of writing.
3. **Only the owner's account.** Claude sets the claims only to the owner's account id. The role could read another learner's data by naming their id; that is a rule Claude follows, not a limit of the database.
4. **The connection.** `psql` through the session pooler of Supabase (port 5432), since the direct host has only IPv6. The password is in `~/.pgpass` on the owner's machine and never in the repository, the environment of CI or the conversation.
5. **Not in a cloud session.** A cloud session has no access; the role is used only in local sessions on the owner's machine.
6. **Revoking.** `drop role claude_readonly;` ends the access; changing its password pauses it.

### Consequences

- Good: Claude answers a question about production data in one session without round trips.
- Good: a write needs a deliberate `set transaction read write` or a change of the setting; the normal path cannot write.
- Bad: the read-only setting is a guard, not a permission: inside a transaction as `authenticated` a write is allowed if the setting is switched off, exactly as the app itself may write.
- Bad: the role can read any account by its id; the limit to the owner's account is Claude's rule.
- Bad: one more credential to production exists, on the owner's machine.

## More information

Rejected options:

- **SQL Editor round trips**: safe, but slow for questions that need several queries.
- **Supabase MCP in read-only mode**: needs a personal access token, which carries the rights of the whole Supabase account (projects, settings, keys), not only reads of one database.
- **`postgres`**: full write rights and RLS bypassed.

### Setting up

1. Supabase production, SQL Editor, with a new strong password in place of `<password>`:

   ```sql
   create role claude_readonly with login noinherit password '<password>';
   grant authenticated to claude_readonly;
   alter role claude_readonly set default_transaction_read_only = on;
   alter role claude_readonly set statement_timeout = '60s';
   alter role claude_readonly set idle_in_transaction_session_timeout = '60s';
   ```

   Check that the grant took effect: `select pg_has_role('claude_readonly', 'authenticated', 'member');` returns `true`.

2. On the owner's machine (WSL): `sudo apt install postgresql-client`, then a line in `~/.pgpass` with mode 600 (`chmod 600 ~/.pgpass`):

   ```text
   <pooler host>:5432:postgres:claude_readonly.<project ref>:<password>
   ```

   The pooler host and the project ref are in Supabase, Connect, Session pooler.

3. The account id of the owner (`select id from auth.users where email = …` in the SQL Editor) goes to Claude's project memory, not the repository.

4. Claude checks the access:

   ```sh
   psql "host=<pooler host> port=5432 dbname=postgres user=claude_readonly.<project ref> sslmode=require" -c "show default_transaction_read_only"
   ```

   It shows `on`, and a query run as the owner returns their `profiles` row.

A query then runs as:

```sql
begin;
select set_config('request.jwt.claims', '{"sub": "<account id>", "role": "authenticated"}', true);
set local role authenticated;
select …;
rollback;
```

### Revoking

```sql
drop role claude_readonly;
```

and delete the line from `~/.pgpass`.
