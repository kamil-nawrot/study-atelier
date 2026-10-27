# 0142. Mail new feedback to the owner every hour

- Status: accepted
- Date: 2026-10-27

## Context and problem statement

Learners send bugs and ideas from "Zgłoś uwagę" into the `feedback` table ([ADR-0076](0076-collect-feedback-in-a-table-from-a-menu-dialog.md)), and the owner reads them only in the Supabase dashboard. With more learners, a report must reach the owner without opening the dashboard, at no cost. Supabase cannot send arbitrary emails. How does a report reach the owner?

## Decision drivers

- No new provider and no cost.
- The workflow logs are public, as the repository is: they never show what a learner wrote.
- A report is mailed once, and a failed mail is retried.

## Considered options

- A scheduled GitHub Actions workflow that mails a digest through Scaleway, from the verified `studyatelier.art`
- The same through the Gmail address of develop
- A Database Webhook calling an Edge Function at once

## Decision outcome

Chosen by the owner: the workflow through Scaleway, every hour.

- `feedback-digest.yml` runs at minute 17 of every hour in the `production` environment. Its script reads the reports with no `notified_at` using the secret key, sends one plain-text mail from and to `kontakt@studyatelier.art` through Scaleway SMTP with `curl`, then stamps `notified_at`. No new report means no mail. The log shows only the counts.
- The mail lists each report's kind, title, time (Warsaw), account id, browser and description; never the learner's email.
- The feedback dialog also stores the browser (`browser`, the user agent, at most 500 characters). Learners may insert it but not `notified_at`.
- The step runs only when the `production` environment has the variable `FEEDBACK_DIGEST` set to `on`, so the workflow is quiet until the migration reaches production and the SMTP secrets are set.
- The privacy policy names the browser and the forwarding of reports through Scaleway and GitHub.

### Consequences

- Good: a report reaches the owner's inbox within an hour, at no cost and with no new account.
- Good: a failed mail leaves the reports unmarked, so the next run sends them.
- Bad: a mail that was sent but whose stamp failed is sent again an hour later.
- Bad: the Scaleway SMTP credentials are also stored in GitHub.

## More information

- Issue ATL-191; the setup is in [hosted environments](../architecture/hosted-environments.md#feedback-digest).
