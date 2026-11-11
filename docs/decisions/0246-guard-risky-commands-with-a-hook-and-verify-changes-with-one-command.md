# 0246. Guard risky commands with a hook and verify changes with one command

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

Several rules for working in the repository lived only as notes that Claude had to remember in every session: stage files by path, never force-push or rebase, never reset the owner's local Supabase, no `Claude-Session` trailer, no `jq` on the host, run checks one at a time with two Vitest workers, run the dependency check on Node 22 and judge a check by its exit code. Each missed note led to a real mistake: the owner's untracked `supabase/snippets/` in a pull request, a lint that looked clean because its output was grepped, a full test run that froze WSL. How can these rules hold without relying on memory?

## Decision drivers

- A mistake that cannot be undone (lost local data, a rewritten pushed branch) is stopped before it happens.
- One command gives the same answer every time it is run, on the owner's WSL machine without freezing it.
- The checks stay the same as CI's, so a local pass predicts a green "Web app" job.

## Considered options

- **Keep the notes** in the project memory and the guidelines.
- **A Claude Code hook and a verify script:** a `PreToolUse` hook refuses the risky commands, and `pnpm verify` runs the checks of the changed files.
- **Git hooks** (pre-commit, pre-push) for the checks.

## Decision outcome

Chosen option: "A Claude Code hook and a verify script", because it stops the risky commands before they run and makes the checks one step, while Git hooks would slow down every commit of the owner too and cannot stop a database reset.

- [`.claude/hooks/guard-bash.mjs`](../../.claude/hooks/guard-bash.mjs) runs before every Bash command of a Claude session and refuses: staging a folder, everything or a pattern (`git add .`, `-A`, `<dir>`, a glob); a force push, a rebase and a pull with rebase; `supabase db reset` and `pnpm db:reset`; a `Claude-Session` trailer in a `git` or `gh` command; piping into `jq`. Quoted text and heredoc bodies do not count, so a commit message may mention them. Its tests run in the Conventions job of the `Pull request` workflow.
- `pnpm verify` ([`tools/verify/verify.mjs`](../../tools/verify/verify.mjs)) runs the checks of the files changed since the branch left `develop`, untracked ones included, one after another: Prettier on the changed files; ESLint and Stylelint on the changed files of each package; the size limits, the dependency check and the type check of each changed package; the specs in the folders of the changed files with two Vitest workers; the workflow script and hook tests, the docs check and the migration order when their files changed; the branch name and the commit subjects. It runs every step on the Node of `.nvmrc` from `~/.nvm`, keeps each log in `tmp/verify/`, and ends with a pass or fail per step and the tail of each failed log. `--related` runs every spec Vitest finds related instead, `--all` runs the whole lint, type check and test suite of both packages, and `--base <ref>` compares with another ref.

### Consequences

- Good: the notes on staging, force pushes, database resets, the trailer, `jq`, Node 22 and exit codes no longer depend on memory.
- Good: a change is checked in one command of a few minutes instead of several separate runs.
- Bad: the specs beside the changed files miss a test elsewhere that a change breaks; CI still runs the whole suite, and `--related` covers it locally when needed.
- Bad: the hook reads shell commands with a simple tokenizer, so an unusual form of a refused command can slip through, and a legitimate command can be refused; the owner can still run any command by hand.

## More information

Issue: [ATL-627](https://linear.app/kamil-nawrot/issue/ATL-627). `pnpm verify` is described in [git-workflow.md](../guidelines/git-workflow.md#before-pushing).
