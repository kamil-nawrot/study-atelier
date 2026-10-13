# Git workflow

## Branches (gitflow)

| Branch | Purpose | Created from | Merged into |
| --- | --- | --- | --- |
| `main` | Released, production state | | |
| `develop` | Integration branch for the next release | `main` | `main` (via release) |
| `feature/<issue>-<slug>` | One Linear issue that adds or changes behaviour, docs or tooling | `develop` | `develop` |
| `bugfix/<issue>-<slug>` | One Linear issue with the `Bug` label that is not urgent for production | `develop` | `develop` |
| `release/<version>` | Release preparation | `develop` | `main` and `develop` |
| `hotfix/<version>` | Urgent production fix | `main` | `main` and `develop` |
| `design/tokens` | Design tokens synced by the Tokens Studio Figma plugin ([details](design-tokens.md)) | `develop` | `develop` |

- `develop` is the repository's default branch, so new pull requests target it and scheduled workflows run from it.
- Branch names are lowercase and include the Linear issue key, for example `feature/atl-1-docs-foundation` or `bugfix/atl-103-artwork-form-save-and-leave`.
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
- Scopes follow the monorepo layout, for example `web`, `design`, `db`, `docs`, `ci`.
- The description is imperative, lowercase, without a trailing period.
- Breaking changes are marked with `!` after the type or a `BREAKING CHANGE:` footer.
- Reference the Linear issue in the footer, for example `Refs: ATL-1`.

## Pull requests

- One pull request per Linear issue, targeting `develop` (or `main` for releases and hotfixes).
- The title has the form `<type>(<scope>): ATL-<n> - <short description>`, for example `feat(web): ATL-12 - add artwork list view`.
- The description follows [`.github/pull_request_template.md`](../../.github/pull_request_template.md): Context, Changes, Review focus, Decisions. It is short and lists any docs or ADRs updated.
- Pull requests and commits carry no tool attribution: no "Requested by" line, no "Generated with Claude Code" footer, no `Co-Authored-By` or `Claude-Session` trailers.
- Claude creates pull requests with the [`study-atelier-pr-create`](../../.claude/skills/study-atelier-pr-create/SKILL.md) skill.
- Before asking the owner for review, Claude reviews the pull request with the [`study-atelier-pr-review`](../../.claude/skills/study-atelier-pr-review/SKILL.md) skill and fixes blocking findings.
- The owner reviews and merges. Claude keeps the pull request green and answers review comments.
- After a pull request is merged, further work goes on a new branch from `develop` and into a new pull request. Nobody pushes to the branch of a merged pull request; check that the pull request is still open before pushing to it.

## Releases

1. Cut `release/<version>` from `develop`, for example `release/0.1.0`. From then on the branch takes only release fixes; new features keep going to `develop`.
2. On the release branch, set the same `version` in the root, `apps/web` and `packages/ui` `package.json` files and move the changelog entries to a new section in [`CHANGELOG.md`](../../CHANGELOG.md), user-facing changes first.
3. Open a pull request from the release branch to `main`. CI must pass. The owner merges it with a **merge commit**, not a squash, so `main` and `develop` keep a shared history and later releases do not conflict.
4. Pushing to `main` deploys production and applies the migrations to the production database. Check the `Web app` and `Database migrations` jobs of that run.
5. Tag the merge commit `v<version>` and publish a GitHub Release with the changelog section as its notes.
6. Smoke-test production: the start page and the sign-in page load, then the owner checks the signed-in flows.
7. Merge `main` back into `develop` with a pull request (merge commit), so the version and changelog are on `develop` too.

Migrations are applied to the development database from `develop` and to the production database from `main`, so a migration only has to work with the code of its own release. The two databases are separate instances; a migration is tried on the development database and on the local stack before it reaches production.

## Hotfixes

1. Cut `hotfix/<version>` from `main`, for example `hotfix/0.1.1`, fix the problem and bump the patch version and the changelog.
2. Open a pull request to `main` and merge it with a merge commit, then tag and release as above.
3. Merge `main` back into `develop` with a pull request.

## Before pushing

Run the same checks as CI from the repository root and push only when they pass:

```sh
pnpm lint && pnpm check && pnpm test && pnpm build
```
