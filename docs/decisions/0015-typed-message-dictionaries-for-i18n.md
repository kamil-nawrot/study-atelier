# 0015. Keep UI text in typed message dictionaries, one file per language

- Status: proposed
- Date: 2026-10-11

## Context and problem statement

The interface is in Polish for now, but more languages may be added later. UI text should not be hard-coded in components, so that adding a language does not mean touching every view. The first views (sign-in, sign-up, password reset) need a place for their text now.

## Decision drivers

- As light as possible: one language today, no runtime cost, no new build step.
- Adding a language later is a contained change.
- A missing or misspelled message is caught by the type checker, not by the user.

## Considered options

1. Typed message dictionaries in the app: `src/lib/i18n/pl.ts` holds all messages; other languages are files of the same type
2. Paraglide JS (inlang): messages in JSON, compiled to tree-shaken functions, official SvelteKit add-on
3. svelte-i18n: runtime library with ICU message format and Svelte stores

## Decision outcome

Chosen option: 1, typed message dictionaries.

- `apps/web/src/lib/i18n/pl.ts` exports the Polish messages as a nested object. Messages with values are functions, for example `sent(email)`; Polish plural forms are handled by a small helper in the same file.
- `apps/web/src/lib/i18n/index.ts` exports `Messages` (the type of the Polish object), `locale` and `m`, the active messages. Components import `m` and read `m.signIn.title`.
- `<html lang="pl">` is set in `app.html`.
- Data written by the learner, and artwork titles, are not UI text and stay out of the dictionaries.

### Consequences

- Good: no dependency and no build step; the type checker reports a message that does not exist.
- Good: adding a language is a new file typed as `Messages` plus a way to choose it; the views do not change.
- Bad: choosing the language at runtime (from the browser or a setting) is not built yet; it is needed only when a second language arrives.
- Bad: no translation tooling or message format standard; if translations grow, moving to Paraglide is a mechanical change (same keys, JSON files).

## More information

- Paraglide JS: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
- svelte-i18n: https://github.com/kaisermann/svelte-i18n
