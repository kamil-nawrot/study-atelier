# 0016. Sign in with Supabase Auth from the browser, email and password only

- Status: accepted
- Date: 2026-10-11

## Context and problem statement

The app needs accounts so each learner sees only their own collection. Authentication uses Supabase Auth ([ADR-0008](0008-supabase-database-and-auth.md)). The owner asked for the simplest setup that relies on what Supabase provides: email and password, with password reset by email. Two questions remain: where the session lives, and how the app gets the Supabase URL and key.

## Decision drivers

- Simplest setup that works with the Cloudflare adapter and no custom backend ([ADR-0005](0005-no-custom-backend.md)).
- No secrets in the browser: only the publishable key, protected by row level security.
- Values from the repository secrets that already exist.

## Considered options

1. Client-side only: `@supabase/supabase-js` in the browser, session in `localStorage`, server-side rendering off (`ssr = false`)
2. Server-side rendering with `@supabase/ssr`: session in cookies, read in a server hook on Cloudflare

## Decision outcome

Chosen option: 1, client-side only.

- The root layout turns off server-side rendering and loads the session with `supabase.auth.getSession()`. Routes in `(app)` redirect to `/sign-in` without a session; routes in `(auth)` redirect to `/` with one. `/update-password` is open to both, because the reset link signs the user in.
- Sign-up sends a confirmation email (`emailRedirectTo` is the app root). Password reset uses `resetPasswordForEmail` with the redirect `/update-password`.
- The Supabase URL and publishable key are public, static environment variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, declared in `apps/web/src/env.ts` and inlined at build time. CI passes the repository secrets of the same names to the web job.
- New passwords need at least 8 characters, checked in the form; the same minimum should be set in the Supabase project.

### Consequences

- Good: one library, no server code, no cookies; works the same in `vite dev` and on Cloudflare Pages.
- Good: the app's data access is protected by row level security in the database, not by the frontend.
- Bad: pages render only after JavaScript loads; acceptable for a personal learning app that is not indexed by search engines.
- Bad: the session token sits in `localStorage`, readable by any script on the page; the app loads no third-party scripts.
- Bad: "keep me signed in" is not offered; the session always persists until sign-out.

## More information

Settings that live in the Supabase dashboard (Authentication), not in the repository:

- Site URL `https://study-atelier.pages.dev`; redirect URLs `https://study-atelier.pages.dev/**`, `https://develop.study-atelier.pages.dev/**`, `http://localhost:5173/**`.
- Minimum password length 8.
- The built-in email service sends only a few emails per hour and only to the project team's addresses, which is enough for a single learner; a custom SMTP provider is needed before other people sign up (set up with [ADR-0125](0125-send-the-auth-emails-through-gmail-smtp.md)).
