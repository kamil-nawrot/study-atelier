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
- Gitflow: work on `feature/*` branches (or `bugfix/*` for bugs) cut from `develop`; open PRs into `develop`; the owner approves and merges.
- Commit messages follow Conventional Commits.
- No comments in code unless the owner explicitly asks for them.
- Everything in this repository (code, comments, docs) is written in English. Conversation with the owner is in Polish.
- Track work in the Linear project "study-atelier" (team "Study Atelier", key `ATL`) and reference the issue key in branch names and PRs.
- In a cloud session the start hook has already prepared the environment (dependencies, Supabase variables, Chromium for Vitest), and screenshots come from `pnpm screenshot` (see [docs/guidelines/cloud-sessions.md](docs/guidelines/cloud-sessions.md)). Do not set this up by hand or write your own screenshot script; extend the existing one when it lacks something.
