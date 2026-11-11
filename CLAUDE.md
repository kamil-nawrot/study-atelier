# CLAUDE.md

study-atelier is an app for learning art history in which the learner builds a personal database of artworks as part of studying.

Before doing any work in this repository, read and follow:

- [docs/guidelines/working-agreement.md](docs/guidelines/working-agreement.md): who decides what, and how work flows
- [docs/guidelines/git-workflow.md](docs/guidelines/git-workflow.md): branches, commits, pull requests
- [docs/guidelines/documentation.md](docs/guidelines/documentation.md): how and when to update `docs/`
- [docs/guidelines/design-tokens.md](docs/guidelines/design-tokens.md): design tokens and the Figma sync
- [docs/guidelines/code-conventions.md](docs/guidelines/code-conventions.md): conventions for writing code
- [docs/guidelines/ui-patterns.md](docs/guidelines/ui-patterns.md): how views and components look and behave
- [docs/guidelines/cloud-sessions.md](docs/guidelines/cloud-sessions.md): the cloud session start hook and `pnpm screenshot`

Key rules in short:

- The project owner makes every decision. Propose options with a recommendation; record the outcome as an ADR in `docs/decisions/`.
- Gitflow: work on `feature/*` branches (or `bugfix/*` for bugs) cut from `develop`; open PRs into `develop`; Claude squash-merges its own at green CI, the owner merges the rest ([working agreement](docs/guidelines/working-agreement.md#working-in-a-loop)).
- A pushed branch is never rebased or force-pushed; a conflict with `develop` is resolved by merging `develop` into the branch.
- Commit messages follow Conventional Commits.
- A local session works in its own worktree from `pnpm worktree <branch>`, never in the main checkout ([ADR-0247](docs/decisions/0247-work-in-a-worktree-per-session.md)).
- Before pushing, run `pnpm verify`; a hook refuses risky commands such as `git add .`, a force push or a database reset ([ADR-0246](docs/decisions/0246-guard-risky-commands-with-a-hook-and-verify-changes-with-one-command.md)).
- No comments in code unless the owner explicitly asks for them.
- `apps/web/src/lib` is organised in feature modules over `shared` and `catalogue`, with size limits per file and only `*-data.ts` files calling Supabase ([ADR-0126](docs/decisions/0126-organise-the-web-app-in-feature-modules-with-enforced-limits.md)).
- Everything in this repository (code, comments, docs) is written in English. Conversation with the owner is in Polish.
- Find the decisions on a topic with `pnpm adr <area>` (areas in [docs/decisions/README.md](docs/decisions/README.md)); `pnpm adr:index` keeps the index in sync with the ADRs.
- Track work in the Linear project "study-atelier" (team "Study Atelier", key `ATL`) and reference the issue key in branch names and PRs.
- In a cloud session the start hook has already prepared the environment (dependencies, Supabase variables, Chromium for Vitest), and screenshots come from `pnpm screenshot` (see [docs/guidelines/cloud-sessions.md](docs/guidelines/cloud-sessions.md)). Do not set this up by hand or write your own screenshot script; extend the existing one when it lacks something.
