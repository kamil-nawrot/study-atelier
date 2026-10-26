# 0135. Delete the account with the password and a database function

- Status: accepted
- Date: 2026-10-26

## Context and problem statement

Before other learners sign up, a learner must be able to delete their account and everything in it (GDPR). The app has no backend of its own ([ADR-0005](0005-no-custom-backend.md)), the learner's grants cannot delete an `auth.users` row, and the files in Storage are not removed by a database cascade. How is the deletion confirmed, and who removes what, so that a failure never leaves half an account?

## Decision drivers

- One deliberate step that cannot be triggered by a slip: the learner proves who they are.
- Nothing of the learner stays behind, and nothing of another learner is touched.
- No new infrastructure, such as an Edge Function with the service key.

## Considered options

- Confirm with the password, with a typed word, or with both
- Delete through a `security definer` database function, or through an Edge Function calling the Auth admin API

## Decision outcome

Chosen by the owner: the password alone confirms, and a `security definer` function deletes the account.

- A section "Usuń konto" at the bottom of "Konto" opens a dialog. It says the account and the whole atelier go for good, links to "Dane" for a copy first ([ADR-0121](0121-export-the-atelier-as-a-zip-file.md)) and asks for the password; "Usuń konto" works once a password is typed.
- The app checks the password by signing in with it, removes every file in the learner's folder of `artwork-images`, then calls `public.delete_account()`.
- `public.delete_account()` takes the learner from `auth.uid()`, refuses (SQLSTATE `55000`) while any of their files is still stored, and deletes their `auth.users` row; every table of the learner follows by `on delete cascade`.
- After the deletion the app signs out on this device and opens the sign-in page with "Konto zostało usunięte razem z całym atelier.", without a page of its own.
- `delete_account` is the second `security definer` function the learner may execute, next to `import_atelier`; `security.sql` names both and the Security Advisor warning is expected ([hosted environments](../architecture/hosted-environments.md#supabase-advisors)).

### Consequences

- Good: the deletion is complete, needs no new infrastructure, and `delete-account.sql` checks that nothing of the learner stays and nothing of another learner changes.
- Good: the account is never deleted while its files would be left behind.
- Bad: if removing the files succeeds only in part, the account stays with some photos missing; the dialog asks to try again, and the next try finishes the job.
- Bad: the encrypted backups of ATL-333 keep the deleted data until they expire after 30 days, which the privacy policy has to say.

## More information

- Issue ATL-290; spike ATL-186.
