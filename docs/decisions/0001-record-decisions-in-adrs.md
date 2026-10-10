# 0001. Record decisions as ADRs and keep docs in the repository

- Status: accepted
- Date: 2026-10-10

## Context and problem statement

The project is built by Claude with the owner making every decision. Decisions, the app description and the rules Claude must follow need to live somewhere durable, reviewable and close to the code.

## Decision drivers

- Decisions must survive across many working sessions.
- Changes to rules and decisions should be reviewable in pull requests.
- Follow established documentation practices rather than an ad-hoc format.

## Considered options

- `docs/` in the repository with ADRs (MADR), arc42-lite and C4, organised along Diátaxis
- An external wiki or document tool
- No formal documentation

## Decision outcome

Chosen option: `docs/` in the repository, written entirely in English:

- `docs/decisions/`: ADRs in MADR format, for business and technical decisions
- `docs/architecture/`: lightweight arc42 outline with C4 diagrams
- `docs/product/`: vision, requirements, glossary
- `docs/guidelines/`: working rules, referenced from a short root `CLAUDE.md`

### Consequences

- Good: docs are versioned and reviewed together with code; Claude reads the rules automatically through `CLAUDE.md`.
- Bad: keeping docs current takes discipline; this is enforced by the [documentation rules](../guidelines/documentation.md).
