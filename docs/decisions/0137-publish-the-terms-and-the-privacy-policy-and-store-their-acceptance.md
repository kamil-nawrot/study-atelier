# 0137. Publish the terms and the privacy policy and store their acceptance

- Status: accepted
- Date: 2026-10-26

## Context and problem statement

Before other learners sign up, the owner, who runs the app as a business, is the controller of their data and the provider of an electronically supplied service. The app needs a privacy policy (art. 13 GDPR) and terms of service (art. 8 of the Polish act on electronically supplied services, the Digital Services Act), shown before sign-up, accepted by every learner and accepted again when they change. How are the texts kept and shown, where is the acceptance stored, and how does a changed version reach learners who signed up earlier?

## Decision drivers

- The texts are a legal document the owner edits as a whole, not interface labels.
- The provider's personal data (name, address, tax number) stays out of the public repository.
- The acceptance is stored even before the learner confirms the email address, when the app has no session yet.
- A learner who does not accept a new version can still export the atelier and delete the account.

## Considered options

- Texts as Markdown files with a version, or as keys of the message dictionary
- Acceptance stored from the browser after the first sign-in, or by the database at sign-up
- A new version announced in a dialog in the app, or only by email

## Decision outcome

Chosen by the owner:

- The texts were drafted in a shared document, reviewed by an automated legal review against Polish and EU law and edited by the owner; they live in `apps/web/src/lib/legal/texts/` as Markdown and are shown at `/terms` and `/privacy`, public pages outside the sign-in. They are content, not interface texts, so they are not in the message dictionary. The version is the date in `LEGAL_VERSION`; the pages say "Obowiązuje od" that date.
- The provider's business name, address and tax number come from the optional public variables `LEGAL_COMPANY`, `LEGAL_ADDRESS` and `LEGAL_NIP` of each environment; without them the pages show `[FIRMA]`, `[ADRES]` and `[NIP]`. The app's own contact address and URL are written in the texts.
- Sign-up requires the checkbox "Akceptuję Regulamin i oświadczam, że zapoznałem(-am) się z Polityką prywatności." with links that open in a new tab, and sends the accepted version as user metadata. A trigger on `auth.users` copies it into `profiles.legal_version`, and `profiles.legal_accepted_at` is stamped by the database whenever the version changes, so a learner cannot choose the time. Accounts that existed before were marked as accepting the first version by the migration.
- A signed-in learner whose accepted version is not the current one sees a dialog in the atelier, with links to both documents, "Akceptuję" and "Przejdź do ustawień"; the settings show no dialog, so the learner can export the atelier or delete the account there. The Konto tab shows the accepted version, and the sign-in and sign-up forms link both documents.
- The age is 16, with the consent of a parent below 18 (§ 5 of the terms).

### Consequences

- Good: the acceptance is recorded at sign-up, before the email is confirmed, and its time cannot be forged.
- Good: a text change is a Markdown edit plus a new `LEGAL_VERSION` and a migration-free release.
- Bad: the email notice 14 days before a change (§ 13 of the terms) is not sent by the app; the owner sends it by hand for now.
- Bad: previous versions are not archived yet; the first change of the texts has to add an archive, as the texts promise their dates.
- Bad: the texts still hold open points ([X] retention periods, the providers certified under the Data Privacy Framework) and need a lawyer's review before sign-up opens to everyone.

## More information

- Issue ATL-331; the legal review and the owner's decisions are in the shared document of the issue.
