# 0134. Back up production to encrypted GitHub artifacts

- Status: accepted
- Date: 2026-10-26

## Context and problem statement

With other learners' data, a broken migration or a wrong clean-up would be unrecoverable: the Supabase Free plan has no backups, and Pro's daily backups cover only the database, not the files in Storage. Where are backups kept, how are they protected in a public repository, and how is the clean-up of unused images ([ADR-0090](0090-clean-up-unused-images-daily-from-github-actions.md)) kept from wiping the bucket?

## Decision drivers

- No cost and no new accounts ([ADR-0006](0006-zero-cost-hosting.md)).
- The repository is public, so anything stored in GitHub must be unreadable without a key the owner alone holds.
- A backup is taken right before every production migration and also on a schedule, with the images.

## Considered options

1. Encrypted GitHub Actions artifacts, kept 30 days
2. Cloudflare R2 (10 GB free), which needs R2 enabled on the Cloudflare account and its own API keys

## Decision outcome

Chosen by the owner: option 1, encrypted with `age` to a key only the owner holds, and the clean-up stops above 100 files.

- The `database` job dumps the production database before `supabase db push` on `main`; a weekly workflow from `develop` dumps it and downloads every file of `artwork-images`. Both encrypt a tarball to the public key in the `production` variable `BACKUP_AGE_RECIPIENT` and upload it as an artifact kept 30 days, so four weekly backups are at hand.
- The private key stays in the owner's password manager. Nobody with access to GitHub can read a backup, and only the owner can restore one.
- A release without the variable stops before migrating.
- The clean-up removes nothing and fails when one run would remove more than 100 files; a manual run with `allow_mass_delete` removes them after the owner checked the list. A percentage of the bucket was not chosen, because with a small bucket it would block the ordinary daily clean-up.
- The restore is rehearsed on a separate local Supabase stack, not on the develop project, so no shared database is overwritten ([backups](../architecture/backups.md)).

### Consequences

- Good: no cost, no new account, and a backup before every risky step.
- Good: a backup is useless to anyone but the owner.
- Bad: backups older than 30 days are gone; a longer history needs another store, such as R2.
- Bad: losing the private key loses every backup made with it.
- Bad: the weekly backup downloads every image through the Storage API, which counts towards the egress of the Free plan.

## More information

- Issue ATL-333. Steps in [backups](../architecture/backups.md).
