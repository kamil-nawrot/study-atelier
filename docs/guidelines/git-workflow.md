# Git workflow

## Branches (gitflow)

| Branch | Purpose | Created from | Merged into |
| --- | --- | --- | --- |
| `main` | Released, production state | | |
| `develop` | Integration branch for the next release | `main` | `main` (via release) |
| `feature/<issue>-<slug>` | One Linear issue | `develop` | `develop` |
| `release/<version>` | Release preparation | `develop` | `main` and `develop` |
| `hotfix/<version>` | Urgent production fix | `main` | `main` and `develop` |
| `design/tokens` | Design tokens synced by the Tokens Studio Figma plugin ([details](design-tokens.md)) | `develop` | `develop` |

- Branch names are lowercase and include the Linear issue key, for example `feature/atl-1-docs-foundation`.
- Nobody pushes directly to `main` or `develop`. The only exception was the initial commit of the empty repository.

## Commits

Commit messages follow [Conventional Commits 1.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<optional scope>): <description>

<optional body>

<optional footer(s)>
```

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Scopes follow the monorepo layout once it exists, for example `web`, `api`, `docs`.
- The description is imperative, lowercase, without a trailing period.
- Breaking changes are marked with `!` after the type or a `BREAKING CHANGE:` footer.
- Reference the Linear issue in the footer, for example `Refs: ATL-1`.

## Pull requests

- One pull request per Linear issue, targeting `develop` (or `main` for releases and hotfixes).
- The title follows Conventional Commits and ends with the issue key, for example `docs: set up documentation structure (ATL-1)`.
- The description explains what changed and why, and lists any docs or ADRs updated.
- Kamil reviews and merges. Claude keeps the pull request green and answers review comments.
