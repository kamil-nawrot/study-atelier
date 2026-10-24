# Hosted environments

Two environments, each with its own Supabase project ([ADR-0037](../decisions/0037-separate-databases-for-develop-and-production.md)).

| Environment  | Branch    | App                               | Supabase project                                |
| ------------ | --------- | --------------------------------- | ----------------------------------------------- |
| `production` | `main`    | `study-atelier.pages.dev`         | the original project, holds the real collection |
| `develop`    | `develop` | `develop.study-atelier.pages.dev` | the second project, holds sample data           |

## GitHub environments

Settings, Environments: `develop` and `production`, each with these secrets:

| Secret                     | Value                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_URL`             | Project URL of that environment's project                                                                                                                                            |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key of that project                                                                                                                                                      |
| `SUPABASE_ACCESS_TOKEN`    | Personal access token with read access to Project Settings, API Keys and API Key Secrets for that project; it can be one token for both projects                                     |
| `SUPABASE_DB_PASSWORD`     | Database password of that project                                                                                                                                                    |
| `SUPABASE_SECRET_KEY`      | Secret key of that project (Project Settings, API Keys), used only by the unused images clean-up ([ADR-0090](../decisions/0090-clean-up-unused-images-daily-from-github-actions.md)) |

Deployment branches: `production` allows `main` and `develop`, `develop` allows `develop`. The scheduled keep-alive and the unused images clean-up run from the default branch, `develop`, so they need access to `production`; the consequence is that code merged to `develop` can read the production secrets, and only the owner merges.

The same five names must not remain as repository secrets: an environment secret overrides a repository secret, but a missing one would silently fall back to it and point `develop` at production.

## New Supabase project

1. Create the project on the Free plan in the same region as production and check that the creation screen shows no paid compute add-on.
2. In Authentication, URL Configuration, set the Site URL to `https://develop.study-atelier.pages.dev` and add it, with `http://localhost:5173`, to the redirect URLs.
3. In Authentication, Providers, Email, keep the same settings as production (email confirmation on).
4. Push to `develop`: the `database` job applies all migrations, including the `artwork-images` bucket and the `keep_alive()` function.
5. Sign up in the develop app, then fill it with the sample artworks by running the seed files in the SQL Editor.
6. Run the `Supabase keep-alive` workflow manually and check that both jobs pass. Run the `Unused images clean-up` workflow manually from `develop` and, after the next release, from `main`: a manual run cleans only the environment of its branch, the daily one both ([ADR-0092](../decisions/0092-clean-up-images-by-hand-for-one-environment.md)).

## Auth emails

Supabase Auth sends the sign-up confirmation, the password reset and the email change through Brevo on the free plan, from one verified sender without an own domain ([ADR-0119](../decisions/0119-send-the-auth-emails-through-brevo.md)). Nothing of this is applied by CI: the SMTP settings and the templates live in the dashboard of each Supabase project, so both projects are set up by hand and the credentials never reach the repository.

The Polish texts are kept in [`supabase/templates`](../../supabase/templates) and the local stack (`supabase start`) uses the same files through [`supabase/config.toml`](../../supabase/config.toml), with the mails caught by the local inbox instead of sent. A change to a template is made in the file and pasted into the dashboard of `develop` and `production`.

| Template (dashboard name) | File                                                              | Subject                                        |
| ------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| Confirm sign up           | [`confirmation.html`](../../supabase/templates/confirmation.html) | Potwierdź adres e-mail w Study Atelier         |
| Reset password            | [`recovery.html`](../../supabase/templates/recovery.html)         | Ustaw nowe hasło w Study Atelier               |
| Change email address      | [`email-change.html`](../../supabase/templates/email-change.html) | Potwierdź zmianę adresu e-mail w Study Atelier |

### Setting up a project

1. Brevo: create the account, then Senders, Domains & Dedicated IPs, Senders, add the mailbox the mails are sent from and confirm it with the link Brevo sends there.
2. Brevo: SMTP & API, SMTP, note the server `smtp-relay.brevo.com`, port `587` and the login, and generate an SMTP key. The key is shown once; the login and the key are the SMTP credentials, not the password of the Brevo account.
3. Supabase, Authentication, Emails, SMTP Settings: turn on custom SMTP and enter the sender email (the verified mailbox), the sender name `Study Atelier`, the host, the port, the login as the username and the SMTP key as the password. Save.
4. Supabase, Authentication, Emails, Templates: for each row of the table above set the subject and paste the whole file as the message body.
5. Supabase, Authentication, Sign In / Providers, Email: keep "Confirm email" and "Secure email change" on, so a change of address needs a click in the old and in the new mailbox.
6. Supabase, Authentication, Rate Limits: raise the emails per hour if the default is too low once the custom SMTP is on.
7. Check it on that environment's app: ask for a password reset to an address outside the Supabase team and see that the Polish mail arrives and the link opens `/update-password`.

Brevo adds its own footer on the free plan and mail from a free mailbox may land in spam; moving to an own domain later changes only the SMTP settings.

## Releasing

A merge to `main` applies pending migrations to the production database and deploys the production build. Review the new files in `supabase/migrations` before merging the release.

## Testing reviews on the develop database

Reviews plan one day at a time ([ADR-0071](../decisions/0071-put-the-plan-first-on-the-review-start.md)), so a second session the same day finds nothing new. To try the next day without waiting, run [`supabase/scripts/shift-review-dates.sql`](../../supabase/scripts/shift-review-dates.sql) in the SQL Editor of the develop project, with the learner's e-mail and the number of days to move. It moves every due date, last review, card creation and answer of that learner into the past by that many days, so the app sees the days as passed: the artworks due in them are waiting, the daily limit of new artworks starts again, and FSRS counts the elapsed time correctly. It is for the develop and local databases only, never production.
