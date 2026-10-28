# 0148. Show each account action once before signing in

- Status: accepted
- Date: 2026-10-27

## Context and problem statement

The shared header of the pages before signing in ([ADR-0144](0144-describe-the-app-on-a-public-start-page.md), ATL-352) showed "Zaloguj się" and "Załóż konto" on every page except the one the visitor was on. The pages offer the same actions in their content, so the start page had both actions twice, the sign-in page had "Załóż konto" twice, and the password reset page had "Zaloguj się" next to "Wróć do logowania". Which page shows which action in the header?

## Decision drivers

- Each account action appears once on a page.
- A returning learner finds signing in at once on the start page.
- A form keeps the visitor's attention and already links to the other forms.
- The page that sets a new password from an email link must not offer a way around it.

## Considered options

- The header shows only the actions the page does not offer itself
- A header with only the logo on every page before signing in

## Decision outcome

Chosen by the owner: the header shows only the actions the page does not offer itself.

| Page                                                           | Header                       |
| -------------------------------------------------------------- | ---------------------------- |
| Start                                                          | "Zaloguj się"                |
| Sign-in, sign-up, password reset, new password                 | the logo only                |
| Terms, privacy policy                                          | "Zaloguj się", "Załóż konto" |
| Any of them but the new password page, for a signed-in learner | "Przejdź do atelier"         |

The start page leads to "Załóż konto" in its content and no longer repeats "Masz już konto? Zaloguj się" under it. `publicActions` in `#lib/shared/navigation` maps a path to the header's actions.

### Consequences

- Good: no page offers an action twice or links to itself.
- Bad: a visitor on a form reaches the start page only through the logo.

## More information

- Issue ATL-360. Amends the start page and header of ADR-0144.
