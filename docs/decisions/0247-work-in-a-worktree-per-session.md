# 0247. Work in a worktree per session

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

A local Claude session worked in the main checkout, and moved to a worktree only when it saw another session already there. Telling that has failed: the changes of two issues ended up mixed in one working tree. A new worktree also needed two steps that were forgotten before: a copy of `apps/web/.env` (without it a release screenshot showed a 500 error) and `pnpm install` on the Node of `.nvmrc`. Two sessions taking screenshots at once also fought over port 5199, and the second one could capture the first one's server. Where does a session work, and how does it get there?

## Decision drivers

- No session has to judge whether another one is in the same folder.
- The owner's main checkout, open in the owner's editor, holds only the owner's work.
- Setting up a worktree is one step that cannot be half done.

## Considered options

- **Keep the rule:** the main checkout, unless another session is there.
- **A worktree per session:** every local session works in its own worktree, created with one command.

## Decision outcome

Chosen option: "A worktree per session", because it removes the judgement that failed and leaves the main checkout to the owner.

- A local Claude session never edits files or switches branches in the main checkout. Before its first change it runs `pnpm worktree <branch>` ([`tools/worktree/worktree.mjs`](../../tools/worktree/worktree.mjs)), which creates `../study-atelier-atl-<n>` from `origin/develop` (or from `--from <ref>`, for example `origin/main` for a hotfix), or checks out the branch when it exists locally or on GitHub, copies `apps/web/.env` from the main checkout and installs the dependencies on the Node of `.nvmrc`.
- After the pull request is merged, `pnpm worktree remove <branch>` removes the worktree and deletes the local branch once GitHub shows its pull request merged; it never removes the main checkout.
- `pnpm screenshot` starts its dev server on the first free port from 5199, so sessions in different worktrees can take screenshots at once.
- A cloud session already has its own clone and works in it.

### Consequences

- Good: two sessions never share a working tree, and the owner's checkout stays as the owner left it.
- Good: a worktree is ready for tests, the dev server and screenshots in one command.
- Bad: every session pays for `pnpm install` (about half a minute from the pnpm store) and some disk space per worktree.

## More information

Issue: [ATL-628](https://linear.app/kamil-nawrot/issue/ATL-628). Described in [working-agreement.md](../guidelines/working-agreement.md#pace) and [git-workflow.md](../guidelines/git-workflow.md#worktrees).
