# 0145. Show announcements from a table

- Status: accepted
- Date: 2026-10-27

## Context and problem statement

With other learners, a planned break, an outage or a broken release needs a way to tell learners what is going on, from inside the app. Where does an announcement come from, and how does a learner put one away?

## Decision drivers

- The owner publishes an announcement in minutes, without a release.
- No new service and no cost.
- A closed announcement does not come back on every page load.

## Considered options

- A table in Supabase, edited in the dashboard, or a static file deployed with the app
- The dismissal remembered on the device (`localStorage`) or on the account

## Decision outcome

Chosen by the owner: a table, and the dismissal on the device.

- `announcements` (`title` up to 80 characters, `body` up to 300, `starts_at`, optional `ends_at`) is readable by signed-in learners only while it is current, and writable only from the dashboard; `supabase/tests/announcements.sql` checks the window and `security.sql` the grants.
- `AnnouncementBanner` in `AtelierLayout` reads the current announcements once per page load and shows each under the top bar as a `warning` `Alert` labelled "Komunikat", with "Zamknij". A closed announcement's id is kept in `localStorage` (the latest 50), so it does not come back on that device.
- A failed read shows nothing: an announcement never breaks the atelier.
- The [runbook](../architecture/runbook.md) says when and how to publish one.

### Consequences

- Good: an announcement reaches every signed-in learner at once, with a planned start and end, and no deployment.
- Bad: while Supabase is down nothing can be announced in the app; the status pages are the fallback.
- Bad: a learner who closed an announcement sees it again on another device.

## More information

- Issue ATL-338.
