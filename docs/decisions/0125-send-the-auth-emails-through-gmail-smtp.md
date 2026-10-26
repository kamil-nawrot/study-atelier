# 0125. Send the auth emails through Gmail SMTP

- Status: accepted; sending from production is superseded by [0136](0136-serve-production-on-studyatelier-art-and-send-its-emails-through-scaleway.md)
- Date: 2026-10-24

## Context and problem statement

[ADR-0119](0119-send-the-auth-emails-through-brevo.md) chose Brevo on the free plan. The owner's new Brevo account was paused at once with "Under review" after a compliance check, and the sending stayed blocked, so the email change of [ADR-0117](0117-settings-view-in-tabs-opened-from-the-avatar.md) had no way to send mail. The app still has no domain of its own.

## Decision drivers

- Running costs stay at zero.
- No own domain, and no account review that can block the sending.
- Supabase needs plain SMTP settings, so the provider can change later without touching the code.

## Considered options

1. Wait for Brevo support to lift the review
2. Send from a dedicated Gmail address through `smtp.gmail.com` with an app password
3. Another free provider (Mailjet, SMTP2GO) with a similar account review

## Decision outcome

Chosen by the owner: option 2.

- The owner creates a dedicated Gmail address for the app, turns on two-step verification and generates an app password. The address is the sender and the app password is the SMTP password, entered only in the Supabase dashboard of `develop` and `production`; nothing secret goes to the repository or a chat.
- The Polish templates stay as in ADR-0119 and live in `supabase/templates`.

### Consequences

- Good: no cost, no domain, no review, and about 500 mails a day, far more than a personal app sends.
- Bad: the mails come from a free Gmail address and may land in spam more often; Google may block a fresh account that starts sending at once, so it is used normally for a while first.
- Good: moving to an own domain with a transactional provider later changes only the dashboard settings.

## More information

- Supersedes [ADR-0119](0119-send-the-auth-emails-through-brevo.md); issues ATL-288 (SMTP) and ATL-289 (email change).
