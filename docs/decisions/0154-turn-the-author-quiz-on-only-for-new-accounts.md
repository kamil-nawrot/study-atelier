# 0154. Turn the author quiz on only for new accounts

- Status: accepted
- Date: 2026-10-28

## Context and problem statement

[ADR-0152](0152-ask-who-made-the-artwork-in-the-review.md) switched "Dopasowywanie autora do dzieła" on for every existing account. A learner who had chosen their quiz kinds in the settings would then get a kind they never chose. Should the new kind reach existing accounts?

## Decision drivers

- A learner's own choice of quiz kinds is kept.
- New accounts get every kind, as before.

## Considered options

- Switch the author quiz on for every existing account
- Switch it on only for new accounts

## Decision outcome

Chosen by the owner: only for new accounts.

- The default of `profiles.review_quiz_kinds` keeps `quiz_author`, so a new account starts with it.
- The migration `20261028180000_author_quiz_for_new_accounts` removes `quiz_author` from the profiles that exist when it runs, undoing the update of `20261028100000_author_review_quiz`; a profile whose only kind is the author quiz keeps it, since a profile needs at least one kind. Production gets both migrations in the release 0.13.1, so its learners keep exactly the kinds they had.
- An existing learner turns the author quiz on in the settings like any other kind.

### Consequences

- Good: nobody's chosen quiz kinds change with a release.
- Bad: existing learners see author questions only after switching them on themselves.

## More information

- Issue ATL-370. Replaces the point of ADR-0152 that switched the kind on for every existing account; the rest of ADR-0152 stands.
