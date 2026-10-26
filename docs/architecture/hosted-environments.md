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

Supabase Auth sends the sign-up confirmation, the password reset and the email change through a custom SMTP server. The app and the repository know nothing about the provider: the code only calls `supabase.auth`, and the provider is four values in the dashboard (host, port, username, password) plus the sender address, so changing it never needs a code change. The current provider is a dedicated Gmail address ([ADR-0125](../decisions/0125-send-the-auth-emails-through-gmail-smtp.md), which replaced Brevo of ADR-0119). Nothing of this is applied by CI: the SMTP settings and the templates live in the dashboard of each Supabase project, so both projects are set up by hand and the credentials never reach the repository.

The Polish texts are kept in [`supabase/templates`](../../supabase/templates) and the local stack (`supabase start`) uses the same files through [`supabase/config.toml`](../../supabase/config.toml), with the mails caught by the local inbox instead of sent. A change to a template is made in the file and pasted into the dashboard of `develop` and `production`.

| Template (dashboard name) | File                                                              | Subject                                        |
| ------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| Confirm sign up           | [`confirmation.html`](../../supabase/templates/confirmation.html) | Potwierdź adres e-mail w Study Atelier         |
| Reset password            | [`recovery.html`](../../supabase/templates/recovery.html)         | Ustaw nowe hasło w Study Atelier               |
| Change email address      | [`email-change.html`](../../supabase/templates/email-change.html) | Potwierdź zmianę adresu e-mail w Study Atelier |

### Setting up a project

The steps are the same for any provider: get the SMTP host, port, username and password and a verified sender address from it, then enter them in step 2. The current provider, Gmail:

1. Google: create a Gmail address for the app, sign in to it normally and send a few ordinary mails so a fresh account is not blocked, then turn on two-step verification and, under Security, App passwords, create an app password (16 characters, shown once). It is the SMTP password, not the password of the account.
2. Supabase, Authentication, Emails, SMTP Settings: turn on custom SMTP and enter the sender email (the Gmail address), the sender name `Study Atelier`, the host `smtp.gmail.com`, the port `465`, the full Gmail address as the username and the app password as the password. Save.
3. Supabase, Authentication, Emails, Templates: for each row of the table above set the subject and paste the whole file as the message body.
4. Supabase, Authentication, Sign In / Providers, Email: keep "Confirm email" and "Secure email change" on, so a change of address needs a click in the old and in the new mailbox.
5. Supabase, Authentication, Rate Limits: raise the emails per hour if the default is too low once the custom SMTP is on.
6. Check it on that environment's app: ask for a password reset to an address outside the Supabase team and see that the Polish mail arrives (look in spam too) and the link opens `/update-password`.

Gmail allows about 500 mails a day and may put the mails in spam; moving to an own domain later changes only the SMTP settings.

## Supabase Advisors

The Security and Performance Advisors in the dashboard of each project are run before the app opens to more learners and after a release that changes the database. These findings stay on purpose; any other is fixed in a migration or filed as an issue:

| Advisor  | Finding                                                                                | Why it stays                                                                                                                                                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Security | `public.import_atelier` is a `security definer` function executable by `authenticated` | The import writes record numbers, dates and the review history that the learner's grants do not allow; it takes the owner from `auth.uid()` ([ADR-0122](../decisions/0122-import-an-atelier-into-an-empty-atelier-through-one-function.md)).                             |
| Security | `public.delete_account` is a `security definer` function executable by `authenticated` | It deletes the learner's own `auth.users` row, which the learner's grants do not reach; it takes the learner from `auth.uid()` and refuses while their files are stored ([ADR-0135](../decisions/0135-delete-the-account-with-the-password-and-a-database-function.md)). |
| Security | Leaked password protection is disabled                                                 | It needs Supabase Pro ([ADR-0132](../decisions/0132-keep-the-minimum-password-length-at-8.md)).                                                                                                                                                                          |
| Security | `private.record_counters` has row level security on and no policy (INFO)               | Only the numbering trigger writes it, and the `private` schema is not exposed, so no API role needs a policy.                                                                                                                                                            |

## Releasing

A merge to `main` applies pending migrations to the production database and deploys the production build. Review the new files in `supabase/migrations` before merging the release.

## Testing reviews on the develop database

Reviews plan one day at a time ([ADR-0071](../decisions/0071-put-the-plan-first-on-the-review-start.md)), so a second session the same day finds nothing new. To try the next day without waiting, run [`supabase/scripts/shift-review-dates.sql`](../../supabase/scripts/shift-review-dates.sql) in the SQL Editor of the develop project, with the learner's e-mail and the number of days to move. It moves every due date, last review, card creation and answer of that learner into the past by that many days, so the app sees the days as passed: the artworks due in them are waiting, the daily limit of new artworks starts again, and FSRS counts the elapsed time correctly. It is for the develop and local databases only, never production.
