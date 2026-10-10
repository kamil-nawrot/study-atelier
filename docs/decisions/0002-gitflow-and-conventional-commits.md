# 0002. Use gitflow, Conventional Commits and owner-approved pull requests

- Status: accepted
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

Claude works autonomously, but Kamil must stay in control of what lands in the codebase. A branching model and commit convention are needed.

## Considered options

- Gitflow (`main`, `develop`, `feature/*`, `release/*`, `hotfix/*`)
- Trunk-based development with short-lived branches

## Decision outcome

Chosen option: gitflow, because Kamil prefers it and it gives a clear separation between released and in-progress work.

- Commit messages follow Conventional Commits 1.0.
- All changes reach `develop` and `main` through pull requests that Kamil approves.

Details: [git workflow](../guidelines/git-workflow.md).

### Consequences

- Good: every change is reviewed; history is readable and suitable for generating changelogs.
- Bad: more ceremony than trunk-based development for a one-person project; accepted as part of learning good practice.
