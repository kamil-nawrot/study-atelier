# 0146. Publish the legal texts without a lawyer's review

- Status: accepted
- Date: 2026-10-27

## Context and problem statement

[ADR-0137](0137-publish-the-terms-and-the-privacy-policy-and-store-their-acceptance.md) left the terms and the privacy policy with open points and said they needed a lawyer's review before sign-up opens to everyone. Sign-up opens with the 0.13 release, with no closed beta. Is a lawyer's review a condition of the release, and whose data name the provider?

## Decision drivers

- The owner runs the app alone, at no cost.
- The provider runs a sole proprietorship whose business address is the home address, already public in the business register (CEIDG).

## Considered options

- Wait for a lawyer's review, or publish the texts as drafted with the owner
- The sole proprietorship's data (name, address, tax number), or a private person's name and email only

## Decision outcome

Chosen by the owner: no lawyer's review, and the sole proprietorship's data.

- The texts go live as drafted with the owner, after the automated review of ATL-331 and the open points filled in ATL-355.
- `LEGAL_COMPANY`, `LEGAL_ADDRESS` and `LEGAL_NIP` hold the sole proprietorship's data, the address being the registered business address.
- The Data Privacy Framework participants named in the policy come from the vendors' own statements; the owner may check them on dataprivacyframework.gov.

### Consequences

- Good: sign-up opens with the release, with no further cost or wait.
- Bad: no lawyer checked the texts; a mistake is found only when someone points it out, and a fix is a new version that every learner accepts again.
- Bad: the provider's home address is shown on the legal pages, as it already is in the business register.

## More information

- Issues ATL-331 and ATL-355.
