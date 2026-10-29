---
name: study-atelier-session-retro
description: At the end of a study-atelier session, find what the conversation and its pull request taught that is worth keeping, and record it in docs, guidelines or project memory after the owner confirms.
---

# study-atelier session retrospective

Use this when the session's pull request is opened, before asking the owner for review, so that confirmed findings ride in the same pull request even if the owner merges as soon as CI passes; run a short second round for the findings of the owner's review while the pull request is still open. In a session without a pull request, use it before its thread is resolved. Also use it whenever the owner asks for a retrospective. The goal is that a fresh session never has to ask the owner again what this one already learned.

Read [`docs/guidelines/documentation.md`](../../../docs/guidelines/documentation.md) first: its "Where things go" table decides where each finding belongs.

## 1. Gather the sources

- **The conversation**: every message from the owner in this session, including answers to questions, corrections, approvals and rejections.
- **The pull request** tied to the session, if there is one (from the branch name, the Linear issue, or the thread): its description, every review comment and review from the owner or review bots, and the commits pushed after the first review. Read them with GitHub MCP `pull_request_read` (methods `get`, `get_review_comments`, `get_reviews`, `get_comments`) and `list_commits`.
- **The Linear issue**, for comments with decisions that did not happen in the conversation.

## 2. Find candidates

Look for things that will still be true in later sessions:

- **Decisions**: a choice between options, a scope change, a requirement added, dropped or moved to a later version, a value picked (a token, a limit, a name).
- **Working rules**: how the owner wants Claude to work, what to ask about, what to stop doing, a format or tone for replies or documents.
- **Coding standards from the pull request**: every review comment and every follow-up commit that fixed a pattern rather than a one-off bug. Generalise each into a rule a contributor could follow in other files ("navigation is always a link, never a button with `goto`"), not a note about this diff.
- **Facts about the project**: external resources, URLs, settings changed outside the repository, credentials rotated, things the owner did by hand.
- **Repeated friction**: anything the owner had to explain or correct twice.

Skip what is already recorded, what only mattered for this session, what the code or git history already shows, and anything the owner did not confirm. A proposal the owner did not settle may be listed as an open question, never recorded as a decision.

## 3. Check against what exists

For each candidate, read the current text of the place it would go, from the `develop` branch and from the session's branch:

- `CLAUDE.md`, `docs/guidelines/`, `docs/decisions/` (the index and every ADR on the topic), `docs/product/`, `docs/architecture/`.
- The project memory, through the memory tools or memory directory the session provides.
- The repo skills in `.claude/skills/` and `.github/pull_request_template.md`.

Then classify it:

- **New**: nothing covers it.
- **Extends**: an existing rule or entry covers part of it; propose the smallest edit.
- **Contradicts**: it changes something recorded. A change to an accepted ADR needs a new ADR that supersedes it; a guideline or memory entry is updated in place, and the old wording is removed.
- **Already recorded**: drop it.

## 4. Pick the destination

| Finding                                                                                          | Destination                                                                                                              |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| A decision and its reason                                                                        | a new ADR in `docs/decisions/` from the template, added to the index; check open pull requests for numbers already taken |
| What the app should do                                                                           | `docs/product/requirements.md` (a new R-n with its version; never renumber)                                              |
| A domain term                                                                                    | `docs/product/glossary.md`                                                                                               |
| How the app speaks to the learner                                                                | `docs/product/voice-and-tone.md`                                                                                         |
| A coding standard                                                                                | `docs/guidelines/code-conventions.md`, or `ui-patterns.md` for how views and components look and behave                  |
| A rule for how work flows                                                                        | the matching file in `docs/guidelines/`, or a repo skill when it is a step of a skill                                    |
| A rule a linter or CI could check                                                                | the guideline, plus a Linear issue to enforce it (ask first)                                                             |
| How the owner wants Claude to work, project facts, open threads, anything outside the repository | project memory                                                                                                           |
| An idea for later                                                                                | a Linear issue with the [`study-atelier-idea`](../study-atelier-idea/SKILL.md) skill                                     |

A rule goes into the repository when it applies to the code or docs; memory only holds what the repository cannot. Do not record the same rule in both: memory links to the doc instead.

## 5. Propose to the owner

Send one short message in Polish:

- The findings grouped by destination, one line each: what would be recorded, where, and whether it is new, an extension or a change. Quote the source briefly (the owner's message or the review comment).
- Mark the ones Claude recommends and say why in a few words.
- Ask one question at a time. Start with the finding that changes a recorded decision; findings that are plain facts may be confirmed together.

If nothing is worth recording, say so in one line and stop.

## 6. Apply what the owner confirmed

- **Repository changes**: commit them to the session's pull request, then tell the owner it is ready to merge. Only when there is no open pull request for the session (it was already merged, or the session had none), create a Linear issue for it and open a new pull request from `develop` with the [`study-atelier-pr-create`](../study-atelier-pr-create/SKILL.md) skill, `docs` type, then review it with [`study-atelier-pr-review`](../study-atelier-pr-review/SKILL.md).
- **Memory**: update the existing entry rather than adding a near-duplicate; delete entries the session proved wrong; convert relative dates to absolute ones.
- Everything written to the repository is in English and has no personal data: people are referred to by role ("the owner").
- Report back in one line per destination with links to the pull request, the issue or the memory entry.

## Boundaries

- Never record a decision the owner did not make, and never change an accepted ADR's decision in place.
- Never merge, and never push to `develop` or `main`.
- Do not widen the session's pull request with findings unrelated to it.
