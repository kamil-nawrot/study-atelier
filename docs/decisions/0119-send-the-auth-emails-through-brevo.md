# 0119. Send the auth emails through Brevo

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

The built-in mailer of Supabase sends a few emails an hour and only to members of the Supabase project team ([ADR-0016](0016-supabase-auth-in-the-browser.md)). The email change of [ADR-0117](0117-settings-view-in-tabs-opened-from-the-avatar.md) sends links to an address outside the team, so it needs an own SMTP provider; so would the sign-up of any other learner. The app has no domain of its own (spike ATL-91), and `*.pages.dev` gives no access to DNS.

## Decision drivers

- Running costs stay at zero.
- Providers that send from an own domain need DNS records of that domain.

## Considered options

1. Brevo on the free plan (300 emails a day), sending from one verified mailbox without a domain
2. Buy a domain and send through Resend on the free plan (100 emails a day) from that domain
3. Leave the email change out of 0.10

## Decision outcome

Chosen by the owner: option 1.

- The owner creates the Brevo account and the sending mailbox and enters the SMTP settings in the Supabase dashboard (Authentication, SMTP Settings) for DEV and production. Credentials never go to the repository or a chat.
- The texts of the auth email templates (confirm sign-up, reset password, change email address) are Polish, kept in the repository and pasted into both projects by the owner.

### Consequences

- Good: no cost, and every learner can sign up and change their address.
- Bad: Brevo adds its own footer on the free plan, and mail from a free mailbox lands in spam more often.
- Good: moving to an own domain later changes only the dashboard settings, not the code.

## More information

- Issues ATL-288 (SMTP) and ATL-289 (email change).
