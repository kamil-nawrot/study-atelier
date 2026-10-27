# Runbook

What the owner does when the app breaks, a release goes wrong, a key leaks, or a planned break is coming. The accounts and settings named here are described in [hosted environments](hosted-environments.md) and [backups](backups.md).

## First checks

Go through these in order before changing anything:

1. **Is it everyone or one learner?** Open the production app in a private window and sign in with a test account.
2. **Alerts:** the UptimeRobot email (the app or the Supabase health monitor is down) and new issues in Sentry for the environment `production`, with their release.
3. **Status pages** of the services the app depends on: Supabase (status.supabase.com), Cloudflare (www.cloudflarestatus.com), Scaleway (status.scaleway.com) for auth emails, and GitHub (www.githubstatus.com) for deployments and the scheduled workflows.
4. **Supabase logs:** Logs Explorer in the production project, `auth_logs` for sign-in and email problems, `postgres_logs` for database errors. A paused project shows in the project's home page.
5. **The last deployment:** Cloudflare, Workers & Pages, `study-atelier`, Deployments. A problem that started with a release points at that release.

## Telling learners

- **In the app:** add a row to the `announcements` table of the production project (Table Editor): `body` (at most 300 characters), optional `title` (at most 80), `starts_at` (default now) and optional `ends_at`. Every signed-in learner sees it under the top bar until `ends_at` or until they close it on their device ([ADR-0145](../decisions/0145-show-announcements-from-a-table.md)). End it by setting `ends_at` to now.
- An announcement is read from Supabase, so it does not show while Supabase itself is down; then the app does not work at all, and the start page and the status pages are what learners see.
- **Planned break:** add the announcement at least a day before, with `starts_at` now and `ends_at` at the end of the break.
- **Personal data breach** (a leaked secret key or database password, data seen by someone who should not see it): report it to the Prezes UODO within 72 hours of learning about it (GDPR art. 33). When the breach is likely to put learners at high risk, tell the affected learners by email as well (art. 34). Write down what happened, when, and what was done, whether or not it is reported.

## Closing sign-up for a while

Supabase, production project, Authentication, Sign In / Providers: turn off "Allow new users to sign up". Signed-in learners and existing accounts keep working; the sign-up form shows an error. Turn it on again when the cause is fixed. For a flood of bot sign-ups, check first that captcha protection is still on ([Captcha](hosted-environments.md#captcha)).

## Rolling back a release

1. **The app:** Cloudflare, Workers & Pages, `study-atelier`, Deployments: open the previous production deployment and roll back to it. The app is back to the previous build within a minute; learners with an open tab get the "new version" notice and reload.
2. **The database:** migrations only go forward. The previous build keeps working on the new schema as long as the release followed the two-step rule for removals ([code conventions](../guidelines/code-conventions.md), Database). Restore the database only when data was damaged: take the encrypted dump the release saved before migrating and follow [Bringing a backup back](backups.md#bringing-a-backup-back). Everything learners saved after the dump is lost, so tell them first.
3. **The code:** revert the release's changes on `develop` in a `fix` pull request, and ship it as a hotfix through `main`.

## Rotating a leaked key

Rotate first, then look for the cause. A key pasted in a public place counts as leaked.

| Key                        | Where to rotate                                                              | Where to update after                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Supabase secret key        | Supabase, Project Settings, API Keys: create a new one, revoke the old       | GitHub environment secret `SUPABASE_SECRET_KEY`                                             |
| Supabase database password | Supabase, Project Settings, Database: reset the password                     | GitHub environment secret `SUPABASE_DB_PASSWORD`                                            |
| Supabase access token      | Supabase, Account, Access Tokens                                             | GitHub environment secret `SUPABASE_ACCESS_TOKEN`                                           |
| Scaleway SMTP key          | Scaleway, IAM, application `study-atelier-smtp`: new API key, delete the old | Supabase SMTP settings (password); GitHub `production` secret `SMTP_PASSWORD`               |
| Turnstile secret key       | Cloudflare, Turnstile, widget `study-atelier`: rotate the secret             | Supabase captcha settings of both projects                                                  |
| Cloudflare API token       | Cloudflare, My Profile, API Tokens: roll                                     | GitHub secret `CLOUDFLARE_API_TOKEN`                                                        |
| Sentry auth token          | Sentry, Settings, Auth Tokens: revoke, create                                | GitHub `production` secret `SENTRY_AUTH_TOKEN`                                              |
| Backup `age` key           | Generate a new key pair ([backups](backups.md#the-key))                      | GitHub `production` variable `BACKUP_AGE_RECIPIENT`; keep the old private key for old dumps |

The publishable key, the Turnstile site key and the Sentry DSN are public by design and need no rotation.

## Limits to watch each month

Check the usage pages once a month and before a wave of new learners:

| Service          | Where                                     | Limit on the current plan                                                                                    |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Supabase         | Organization, Usage                       | Free plan: 500 MB database, 1 GB file storage, 5 GB egress; the project pauses after a week without activity |
| Cloudflare Pages | Workers & Pages, `study-atelier`, Metrics | 100,000 worker requests a day ([load and limits](hosted-environments.md#load-and-limits))                    |
| Scaleway TEM     | Transactional Email, Statistics           | 300 emails a month free, then paid per thousand                                                              |
| Sentry           | Settings, Subscription, Usage             | the event quota of the Developer plan; dropped events show there                                             |
| GitHub Actions   | Actions tab                               | free for the public repository; watch for failing scheduled workflows instead                                |

A limit that comes close is a reason to open an issue before it is reached, not to change plans in a hurry.
