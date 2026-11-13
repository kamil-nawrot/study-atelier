# 0283. Rename or drop database objects in one release

- Status: accepted
- Date: 2026-11-13

## Context and problem statement

[ADR-0139](0139-ask-the-learner-to-reload-after-a-new-release.md) asked migrations to follow expand and contract: a table, column, function or parameter the previous release uses is removed or renamed only in the release after the one that stopped calling it. The project has not worked that way. Release 0.23, for example, renames `catalogue_museums.english_name` to `alias` in one migration while 0.22 still reads `english_name`. [ADR-0037](0037-separate-databases-for-develop-and-production.md) already said that migrations do not have to stay backward compatible with the app on `main`. Should the rule stay?

## Decision drivers

- One app and one learner for now: a tab with the previous release is rare, and it switches to the new code at its next page change ([ADR-0139](0139-ask-the-learner-to-reload-after-a-new-release.md)).
- A rule the work does not follow misleads reviews and the docs.
- Keeping two shapes side by side doubles the work on every rename.

## Considered options

- Keep the two-release rule and enforce it in review
- Drop the rule: a release may rename or drop what the previous release uses

## Decision outcome

Chosen by the owner: drop the rule for now. A migration may rename or drop a table, column, function or parameter in the same release that moves the app to the new shape. This supersedes the expand-and-contract part of [ADR-0139](0139-ask-the-learner-to-reload-after-a-new-release.md); the notice and the reload on the next navigation stay.

### Consequences

- Good: a rename or a removal is one migration.
- Good: the docs say what the project does.
- Bad: a tab still on the previous release may fail on a renamed or dropped object until the learner reloads or moves to another page; the "new version" notice asks for it.
- Bad: rolling the app back in Cloudflare after such a release brings back a build that may not work on the new schema; the database cannot be rolled back without losing data ([runbook](../architecture/runbook.md#rolling-back-a-release)).

## More information

- Issue ATL-721, from the quality audit of 2026-11-13.
- Revisit when the app has more learners with tabs open across a release.
