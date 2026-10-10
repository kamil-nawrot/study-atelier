---
name: study-atelier-pr-create
description: Create or update a study-atelier pull request with the standard title format (type(scope): ATL-n - description) and the fixed, concise description sections.
---

# study-atelier PR creation

Use this whenever you open a pull request in study-atelier or rewrite the title or description of an existing one. Read [`docs/guidelines/git-workflow.md`](../../../docs/guidelines/git-workflow.md) first: it holds the current rules (branches, target branch, commits). This skill covers the title and description.

## Title

```
<type>(<scope>): ATL-<n> - <short description>
```

- `type`: a Conventional Commits type from the git workflow guideline (`feat`, `fix`, `docs`, `chore`, `ci`, ...), matching the main purpose of the change.
- `scope`: the area the change touches, following the monorepo layout (for example `web`, `design`, `docs`, `ci`, `claude`). Always present.
- `ATL-<n>`: the Linear issue the pull request closes. One issue per pull request.
- Description: imperative, lowercase, no trailing period, about 60 characters at most.

Examples:

- `feat(web): ATL-12 - add artwork list view`
- `docs(decisions): ATL-7 - record image source choice`
- `chore(claude): ATL-6 - add pr creation skill`

## Description

Use exactly these sections, in this order, as in [`.github/pull_request_template.md`](../../../.github/pull_request_template.md):

```markdown
## Context

## Changes

## Review focus

## Decisions
```

- **Context**: why the change exists, in 1-3 sentences, with the Linear issue linked. No restating of the title.
- **Changes**: one bullet per meaningful change, grouped by area when it helps. Name the docs and ADRs added or updated. No file-by-file listing of what the diff already shows.
- **Review focus**: what the owner should look at closely: risky parts, trade-offs, assumptions, open questions, anything not verified. Write `Nothing special.` when there is nothing.
- **Decisions**: decisions made during the work and the reason for each, in one line, linking the ADR if one was written. A decision the owner has not confirmed is marked as a proposal. Write `None.` when there are none.

## Style

- English only, concise, no filler. Every sentence must tell the reviewer something the diff does not.
- No greetings, summaries of the summary, praise of the change, or test-plan boilerplate.
- Bullets over paragraphs; short sentences; code identifiers in backticks.
- No personal data: refer to people by role ("the owner").

## No attribution

Add no tool attribution to the title, description or commits: no "Requested by" line, no "Generated with Claude Code" footer, no `Co-Authored-By` or `Claude-Session` trailers (see the git workflow guideline).

## After creating

- Target `develop` (or `main` for releases and hotfixes); branch name per the git workflow guideline.
- Move the Linear issue to "In Review" and link the pull request to it.
- When the title, description or scope stops matching the change, update them in the same style.
