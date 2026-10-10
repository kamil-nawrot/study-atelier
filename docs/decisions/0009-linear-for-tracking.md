# 0009. Track work in Linear

- Status: accepted
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

Kamil needs a simple way to follow Claude's progress and to collect ideas without adding them to the current scope.

## Decision outcome

Work is tracked in the Linear project "study-atelier" in Kamil's team (key `WX`). Each piece of work is an issue; ideas use the `idea` label. Branches and pull requests reference the issue key.

### Consequences

- Good: one board for progress and ideas; Linear links pull requests to issues automatically.
- Bad: none significant for a one-person project.
