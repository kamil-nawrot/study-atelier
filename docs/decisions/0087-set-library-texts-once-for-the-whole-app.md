# 0087. Set the library texts once for the whole app, also in tests

- Status: accepted
- Date: 2026-10-20

## Context and problem statement

UI text lives in typed dictionaries ([ADR-0015](0015-typed-message-dictionaries-for-i18n.md)). Library components keep English defaults for their own words (`UiMessages`) and the app sets the Polish ones with `setUiMessages(m.ui)` in the root layout. The texts were kept in Svelte context, so a page or component test, which renders without the root layout, saw the English defaults. Tests avoided library texts or matched them by a fragment (`name: /malowidło/` for "Usuń malowidło"), and app code passed library texts as props only so tests could find them (`<NoImage label={m.ui.noImage} />`). How should library texts reach the app and its tests (ATL-56)?

## Decision drivers

- One way to read a text in tests: from `m`, also for words the library renders.
- No text passed as a prop only to please a test.
- Storybook and the library's own tests keep working without the app.

## Considered options

1. A render helper in the app's tests that sets `m.ui` around the component; every test uses it instead of `render`.
2. `setUiMessages` keeps the texts in the library module instead of Svelte context; the app sets them in the root layout and once in the setup file of its browser tests.
3. No defaults in the library: every text is a required prop.

## Decision outcome

Chosen option: 2, by the owner.

- `setUiMessages(messages)` stores the texts in `packages/ui/src/lib/messages.ts`; `uiMessages()` returns them, or the English `defaultUiMessages` until something is set.
- The app calls `setUiMessages(m.ui)` in the root layout, as before, and in `apps/web/src/lib/testing/ui-messages.ts`, the `setupFiles` entry of the `client` test project, so every browser test sees the Polish library texts and reads them from `m.ui`.
- App code passes a text prop to a library component only when one place needs different wording; the copies of `m.ui.noImage` were removed.
- The library's `MessagesHost` sets texts for a test of an override and puts the previous ones back when it is destroyed, so the next test sees the defaults.

### Consequences

- Good: tests read every text from `m`, including the library's, and no longer need fragments or roles to avoid them.
- Good: one line in a setup file instead of a helper every test must remember.
- Bad: the texts are shared by the whole module, not by a component tree. With one language that changes nothing; a second language chosen per request during server rendering would need context again, and this decision would be revisited then.

## More information

- [ADR-0015](0015-typed-message-dictionaries-for-i18n.md) stands; this record changes only how the library's part of the dictionary is delivered.
