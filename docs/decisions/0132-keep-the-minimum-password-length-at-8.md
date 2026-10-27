# 0132. Keep the minimum password length at 8

- Status: accepted
- Date: 2026-10-26

## Context and problem statement

The security audit before other learners sign up (ATL-327) reviewed the Auth settings. A password must be at least 8 characters, in `supabase/config.toml`, in the dashboard of both projects and in `MIN_PASSWORD_LENGTH` of the app. The Security Advisor reports that leaked password protection is off; it checks new passwords against HaveIBeenPwned and comes only with Supabase Pro. Should the minimum be raised while there is no leak check?

## Decision drivers

- Running costs stay at zero, so leaked password protection is not available.
- A longer minimum is a small change for a learner choosing a password, but it is one more rule in the sign-up form.

## Considered options

- Keep 8 characters
- Raise the minimum to 10 characters in the config, the dashboards and the app

## Decision outcome

Chosen by the owner: keep 8 characters for now. The minimum is revisited together with the paid plans, when leaked password protection can be switched on.

### Consequences

- Good: nothing changes for the sign-up, the password reset or the password change.
- Bad: without the leak check, a short password from a known leak is accepted; the Security Advisor keeps its warning about it.

## More information

- Issue ATL-327.
