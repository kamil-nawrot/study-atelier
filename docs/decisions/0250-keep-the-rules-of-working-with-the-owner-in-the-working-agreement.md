# 0250. Keep the rules of working with the owner in the working agreement

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

Over the sessions the owner set many rules for how Claude works: walk a rule through scenarios before a decision, start a new module with doubt, check facts in the code, propose texts before building, ask before changing an agreed layout, one question per message, a learner's bug first, and a standing approval for Claude to merge its own pull requests at green CI. They lived only in Claude's local memory, which cloud sessions cannot read and which is not versioned. The merge approval also contradicted the working agreement, which still required the owner's approval for every merge. Where do these rules belong?

## Decision drivers

- Every session, local or in the cloud, follows the same rules.
- The repository does not contradict a decision the owner made.
- Memory keeps only what the repository cannot hold.

## Considered options

- **Keep the rules in memory.**
- **Move them into the guidelines**, and keep in memory only facts about the owner's machine and tools.

## Decision outcome

Chosen option: "Move them into the guidelines", because rules that only one machine's memory holds are not followed everywhere and cannot be reviewed.

- [working-agreement.md](../guidelines/working-agreement.md) gets the sections "Working with the owner" and "Working in a loop", and its list of actions that need the owner's approval names the merges the owner keeps: release, hotfix and merge-back pull requests and pull requests that are not Claude's own.
- [git-workflow.md](../guidelines/git-workflow.md) says that feature and bugfix pull requests are squash-merged, and [code-conventions.md](../guidelines/code-conventions.md) that `double precision` columns are never filtered by equality.
- The session retro skill sends a rule about how the owner wants Claude to work to the guidelines, and memory keeps facts about the owner's machine and tools, open threads and anything outside the repository.

### Consequences

- Good: a cloud session works by the same rules, and a change to them is reviewed in a pull request.
- Bad: the working agreement grows; its rules stay short and link to the guideline that holds the detail.

## More information

Issue: [ATL-633](https://linear.app/kamil-nawrot/issue/ATL-633).
