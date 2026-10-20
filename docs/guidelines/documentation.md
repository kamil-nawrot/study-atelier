# Documentation rules

## General

- All documentation is written in English, in Markdown, inside [`docs/`](../).
- Docs change in the same pull request as the code or decision they describe.
- Prefer short, specific pages over long ones. Link instead of repeating.

## Where things go

| You want to record | Put it in |
| --- | --- |
| A decision (business or technical) and why it was made | a new ADR in `docs/decisions/` |
| What the app should do | `docs/product/requirements.md` |
| A domain term | `docs/product/glossary.md` |
| How the app speaks to the learner | `docs/product/voice-and-tone.md` |
| How the system is structured | `docs/architecture/` |
| A rule for working in the repository | `docs/guidelines/` |
| A library component and what it is for | its row in `packages/ui/README.md`, in the pull request that adds or changes it |

## Architecture Decision Records

- Format: [MADR](https://adr.github.io/madr/), using [`decisions/template.md`](../decisions/template.md).
- File name: `NNNN-short-title.md`, numbered sequentially and never renumbered once it is on `develop`.
- A new ADR takes the first number free on `develop` and in the open pull requests. When another pull request takes the same number and is merged first, the ADR that is not on `develop` yet moves to the next free number before its pull request is merged, and every link to it is updated; a search and replace of the old number must not touch links to the other ADR that now has it.
- Status is one of `proposed`, `accepted`, `rejected`, `deprecated`, `superseded by NNNN`.
- Accepted ADRs are not rewritten. A changed decision gets a new ADR that supersedes the old one, and the old one's status is updated.
- Corrections that leave the decision unchanged are allowed in an accepted ADR: typos, broken links, facts found to be wrong, and removal of personal data.
- Every new ADR is added to the index in [`decisions/README.md`](../decisions/README.md).

## Architecture

- The structure follows a lightweight [arc42](https://arc42.org) outline; sections are filled in as the system takes shape.
- Diagrams follow the [C4 model](https://c4model.com) and are written as Mermaid inside Markdown so they render on GitHub and can be reviewed as text.
