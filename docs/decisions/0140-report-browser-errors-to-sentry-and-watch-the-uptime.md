# 0140. Report browser errors to Sentry and watch the uptime

- Status: accepted
- Date: 2026-10-26

## Context and problem statement

The owner learns about an error only when a learner reports it, and about an outage only by chance. With more learners, errors and outages must reach the owner without waiting for feedback, on free plans and without sending what learners write. What collects the errors, what may an error report contain, and what watches the uptime?

## Decision drivers

- Free plans only, data in the EU where possible.
- An error report never carries the atelier's texts, the email address or the IP address.
- Nothing is sent from tests, local runs or a build without the settings.
- The app renders in the browser only (`ssr = false`): the worker only serves the page shell.

## Considered options

- Sentry with the browser SDK (`@sentry/svelte`), Sentry with `@sentry/sveltekit` (browser and worker), or Cloudflare logs alone
- UptimeRobot or Better Stack for the uptime

## Decision outcome

Chosen by the owner: Sentry with the browser SDK only, and UptimeRobot.

- Sentry, Developer plan, organisation in the EU data region. `hooks.client.ts` starts it when the build has `SENTRY_DSN`; the environment is `SENTRY_ENVIRONMENT` (`develop` or `production`, set by CI) and the release is `study-atelier@` plus the version in `apps/web/package.json`.
- Sent: unhandled errors and rejected promises, errors in SvelteKit's client hooks, and the service errors the app shows as "unexpected", that is without a message of their own (`errorMessages`, `authErrorMessage`, the start of a review). Expected errors (known codes, limits, a lost connection) are not sent.
- Privacy: `dataCollection` turns off user info, cookies, headers, bodies and query parameters; `beforeSend` keeps only the learner id as the user, the address without its query, emails replaced by `[email]`, and service error messages with their quoted values hidden; breadcrumbs keep only navigation and requests, without their query. No session replay, no performance traces. In Sentry, "Prevent storing of IP addresses" is on.
- Source maps: production builds upload hidden source maps for the release when the `production` environment has `SENTRY_AUTH_TOKEN`; the repository is public, so a map left in the build exposes nothing new.
- UptimeRobot (free) watches the production app and the Supabase project and emails the owner. Cloudflare Web Analytics (free, no cookies) counts the page views of production.
- The privacy policy names Sentry and Web Analytics.

### Consequences

- Good: the owner sees unexpected errors with the release and the page, and outages within minutes, at no cost.
- Good: the scrubbing is code with tests, not only a setting in a dashboard.
- Bad: an error message written by a library may still quote a value; the scrubbing hides emails and quoted values, not every text.
- Bad: three more accounts (Sentry, UptimeRobot, Web Analytics in Cloudflare) to keep, listed in the hosted environments docs.

## More information

- Issue ATL-328; the setup steps are in [hosted environments](../architecture/hosted-environments.md#monitoring).
