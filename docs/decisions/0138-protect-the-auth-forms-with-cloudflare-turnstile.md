# 0138. Protect the auth forms with Cloudflare Turnstile

- Status: accepted
- Date: 2026-10-26

## Context and problem statement

Before sign-up opens to everyone, bots can create accounts, flood the mailboxes of others with confirmation and reset mails through Supabase Auth and guess passwords. Supabase Auth checks a captcha token when captcha protection is on in the project. Which captcha, where is it shown, and how does it reach production without locking out learners?

## Decision drivers

- No cost and no new account: the app is already hosted on Cloudflare.
- Most learners should not see any challenge.
- With captcha protection on, Supabase refuses every protected request without a token, including the password grant used to confirm the password in the settings.
- Local development and pull request builds work without any key.

## Considered options

- Cloudflare Turnstile, hCaptcha, or the Supabase rate limits alone
- The widget always visible, or shown only when Cloudflare needs an interaction

## Decision outcome

Chosen by the owner: Cloudflare Turnstile in the Managed mode with `appearance: 'interaction-only'`, so the widget takes no space unless Cloudflare asks the learner to click.

- The widget is on every form whose request Supabase protects: sign-in, sign-up, the forgotten password, the resend of the confirmation on "Sprawdź skrzynkę", and the password confirmation for changing the password and for deleting the account in the Konto tab. The script loads from Cloudflare only on these forms, in the page's theme and in Polish.
- Each attempt uses a fresh token: the form waits for the token (at most 15 seconds), sends it as `captchaToken`, and resets the widget afterwards, because a token is valid once.
- A refused token shows "Nie udało się potwierdzić, że to Ty, a nie automat. Spróbuj jeszcze raz."
- The site key is the optional public variable `TURNSTILE_SITE_KEY` of each GitHub environment; without it no widget is shown and no token is sent, which is what local development and pull request builds do. The secret key lives only in the captcha settings of each Supabase project.
- Rollout: deploy the app with the site key first, then turn captcha protection on in Supabase; in the other order every sign-in fails until the deployment.
- The privacy policy names Turnstile among the Cloudflare services and in § 9.

### Consequences

- Good: no cost, no cookies for tracking, and most learners never see a challenge.
- Good: the protection is set in the Supabase dashboard and can be turned off there at once if Cloudflare fails.
- Bad: when Cloudflare cannot be reached, or a browser blocks its script, nobody can sign in while captcha protection is on.
- Bad: every protected form loads a script from Cloudflare and sends it the learner's IP address and browser details.

## More information

- Issue ATL-330; the steps are in [hosted environments](../architecture/hosted-environments.md#captcha).
