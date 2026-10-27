# Hosted environments

Two environments, each with its own Supabase project ([ADR-0037](../decisions/0037-separate-databases-for-develop-and-production.md)).

| Environment  | Branch    | App                               | Supabase project                                |
| ------------ | --------- | --------------------------------- | ----------------------------------------------- |
| `production` | `main`    | `studyatelier.art`                | the original project, holds the real collection |
| `develop`    | `develop` | `develop.study-atelier.pages.dev` | the second project, holds sample data           |

## Domain

Production is served at `https://studyatelier.art` ([ADR-0136](../decisions/0136-serve-production-on-studyatelier-art-and-send-its-emails-through-scaleway.md)). The domain is registered at Namecheap, whose nameservers point to Cloudflare, where all its DNS records live; Cloudflare Registrar does not offer `.art`, so the renewal is paid at Namecheap.

- Cloudflare Pages, project `study-atelier`, Custom domains: `studyatelier.art` and `www.studyatelier.art`.
- Rules, Redirect Rules: `www to root` sends `www.studyatelier.art` with a 301 to `https://studyatelier.art` with the same path and query.
- Bulk Redirects (account level): `study-atelier.pages.dev` redirects with a 301 to `https://studyatelier.art`, keeping the path and query, without subdomains, so `develop.study-atelier.pages.dev` is untouched.
- Supabase production, Authentication, URL Configuration: Site URL `https://studyatelier.art`, redirect URL `https://studyatelier.art/**`.
- Email Routing: `kontakt@studyatelier.art` is forwarded to the owner's Gmail.

DNS records of `studyatelier.art` besides those Pages adds:

| Type | Name                                              | Value                                                                      | For                 |
| ---- | ------------------------------------------------- | -------------------------------------------------------------------------- | ------------------- |
| MX   | `@`                                               | `route1`, `route2`, `route3.mx.cloudflare.net` (added by Email Routing)    | Email Routing       |
| TXT  | `@`                                               | `v=spf1 include:_spf.mx.cloudflare.net include:_spf.tem.scaleway.com ~all` | SPF for both        |
| TXT  | `ea9ae5ff-17e1-4ae8-895a-52024b8f13a0._domainkey` | the DKIM key shown by Scaleway                                             | DKIM of Scaleway    |
| TXT  | `_dmarc`                                          | `v=DMARC1; p=none; rua=mailto:kontakt@studyatelier.art`                    | DMARC, reports only |

A domain has one SPF record: a new sender is added as another `include` to it, never as a second record. The MX record Scaleway suggests (`blackhole.tem.scaleway.com`) is not added, as it would break Email Routing.

## GitHub environments

Settings, Environments: `develop` and `production`, each with these secrets:

| Secret                     | Value                                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_URL`             | Project URL of that environment's project                                                                                                                                                                                            |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key of that project                                                                                                                                                                                                      |
| `SUPABASE_ACCESS_TOKEN`    | Personal access token with read access to Project Settings, API Keys and API Key Secrets for that project; it can be one token for both projects                                                                                     |
| `SUPABASE_DB_PASSWORD`     | Database password of that project                                                                                                                                                                                                    |
| `SUPABASE_SECRET_KEY`      | Secret key of that project (Project Settings, API Keys), used by the unused images clean-up ([ADR-0090](../decisions/0090-clean-up-unused-images-daily-from-github-actions.md)) and the backup of the images ([backups](backups.md)) |

`production` also has the variable (not a secret) `BACKUP_AGE_RECIPIENT`: the public `age` key the backups are encrypted to ([backups](backups.md)). Without it a release stops before migrating the production database.

Each environment may also have the variables `LEGAL_COMPANY`, `LEGAL_ADDRESS` and `LEGAL_NIP`: the business name, address and tax number of the provider, shown in the terms and the privacy policy ([ADR-0137](../decisions/0137-publish-the-terms-and-the-privacy-policy-and-store-their-acceptance.md)). They are public and end up in the build; without them the pages show `[FIRMA]`, `[ADRES]` and `[NIP]`.

Each environment also has the variable `SENTRY_DSN`, and `production` the variables `SENTRY_ORG` and `SENTRY_PROJECT` and the secret `SENTRY_AUTH_TOKEN` ([Monitoring](#monitoring)). Without them nothing is sent to Sentry.

Each environment also has the variable `TURNSTILE_SITE_KEY`: the site key of the Turnstile widget ([Captcha](#captcha)). Without it the forms show no captcha.

Deployment branches: `production` allows `main` and `develop`, `develop` allows `develop`. The scheduled keep-alive, the unused images clean-up and the weekly production backup run from the default branch, `develop`, so they need access to `production`; the consequence is that code merged to `develop` can read the production secrets, and only the owner merges.

The same five names must not remain as repository secrets: an environment secret overrides a repository secret, but a missing one would silently fall back to it and point `develop` at production.

## New Supabase project

1. Create the project on the Free plan in the same region as production and check that the creation screen shows no paid compute add-on.
2. In Authentication, URL Configuration, set the Site URL to `https://develop.study-atelier.pages.dev` and add it, with `http://localhost:5173`, to the redirect URLs.
3. In Authentication, Providers, Email, keep the same settings as production (email confirmation on).
4. Push to `develop`: the `database` job applies all migrations, including the `artwork-images` bucket and the `keep_alive()` function.
5. Sign up in the develop app, then fill it with the sample artworks by running the seed files in the SQL Editor.
6. Run the `Supabase keep-alive` workflow manually and check that both jobs pass. Run the `Unused images clean-up` workflow manually from `develop` and, after the next release, from `main`: a manual run cleans only the environment of its branch, the daily one both ([ADR-0092](../decisions/0092-clean-up-images-by-hand-for-one-environment.md)).

## Auth emails

Supabase Auth sends the sign-up confirmation, the password reset and the email change through a custom SMTP server. The app and the repository know nothing about the provider: the code only calls `supabase.auth`, and the provider is four values in the dashboard (host, port, username, password) plus the sender address, so changing it never needs a code change. Production sends through Scaleway Transactional Email from `kontakt@studyatelier.art` ([ADR-0136](../decisions/0136-serve-production-on-studyatelier-art-and-send-its-emails-through-scaleway.md)); develop sends through a dedicated Gmail address ([ADR-0125](../decisions/0125-send-the-auth-emails-through-gmail-smtp.md)). Nothing of this is applied by CI: the SMTP settings and the templates live in the dashboard of each Supabase project, so both projects are set up by hand and the credentials never reach the repository.

The Polish texts are kept in [`supabase/templates`](../../supabase/templates) and the local stack (`supabase start`) uses the same files through [`supabase/config.toml`](../../supabase/config.toml), with the mails caught by the local inbox instead of sent. A change to a template is made in the file and pasted into the dashboard of `develop` and `production`.

| Template (dashboard name) | File                                                              | Subject                                        |
| ------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| Confirm sign up           | [`confirmation.html`](../../supabase/templates/confirmation.html) | Potwierdź adres e-mail w Study Atelier         |
| Reset password            | [`recovery.html`](../../supabase/templates/recovery.html)         | Ustaw nowe hasło w Study Atelier               |
| Change email address      | [`email-change.html`](../../supabase/templates/email-change.html) | Potwierdź zmianę adresu e-mail w Study Atelier |

### Setting up a project

The steps are the same for any provider: get the SMTP host, port, username and password and a verified sender address from it, then enter them in step 2.

Production, Scaleway (before step 2):

1. Scaleway console, the owner's organisation, project `study-atelier`: Transactional Email, add the domain `studyatelier.art` in `fr-par`, add its SPF, DKIM and DMARC records in Cloudflare as in [Domain](#domain), and wait for the domain to be verified.
2. IAM: an application `study-atelier-smtp`, a policy giving it Transactional Email permissions in the project `study-atelier`, and an API key of that application. The SMTP username is the Project ID of `study-atelier` and the password is the secret key, shown once.
3. In step 2 below: host `smtp.tem.scaleway.com`, port `587`, sender `kontakt@studyatelier.art`. A typo in any field (even a trailing comma in the host) shows only as "Error sending recovery email" in the app; the cause is in Logs Explorer, `auth_logs`.

Develop, Gmail (before step 2):

1. Google: create a Gmail address for the app, sign in to it normally and send a few ordinary mails so a fresh account is not blocked, then turn on two-step verification and, under Security, App passwords, create an app password (16 characters, shown once). It is the SMTP password, not the password of the account.
2. Supabase, Authentication, Emails, SMTP Settings: turn on custom SMTP and enter the sender email, the sender name `Study Atelier`, the host, the port, the username and the password of the provider. For Gmail: the Gmail address as sender and username, `smtp.gmail.com`, port `465`, the app password. Save.
3. Supabase, Authentication, Emails, Templates: for each row of the table above set the subject and paste the whole file as the message body.
4. Supabase, Authentication, Sign In / Providers, Email: keep "Confirm email" and "Secure email change" on, so a change of address needs a click in the old and in the new mailbox.
5. Supabase, Authentication, Rate Limits: raise the emails per hour if the default is too low once the custom SMTP is on.
6. Check it on that environment's app: ask for a password reset to an address outside the Supabase team and see that the Polish mail arrives (look in spam too) and the link opens `/update-password`.

Scaleway sends 300 mails a month for free and then charges €0.25 per 1,000; its mails pass SPF, DKIM and DMARC. Gmail allows about 500 mails a day and may put the mails in spam.

## Captcha

The auth forms send a Cloudflare Turnstile token to Supabase Auth ([ADR-0138](../decisions/0138-protect-the-auth-forms-with-cloudflare-turnstile.md)). One widget serves both environments:

1. Cloudflare dashboard, Turnstile: add a widget `study-atelier` in the Managed mode with the hostnames `studyatelier.art`, `develop.study-atelier.pages.dev` and `localhost`. It gives a site key (public) and a secret key.
2. GitHub, Settings, Environments: in `develop` and `production` add the variable `TURNSTILE_SITE_KEY` with the site key, then deploy both environments (a push to `develop`, a release for production) and check that the sign-in still works.
3. Only after the deployment: Supabase, Authentication, Bot and Abuse Protection (Attack Protection in older dashboards), turn on captcha protection with the provider Turnstile and the secret key, in each project. In the other order every sign-in fails until the app sends tokens.
4. Check on each environment: sign in, ask for a password reset, and change the password in the Konto tab.

To switch the protection off, turn it off in Supabase first; the site key can stay. The local stack has no captcha, and `apps/web/.env` needs no key; to try the widget locally, set `TURNSTILE_SITE_KEY` there to the Cloudflare test key `1x00000000000000000000AA`.

## Monitoring

Errors go to Sentry, outages to UptimeRobot, and production page views to Cloudflare Web Analytics ([ADR-0140](../decisions/0140-report-browser-errors-to-sentry-and-watch-the-uptime.md)). All three are free plans in the owner's name; no key reaches the repository or the chat.

Sentry:

1. Create an organisation on the Developer plan in the EU data region, then a project `study-atelier` for the platform Svelte. Its DSN is public.
2. Project settings, Security & Privacy: turn on "Prevent storing of IP addresses" and keep the data scrubbers on. Alerts: an email on the first event of a new issue (the default).
3. GitHub, Settings, Environments: add the variable `SENTRY_DSN` with the DSN in `develop` and `production` (one project serves both; events carry the environment). In `production` also add the variables `SENTRY_ORG` and `SENTRY_PROJECT` (the slugs) and the secret `SENTRY_AUTH_TOKEN`: an organisation auth token from Sentry, Settings, Auth Tokens, which can upload source maps.
4. Check after the next push to `develop`: run `setTimeout(() => { throw new Error('Sentry check') })` in the browser console of the develop app and see the issue in Sentry with the environment `develop`, the release and no IP address.

UptimeRobot:

1. Create a free account and two HTTP(s) monitors at the 5 minute interval, alerting the owner's email: `https://studyatelier.art` and `https://<production project ref>.supabase.co/rest/v1/rpc/keep_alive?apikey=<publishable key>`. The free plan sends a `HEAD` request without custom headers, so the key goes in the query string (it is public), and `keep_alive` is the endpoint that answers `HEAD` with 200 while going through the gateway, PostgREST and the database; `/auth/v1/health` answers `HEAD` with 405. The alert email is the account's address, changed in the account settings.
2. Check the alert once: pause and resume a monitor, or point a third monitor at a missing address and delete it after the email arrives.

Cloudflare Web Analytics: Workers & Pages, `study-atelier`, Metrics, turn on Web Analytics. Cloudflare adds the script to the production pages without cookies; nothing in the repository changes.

## Load and limits

[`supabase/scale/measure.sh`](../../supabase/scale/measure.sh) checks the database for many accounts on the local stack. In one transaction that ends with `rollback`, it applies the migrations the local database lacks, seeds 3000 learners ([`seed.sql`](../../supabase/scale/seed.sql): 10 with 460 to 1000 artworks, 290 with 50, the rest with 5, with values, images, reviews, glossary entries, events and visits) and runs the main reads and writes as the learner with 1000 artworks, with `auto_explain` printing every plan, nested ones included ([`measure.sql`](../../supabase/scale/measure.sql)). Nothing stays in the local database. Run it after a migration that adds a table or a read: `supabase/scale/measure.sh 2> plans.txt > /dev/null`.

Measured on 2026-10-27 (ATL-334), with about 36,000 artworks in all:

| Read or write                                                              | Time          |
| -------------------------------------------------------------------------- | ------------- |
| The wall (60 artworks with image, values and visit), the trash             | 17 ms, 0 ms   |
| `value_usage`, the other usage functions, `value_page_content`             | 1 to 9 ms     |
| `review_counts`, `review_streak`, `review_session`                         | 11, 7, 199 ms |
| `notes_mentions`, `storage_usage`, timeline, chronicle, glossary, values   | under 3 ms    |
| Adding an artwork, a glossary entry, a review answer (with the row limits) | 1 to 2 ms     |
| Deleting the account of the learner with 1000 artworks                     | 2.5 s         |

Every read uses an index that starts with `owner_id` or with the id of the artwork; no plan scans another learner's rows, and every policy calls `(select auth.uid())`. `review_session` grows with the size of one atelier, not with the number of accounts. Deleting an account runs one foreign key check per deleted row, which is fine once per account.

Cloudflare runs the Pages worker only for a full page load: the app has no server `load` and no `+server` routes, and `/_app/immutable/*` and `/_app/version.json` are static files outside the worker. The Free plan allows 100,000 worker requests a day, that is about 100,000 page loads; navigation inside the app, polling for a new version and the images do not count.

Own images: signed URLs live for 24 hours and are kept on the device, and files uploaded since ATL-334 carry `Cache-Control: max-age=31536000`, so the wall downloads each of them at most once a day per device ([ADR-0141](../decisions/0141-cache-own-images-for-a-day-on-the-device.md)). Files uploaded before keep the one-hour header of Supabase's default; they are cached for an hour within the day and need no change.

## Feedback digest

Every hour [`feedback-digest.yml`](../../.github/workflows/feedback-digest.yml) mails the new reports from "Zgłoś uwagę" in production to `kontakt@studyatelier.art`, which forwards to the owner ([ADR-0142](../decisions/0142-mail-new-feedback-to-the-owner-every-hour.md)). It needs, in the `production` environment:

1. The secrets `SMTP_USERNAME` and `SMTP_PASSWORD`: the same Scaleway SMTP credentials as in [Auth emails](#auth-emails) (the Project ID and the secret key of `study-atelier-smtp`), or a second API key of that application.
2. After the release that adds `feedback.notified_at`: the variable `FEEDBACK_DIGEST` set to `on`. Until then the job runs and skips the mail step.
3. Check: send a report from the production app, run the workflow by hand (Actions, Feedback digest, Run workflow), and see one mail in the inbox and the report's `notified_at` set in the table editor.

The log shows only the number of reports. Reports already in the table when the digest is turned on are mailed in the first run, at most 50 at a time.

## Supabase Advisors

The Security and Performance Advisors in the dashboard of each project are run before the app opens to more learners and after a release that changes the database. These findings stay on purpose; any other is fixed in a migration or filed as an issue:

| Advisor  | Finding                                                                                | Why it stays                                                                                                                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security | `public.import_atelier` is a `security definer` function executable by `authenticated` | The import writes record numbers, dates and the review history that the learner's grants do not allow; it takes the owner from `auth.uid()` ([ADR-0122](../decisions/0122-import-an-atelier-into-an-empty-atelier-through-one-function.md)). |
| Security | `public.delete_account` is a `security definer` function executable by `authenticated` | It deletes the learner's own `auth.users` row, which the learner's grants do not reach; it takes the learner from `auth.uid()` ([ADR-0135](../decisions/0135-delete-the-account-with-the-password-and-a-database-function.md)).              |
| Security | Leaked password protection is disabled                                                 | It needs Supabase Pro ([ADR-0132](../decisions/0132-keep-the-minimum-password-length-at-8.md)).                                                                                                                                              |
| Security | `private.record_counters` has row level security on and no policy (INFO)               | Only the numbering trigger writes it, and the `private` schema is not exposed, so no API role needs a policy.                                                                                                                                |

## Releasing

A merge to `main` applies pending migrations to the production database and deploys the production build. Review the new files in `supabase/migrations` before merging the release.

## Testing reviews on the develop database

Reviews plan one day at a time ([ADR-0071](../decisions/0071-put-the-plan-first-on-the-review-start.md)), so a second session the same day finds nothing new. To try the next day without waiting, run [`supabase/scripts/shift-review-dates.sql`](../../supabase/scripts/shift-review-dates.sql) in the SQL Editor of the develop project, with the learner's e-mail and the number of days to move. It moves every due date, last review, card creation and answer of that learner into the past by that many days, so the app sees the days as passed: the artworks due in them are waiting, the daily limit of new artworks starts again, and FSRS counts the elapsed time correctly. It is for the develop and local databases only, never production.
