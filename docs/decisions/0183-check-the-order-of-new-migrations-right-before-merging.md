# 0183. Check the order of new migrations right before merging

- Status: accepted
- Date: 2026-11-04

## Context and problem statement

Two pull requests that each added a migration were merged in the opposite order of their timestamps (#535 before #534). The development database ran the later migration first, and `supabase db push` then refused the older one ("Found local migration files to be inserted before the last migration on remote database"). The "Database migrations" job failed only after the merge, and the profile on develop did not load until the migration was renamed (ATL-487). Several Claude sessions work in parallel, so this can happen again. How should it be caught before the merge?

## Decision drivers

- The problem is caught before a pull request is merged, not by a failed job on develop.
- A check that ran when the pull request was opened does not see a migration merged into the base branch afterwards; #534 passed every check before #535 was merged.
- No extra work on every merge for pull requests without migrations.

## Considered options

- a check in the Conventions job, run again right before merging a pull request that adds a migration;
- the same check with the GitHub branch protection rule that a branch must be up to date with the base branch before merging.

## Decision outcome

Chosen by the owner in ATL-488: a check in the Conventions job, run again right before merging, because it adds no work to pull requests without migrations, while the up-to-date rule would make every merge into `develop` force a merge of `develop` into every other open pull request.

- `.github/scripts/check-migration-order.mjs` fetches the base branch itself and fails when a migration the pull request adds is not newer than the newest migration on the base branch, naming both files.
- Right before merging a pull request that adds a migration, whoever merges reruns the Conventions job or runs the script on the branch, and merges only when it passes ([git workflow](../guidelines/git-workflow.md#pull-requests)).

### Consequences

- Good: the wrong order is caught before the merge, with a message that says which file to rename.
- Good: the check also covers release, hotfix and merge-back pull requests, where `supabase db push` has the same rule.
- Bad: the second run depends on whoever merges remembering it; a merge that skips it can still break develop.

## More information

ATL-487 (the incident), ATL-488 (the check).
