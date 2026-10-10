# 0004. Build the frontend with Svelte 5 and Vite in TypeScript

- Status: accepted
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

The frontend should use a lightweight TypeScript framework. Kamil knows Angular, which is likely more than this project needs, and treats the project as a chance to learn something new.

## Considered options

- Angular
- Vue 3
- Svelte 5 with Vite

## Decision outcome

Chosen option: Svelte 5 with Vite, in TypeScript, because it needs the least code, has little framework "magic", and is the newest of the three for Kamil.

Whether to use SvelteKit or a plain Vite single-page app will be decided together with the hosting setup.

### Consequences

- Good: small bundles, simple component model, good fit for a static host.
- Bad: smaller ecosystem of UI component libraries than Angular or Vue.
