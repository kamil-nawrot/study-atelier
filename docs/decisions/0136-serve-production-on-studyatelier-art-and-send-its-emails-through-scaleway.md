# 0136. Serve production on studyatelier.art and send its emails through Scaleway

- Status: accepted
- Date: 2026-10-26

## Context and problem statement

Production ran at `study-atelier.pages.dev` and sent the auth emails from a personal Gmail account ([ADR-0125](0125-send-the-auth-emails-through-gmail-smtp.md)). A legal review of the privacy policy (ATL-331) found that a personal Gmail account has no data processing agreement (art. 28 GDPR), so it cannot send the emails of other learners. Every provider with such an agreement needs a sending domain, and the app had none (ATL-91). Which domain, which provider for the outgoing mail, and where does mail to the contact address go?

## Decision drivers

- A data processing agreement and data in the EU for everything that carries learners' data.
- Costs close to zero at the size of a closed beta.
- A provider that does not close a new account without a reason, as Brevo did ([ADR-0119](0119-send-the-auth-emails-through-brevo.md)).

## Considered options

- Domain: a `.art` domain bought at Namecheap with DNS on Cloudflare, or a domain at Cloudflare Registrar, which does not sell `.art`
- Outgoing mail: Mailjet, Scaleway Transactional Email, Resend, MailerSend
- Contact mailbox: Cloudflare Email Routing to the owner's Gmail, Zoho Mail Lite, Google Workspace

## Decision outcome

Chosen by the owner:

- **Domain** `studyatelier.art`, registered at Namecheap; its DNS is on Cloudflare. Production is served at `https://studyatelier.art`; `www` and `study-atelier.pages.dev` redirect to it with a 301. Develop stays at `develop.study-atelier.pages.dev`.
- **Outgoing mail of production** through Scaleway Transactional Email: Scaleway SAS, Paris, the service runs only in `fr-par` with no subprocessor outside the EU, and its data processing agreement is part of the contract. 300 emails a month are free, then €0.25 per 1,000. The sender is `kontakt@studyatelier.art`, authenticated by SPF, DKIM and DMARC. Mailjet was chosen first but closed the new account right after its confirmation, without a reason.
- **Outgoing mail of develop** stays on the Gmail SMTP of ADR-0125: develop holds only the owner's test accounts, so the agreement does not matter there.
- **Contact address** `kontakt@studyatelier.art` through Cloudflare Email Routing to the owner's Gmail, for now.

### Consequences

- Good: production mail is sent from the app's own domain with an agreement and EU data, and arrives in the inbox (SPF, DKIM and DMARC pass).
- Good: one Scaleway account can hold another app later as its own project with its own key.
- Bad: mail to the contact address, including data protection requests, is kept in a personal Gmail without an agreement; a mailbox with one (for example Zoho Mail Lite) is to be set up before sign-up opens to everyone.
- Bad: develop no longer tests the production mail path.
- Bad: the `.art` registration renews at Namecheap's price, as Cloudflare Registrar does not offer it.

## More information

- Issue ATL-350; settles ATL-91. Setup steps and DNS records in [hosted environments](../architecture/hosted-environments.md#domain).
- Supersedes ADR-0125 for production.
