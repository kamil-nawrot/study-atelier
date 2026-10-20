# 0076. Collect feedback in a table, from a dialog in the menu

- Status: accepted
- Date: 2026-10-17

## Context and problem statement

The learner should be able to report a bug or an idea from inside the app, and the owner must be able to read the reports. Supabase cannot send arbitrary emails: its SMTP settings serve only authentication mails. Where do reports go, and how does the learner reach the form?

## Decision drivers

- No new service, secret or deploy step ([ADR-0005](0005-no-custom-backend.md)).
- A learner never reads other learners' reports.
- The form is reachable from every view without taking a place in the layout of any of them.

## Considered options

- A `feedback` table with insert-only row level security, read by the owner in the Supabase dashboard
- An Edge Function that mails the report through an external provider
- The table plus a notification added later

## Decision outcome

Chosen option: "a `feedback` table with insert-only row level security". The signed-in learner may insert a row owned by them (`kind` of `bug` or `idea`, `title` up to 120 characters, optional `description` up to 4000, both trimmed and checked in the database) and has no select, update or delete grant at all. The owner reads the rows in the Supabase Table Editor. A notification can be added later without changing the data model.

The form is a `Dialog` opened from the menu item "Zgłoś uwagę", placed after "Kosz" and before the theme switch, so it is one tap from any view. A successful send closes the dialog and shows a toast; a failed send shows an `Alert` at the top of the form and keeps what was typed.

### Consequences

- Good: no new dependency, and the data stays in the database the owner already uses.
- Good: the learner cannot read the table, so reports stay private.
- Bad: the owner gets no notification and has to look at the table.
- Bad: the learner cannot see or follow up a sent report.
