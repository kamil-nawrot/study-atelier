# Git workflow

## Branches (gitflow)

| Branch                                     | Purpose                                                                              | Created from | Merged into          |
| ------------------------------------------ | ------------------------------------------------------------------------------------ | ------------ | -------------------- |
| `main`                                     | Released, production state                                                           |              |                      |
| `develop`                                  | Integration branch for the next release                                              | `main`       | `main` (via release) |
| `feature/<issue>-<slug>`                   | One Linear issue that adds or changes behaviour, docs or tooling                     | `develop`    | `develop`            |
| `bugfix/<issue>-<slug>`                    | One Linear issue with the `Bug` label that is not urgent for production              | `develop`    | `develop`            |
| `release/<version>`                        | Release preparation                                                                  | `develop`    | `main` and `develop` |
| `hotfix/<version>`                         | Urgent production fix                                                                | `main`       | `main` and `develop` |
| `chore/merge-main-after-release-<version>` | Brings a release or hotfix back into `develop`                                       | `main`       | `develop`            |
| `design/tokens`                            | Design tokens synced by the Tokens Studio Figma plugin ([details](design-tokens.md)) | `develop`    | `develop`            |

- `develop` is the repository's default branch, so new pull requests target it and scheduled workflows run from it.
- Branch names are lowercase. `feature/*` and `bugfix/*` branches include the Linear issue key, for example `feature/atl-1-docs-foundation` or `bugfix/atl-103-artwork-form-save-and-leave`. The slug after the key has only lowercase letters, digits and hyphens, so a version is written without dots (`bugfix/atl-326-fix-012-review-bugs`, not `0.12`); the Conventions check rejects any other branch name.
- A bug that cannot wait for the next release is a `hotfix/<version>` cut from `main` instead (see [Hotfixes](#hotfixes)).
- Nobody pushes directly to `main` or `develop`. The only exception was the initial commit of the empty repository.

## Commits

Commit messages follow [Conventional Commits 1.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<optional scope>): <description>

<optional body>

<optional footer(s)>
```

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Scopes follow the monorepo layout, for example `web`, `design`, `db`, `docs`, `ci`, and `tools` for `tools/`.
- The description is imperative, lowercase, without a trailing period. A subject that ends in an abbreviation ("Master E.S.") still breaks the rule, so Claude checks every subject against the pattern of `.github/scripts/check-pull-request.mjs` before a push.
- A pushed commit whose subject fails the Conventions check is not reworded, since a pushed branch is never rewritten: its commits go onto a new branch from `develop` (cherry-picked, the failing one with a corrected subject), a new pull request replaces the old one, and the old one is closed with a comment that points to it.
- Breaking changes are marked with `!` after the type or a `BREAKING CHANGE:` footer.
- A commit may reference the Linear issue in the footer, for example `Refs: ATL-1`; it is not required, since the branch name already links the issue. Name only the pull request's own issue: Linear moves every issue a commit references, so naming another one marks it as started.

## Pull requests

- One pull request per Linear issue, targeting `develop` (or `main` for releases and hotfixes).
- The title has the form `<type>(<scope>): ATL-<n> - <short description>`, for example `feat(web): ATL-12 - add artwork list view`.
- Release pull requests have no Linear issue. The release is titled `chore(repo): release <version>` and the merge back `chore(repo): merge main into develop after release <version>`.
- The description follows [`.github/pull_request_template.md`](../../.github/pull_request_template.md): Context, Changes, Review focus, Decisions. It is short and lists any docs or ADRs updated.
- Claude creates pull requests with the [`study-atelier-pr-create`](../../.claude/skills/study-atelier-pr-create/SKILL.md) skill.
- The `Pull request` workflow checks the title, the branch name and every commit of a pull request against these rules (each commit needs a Conventional Commits subject; release, hotfix, merge-back and `design/tokens` branches are exempt from the commit check), with [`.github/scripts/check-pull-request.mjs`](../../.github/scripts/check-pull-request.mjs).
- A migration a pull request adds must be newer than the newest migration on the base branch, because `supabase db push` refuses to insert one before the last migration a database has run ([ADR-0183](../decisions/0183-check-the-order-of-new-migrations-right-before-merging.md)). The Conventions job checks it with [`.github/scripts/check-migration-order.mjs`](../../.github/scripts/check-migration-order.mjs), which fetches the base branch itself. A migration merged into the base branch after that run is not seen, so right before merging a pull request that adds a migration, whoever merges reruns the Conventions job (`gh run rerun <run id> --job <job id>`) or runs `BASE_REF=develop node .github/scripts/check-migration-order.mjs` on the branch, and merges only when it passes. A failing migration gets a later timestamp in its file name. A migration already on `main`, such as a hotfix merged back into `develop`, is left out of the check, because production has already run it under its name.
- Screenshots of a change (desktop and phone, from `pnpm screenshot`, see [cloud-sessions.md](cloud-sessions.md)) are attached to the Linear issue, not to the pull request; the pull request description says they are there. Screenshots taken after review changes are added with a title that says so.
- Before asking the owner for review, Claude reviews the pull request with the [`study-atelier-pr-review`](../../.claude/skills/study-atelier-pr-review/SKILL.md) skill and fixes blocking findings.
- The owner reviews and merges; Claude merges its own `feature/*` and `bugfix/*` pull requests under the standing approval in [working-agreement.md](working-agreement.md#working-in-a-loop). Claude keeps the pull request green and answers review comments.
- A `feature/*` or `bugfix/*` pull request is squash-merged into `develop` (`gh pr merge <n> --squash`, always explicit), so `develop` has one commit per pull request titled `<type>(<scope>): <description> (#n)`. Only release pull requests into `main` and the merge-back into `develop` use a merge commit. A merge commit on `develop` by mistake cannot be undone without rewriting `develop`.
- Claude waits for CI with `pnpm wait-ci <n>` ([ADR-0248](../decisions/0248-wait-for-ci-and-try-sql-with-one-command-each.md)). It waits for the named jobs of the pull request's head commit, "Web app" by default, "Markdown" when only Markdown changed, plus "UI library" when `packages/ui` changed and "Migrations on local Supabase" when `supabase/` changed (`--check <name>` names others), until each passes, is skipped or fails. It keeps waiting while GitHub does not show the local head yet, stops at once on a conflict with the base branch, and exits with 0 when they pass, 1 when one fails and 2 on a conflict, a closed pull request or after `--timeout` minutes (40 by default). A failed "Migrations on local Supabase" job can be the Docker registry's limit or a busy port rather than the code: read its log before looking for a bug, and rerun it after some minutes.
- A pull request with a conflict against `develop` gets no CI run at all. Claude merges `develop` into the branch (a merge, never a rebase or a force push), resolves the conflicts, runs `pnpm verify`, and pushes; then checks that CI ran.
- After a pull request is merged, further work goes on a new branch from `develop` and into a new pull request. Nobody pushes to the branch of a merged pull request; check that the pull request is still open before pushing to it.

## Releases

Claude prepares and finishes a release with the [`study-atelier-release`](../../.claude/skills/study-atelier-release/SKILL.md) skill, which follows the steps below.

1. Check the Linear milestone of the version: every issue is Done or canceled. An open issue is the owner's call, either wait for it or move it to the next milestone; it is never left in the released milestone. Before cutting the branch, Claude reviews the code of the whole version (the diff from the previous tag to `develop`) for bugs and inefficient solutions, one reviewer per area of the code, and checks every finding in the code; the bugs of the app go into one `Bug` issue of the milestone and are fixed first, bugs in the developer tooling (`tools/`, `.claude/hooks/`, the CI scripts) get their own issue and do not hold the release, and larger improvements get their own issue once the owner agrees. When the version brings a new view, the review also checks its design against comparable views on `pnpm screenshot` shots, at desktop and phone width, and its design bugs go into the same issue. Then cut `release/<version>` from `develop`, for example `release/0.1.0`. From then on the branch takes only release fixes; new features keep going to `develop`.
2. On the release branch, set the same `version` in the root, `apps/web` and `packages/ui` `package.json` files and move the changelog entries to a new section in [`CHANGELOG.md`](../../CHANGELOG.md), user-facing changes first, with a link to the release at the end of the file. A commit that changes only these files relies on CI instead of the local checks in [Before pushing](#before-pushing).
3. Open a pull request from the release branch to `main`. CI must pass; a spec known to fail at random (it has an open issue) is rerun once, and the case is added to its issue. The owner merges it with a **merge commit**, not a squash, so `main` and `develop` keep a shared history and later releases do not conflict.
4. Pushing to `main` deploys production and applies the migrations to the production database. Check the `Web app` and `Database migrations` jobs of that run. The `Database migrations` job runs after `Web app` has deployed, so when the new app calls database functions that a migration of the release creates or changes, those calls fail until the migrations finish; the release pull request says so, so the owner merges at a quiet moment. A job that fails for a reason outside the release, such as the runner's network, is rerun; when it keeps failing, its cause is fixed in a hotfix, and the release is tagged together with the hotfix once the hotfix's run passes both jobs (0.21.3 and 0.21.4).
5. Once both jobs pass, tag the merge commit `v<version>` with a lightweight tag and publish a GitHub Release titled `v<version>`. Its notes are the changelog section without its heading; a release without migrations ends with `No migrations.`
6. Smoke-test production: the start page and the sign-in page load, then the owner checks the signed-in flows.
7. Merge `main` back into `develop` with a pull request from `chore/merge-main-after-release-<version>` (merge commit), so the version and changelog are on `develop` too.
8. Update the description of the Linear milestone: the release date, the tag and what the release brought, so it matches what shipped rather than what was planned.

Migrations are applied to the development database from `develop` and to the production database from `main`, so a migration only has to work with the code of its own release. The two databases are separate instances; a migration is tried on the development database and on the local stack before it reaches production.

## Hotfixes

1. Cut `hotfix/<version>` from `main`, for example `hotfix/0.1.1`, fix the problem and bump the patch version and the changelog.
2. Open a pull request to `main` titled `chore(repo): release <version>`, as the Conventions check requires, and merge it with a merge commit, then tag and release as above.
3. Merge `main` back into `develop` with a pull request. A hotfix made while its release is still being finished shares one merge-back with that release.

## Worktrees

A local Claude session works in its own worktree, never in the main checkout ([ADR-0247](../decisions/0247-work-in-a-worktree-per-session.md)):

```sh
pnpm worktree feature/atl-12-artwork-list          # from origin/develop
pnpm worktree hotfix/0.21.4 --from origin/main      # from another ref
pnpm worktree remove feature/atl-12-artwork-list   # after the pull request is merged
```

The first form creates `../study-atelier-atl-12` (named after the issue key, or after the branch when it has none), checks out the branch when it already exists locally or on GitHub, copies `apps/web/.env` from the main checkout and runs `pnpm install` on the Node of `.nvmrc`. `remove` removes the worktree and deletes the local branch once its pull request is merged; a worktree with uncommitted changes is not removed.

## Before pushing

Run `pnpm verify` from the repository root and push only when it passes ([ADR-0246](../decisions/0246-guard-risky-commands-with-a-hook-and-verify-changes-with-one-command.md)). It runs the checks of the files changed since the branch left `develop`, one after another so the machine does not run out of memory: Prettier, ESLint and Stylelint on the changed files, the size limits, the dependency check and the type check of each changed package, the specs in the folders of the changed files with two Vitest workers, the workflow script and hook tests, the docs check and the migration order when their files changed, and the branch name and the commit subjects. Every step runs on the Node of `.nvmrc` from `~/.nvm`, its log goes to `tmp/verify/`, and the command fails when any step fails.

| Option         | Effect                                                                        |
| -------------- | ----------------------------------------------------------------------------- |
| `--related`    | Run every spec Vitest finds related to the changed files                      |
| `--all`        | Run the whole lint, type check and test suite of `apps/web` and `packages/ui` |
| `--base <ref>` | Compare with another ref than the point the branch left `develop`             |

CI runs the whole suite and the build on every pull request, so a test elsewhere that a change breaks shows there.

## Guarded commands

A `PreToolUse` hook, [`.claude/hooks/guard-bash.mjs`](../../.claude/hooks/guard-bash.mjs), refuses these commands in a Claude session before they run: staging a folder, everything or a pattern (`git add .`, `-A`, `<dir>`, a glob), a force push, a rebase, a pull with rebase, `supabase db reset` and `pnpm db:reset`, a `Claude-Session` trailer in a `git` or `gh` command, and piping into `jq`. A refused command is done another way (staging each file by its path, merging `develop`), not rephrased to get past the hook. A new rule gets a test in `guard-bash.test.mjs`.
