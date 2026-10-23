# 0117. Settings view in tabs opened from the avatar

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

The learner needs one place to change their name, photo, email address and password and to set their preferences. How is the view laid out, how is it reached, and how do its parts save?

## Decision drivers

- The view is used rarely and holds four unrelated parts.
- A phone screen should not become one long column.
- Changing the password or the email must be protected on a device left signed in.

## Considered options

- Layout: one page with sections; tabs like the card index; a side menu of sections with framed cards
- Entry: the avatar row of the menu; a separate "Ustawienia" item with a gear icon; both
- Saving the preferences: at once on every change; with a "Zapisz" button

## Decision outcome

Chosen by the owner:

- The view `/atelier/settings` ("Ustawienia") is a module page with the library `Tabs`: "Profil", "Konto", "Powtórki", "Widok dzieła". The chosen tab is in the address, so another view can link straight to a tab.
- The avatar row at the top of the menu becomes a link to the view: the avatar, the name and under it the email in smaller muted text. There is no separate menu item.
- "Profil" has the photo with "Dodaj zdjęcie" / "Zmień zdjęcie" and "Usuń zdjęcie", and "Imię" with "Zapisz profil".
- "Konto" has two small forms: "Adres e-mail" with "Zmień adres", and "Zmiana hasła" with "Obecne hasło", "Nowe hasło" (at least 8 characters) and "Wyloguj mnie na innych urządzeniach", ticked by default, with "Zmień hasło". The current password is checked by signing in with it before the new one is set; ticking the box signs out the other sessions. The email change uses Supabase's secure email change: a link goes to the old and to the new address and the change takes effect after both are clicked ([ADR-0119](0119-send-the-auth-emails-through-brevo.md)).
- "Powtórki" and "Widok dzieła" save with "Zapisz ustawienia"; leaving a tab or the view with unsaved changes asks "Odrzucić zmiany?" like the forms.
- Every save confirms with a `Toast`; errors show inline under the field or in an `Alert` at the top of the tab.

### Consequences

- Good: the same pattern as the card index, short screens on a phone and links to a tab.
- Bad: nothing in the menu says "settings" in words; the avatar row has to look clickable.
- Bad: switches with a save button can be left unsaved, which the leave dialog covers.

## More information

- Texts: variant B of the design issue ATL-286, in [requirements.md](../product/requirements.md) R-140 to R-145.
