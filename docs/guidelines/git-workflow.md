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
| `chore/merge-main-after-release-<version>` | Brings a release or hotfix back into `develop` | `main` | `develop` |
| `design/tokens` | Design tokens synced by the Tokens Studio Figma plugin ([details](design-tokens.md)) | `develop` | `develop` |

- `develop` is the repository's default branch, so new pull requests target it and scheduled workflows run from it.
- Branch names are lowercase. `feature/*` and `bugfix/*` branches include the Linear issue key, for example `feature/atl-1-docs-foundation` or `bugfix/atl-103-artwork-form-save-and-leave`.
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
- Reference the Linear issue in the footer, for example `Refs: ATL-1`. Name only the pull request's own issue: Linear moves every issue a commit references, so naming another one marks it as started.

## Pull requests

- One pull request per Linear issue, targeting `develop` (or `main` for releases and hotfixes).
- The title has the form `<type>(<scope>): ATL-<n> - <short description>`, for example `feat(web): ATL-12 - add artwork list view`.
- Release pull requests have no Linear issue. The release is titled `chore(repo): release <version>` and the merge back `chore(repo): merge main into develop after release <version>`.
- The description follows [`.github/pull_request_template.md`](../../.github/pull_request_template.md): Context, Changes, Review focus, Decisions. It is short and lists any docs or ADRs updated.
- Claude creates pull requests with the [`study-atelier-pr-create`](../../.claude/skills/study-atelier-pr-create/SKILL.md) skill.
- Screenshots of a change (desktop and phone, from `pnpm screenshot`, see [cloud-sessions.md](cloud-sessions.md)) are attached to the Linear issue, not to the pull request; the pull request description says they are there. Screenshots taken after review changes are added with a title that says so.
- Before asking the owner for review, Claude reviews the pull request with the [`study-atelier-pr-review`](../../.claude/skills/study-atelier-pr-review/SKILL.md) skill and fixes blocking findings.
- The owner reviews and merges. Claude keeps the pull request green and answers review comments.
- A pull request with a conflict against `develop` gets no CI run at all. Claude merges `develop` into the branch (a merge, never a rebase or a force push), resolves the conflicts, runs lint, the type check and the tests of the touched files, and pushes; then checks that CI ran.
- After a pull request is merged, further work goes on a new branch from `develop` and into a new pull request. Nobody pushes to the branch of a merged pull request; check that the pull request is still open before pushing to it.

## Releases

1. Check the Linear milestone of the version: every issue is Done or canceled. An open issue is the owner's call, either wait for it or move it to the next milestone; it is never left in the released milestone. Before cutting the branch, Claude reviews the code of the whole version (the diff from the previous tag to `develop`) for bugs and inefficient solutions, one reviewer per area of the code, and checks every finding in the code; the bugs go into one `Bug` issue of the milestone and are fixed first, and larger improvements get their own issue once the owner agrees. Then cut `release/<version>` from `develop`, for example `release/0.1.0`. From then on the branch takes only release fixes; new features keep going to `develop`.
2. On the release branch, set the same `version` in the root, `apps/web` and `packages/ui` `package.json` files and move the changelog entries to a new section in [`CHANGELOG.md`](../../CHANGELOG.md), user-facing changes first, with a link to the release at the end of the file. A commit that changes only these files relies on CI instead of the local checks in [Before pushing](#before-pushing).
3. Open a pull request from the release branch to `main`. CI must pass. The owner merges it with a **merge commit**, not a squash, so `main` and `develop` keep a shared history and later releases do not conflict.
4. Pushing to `main` deploys production and applies the migrations to the production database. Check the `Web app` and `Database migrations` jobs of that run.
5. Once both jobs pass, tag the merge commit `v<version>` with a lightweight tag and publish a GitHub Release titled `v<version>`. Its notes are the changelog section without its heading; a release without migrations ends with `No migrations.`
6. Smoke-test production: the start page and the sign-in page load, then the owner checks the signed-in flows.
7. Merge `main` back into `develop` with a pull request from `chore/merge-main-after-release-<version>` (merge commit), so the version and changelog are on `develop` too.
8. Update the description of the Linear milestone: the release date, the tag and what the release brought, so it matches what shipped rather than what was planned.

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
