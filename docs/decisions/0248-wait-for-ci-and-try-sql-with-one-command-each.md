# 0248. Wait for CI and try SQL with one command each

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

Two steps Claude repeated by hand kept going wrong. Waiting for CI ended too early on the checks of an earlier commit or on skipped jobs, waited for a run that never started because the pull request conflicted with `develop`, and hung on a pipe into `jq`, which the host does not have. Trying SQL on the local Supabase, which holds the owner's own data, meant joining migrations and test files into one transaction by hand; once a missed `rollback;` closed it early, and test users, Storage rows and schemas stayed in the owner's database. The release skill, which uses both steps, lived in the owner's home folder, outside version control. How can these steps be done the same way every time?

## Decision drivers

- A wait ends only on a result that belongs to the pushed commit.
- Nothing Claude tries on the local database can stay there.
- The release steps are versioned with the guidelines they follow.

## Considered options

- **Keep the steps in notes** and the skill in the home folder.
- **One command for each step** in `tools/`, and the release skill in the repository.

## Decision outcome

Chosen option: "One command for each step", because a script repeats the step exactly and its rules are tested.

- `pnpm wait-ci <n>` ([`tools/wait-ci/wait-ci.mjs`](../../tools/wait-ci/wait-ci.mjs)) waits for the named jobs of the pull request's head commit, chosen from the changed files, and stops on a conflict; the rules are in [git-workflow.md](../guidelines/git-workflow.md#pull-requests).
- `pnpm db:try` ([`tools/db-try/db-try.mjs`](../../tools/db-try/db-try.mjs)) runs migrations, SQL tests and any SQL in one transaction that is rolled back, refuses SQL that would end it early before anything runs, and reports leftovers; the rules are in [code-conventions.md](../guidelines/code-conventions.md#database).
- The `study-atelier-release` skill moves to [`.claude/skills/`](../../.claude/skills/study-atelier-release/SKILL.md) and uses `pnpm worktree` ([ADR-0247](0247-work-in-a-worktree-per-session.md)) and `pnpm wait-ci`.
- The tests of `tools/` run in the Conventions job with the workflow script tests, and in `pnpm verify` when a tool changes.

### Consequences

- Good: the result of a wait belongs to the pushed commit, and a conflict shows at once instead of after the timeout.
- Good: a forgotten `begin` or `rollback` can no longer change the owner's data, and all SQL tests run locally in one command.
- Bad: `db:try` finds transaction statements with regular expressions after removing function bodies, strings and comments, so an unusual form could slip through; the leftover check after the run is the safety net.

## More information

Issue: [ATL-630](https://linear.app/kamil-nawrot/issue/ATL-630).
