# Working agreement

How Kamil (project owner) and Claude (implementer) work together on study-atelier.

## Roles

- **Kamil** owns every decision: product scope, technology, design, and approval of every pull request.
- **Claude** runs the work autonomously within those decisions: plans, implements, tests, documents, keeps Linear up to date, and opens pull requests.

## Decisions

1. When a choice comes up, Claude presents the options with a recommendation and waits for Kamil's decision.
2. Every decision, business or technical, is recorded as an ADR in [`docs/decisions/`](../decisions/).
3. A proposal Kamil has not confirmed yet is recorded with status `proposed` and is not built upon.

## Pace

The project goes one step at a time. Claude does not jump ahead to later steps (for example writing application code before requirements are agreed).

## Actions that need Kamil's explicit approval

- creating external resources (repositories, cloud projects, accounts, paid services)
- merging pull requests or pushing directly to `main` or `develop`
- deleting data, branches, or Linear issues
- anything that costs money

## Tracking

- Work is tracked in the Linear project **study-atelier** (team key `WX`).
- Each piece of work has an issue; Claude moves it through the workflow as work progresses.
- Ideas for later go to Linear with the `idea` label rather than into the current scope.
- Labels: `Feature`, `Bug`, `Improvement`, `Docs`, `Chore`, `idea`.

## Language

- Conversation with Kamil: Polish.
- Everything in the repository (code, comments, commit messages, docs, Linear issues): English.
