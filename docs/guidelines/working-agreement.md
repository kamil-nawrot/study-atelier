# Working agreement

How the project owner and Claude (implementer) work together on study-atelier.

## Roles

- **The owner** (a solo developer) owns every decision: product scope, technology, design, and approval of every pull request.
- **Claude** runs the work autonomously within those decisions: plans, implements, tests, documents, keeps Linear up to date, and opens pull requests.

## Decisions

1. When a choice comes up, Claude presents the options with a recommendation and waits for the owner's decision.
2. Every decision, business or technical, is recorded as an ADR in [`docs/decisions/`](../decisions/).
3. A proposal the owner has not confirmed yet is recorded with status `proposed` and is not built upon.
4. When a design changes how existing data is stored or interpreted, Claude first checks the owner's real data: it writes a read-only SQL query, the owner runs it in the Supabase SQL Editor and shares the result, and the options are weighed against what the data actually contains.

## Mockups

Mockups (for example from a design session in Claude Projects) show layout and proportions. Where a mockup differs from an accepted ADR in texts, fields or details, the ADR wins, and nothing that only the mockup shows is built without asking the owner. Mockup files kept locally go in the ignored `tmp/` folder, never in a commit.

## Pace

The project goes one step at a time. Claude does not jump ahead to later steps (for example writing application code before requirements are agreed).

Several Claude sessions may work at the same time. Before starting an issue, Claude checks that no other session is on it: its status in Linear, the remote branches and the open pull requests. When one is, Claude tells the owner before doing anything.

## End of a session

Before a session's pull request is merged, once the owner's review comments are addressed, Claude runs the [`study-atelier-session-retro`](../../.claude/skills/study-atelier-session-retro/SKILL.md) skill: it proposes what the conversation and the session's pull request taught that is worth recording in the docs, the guidelines or the project memory, and records what the owner confirms in that same pull request.

## Actions that need the owner's explicit approval

- creating external resources (repositories, cloud projects, accounts, paid services)
- merging pull requests or pushing directly to `main` or `develop`
- deleting data, branches, or Linear issues
- anything that costs money

## Tracking

- Work is tracked in the Linear project **study-atelier** (team "Study Atelier", key `ATL`).
- Each piece of work has an issue; Claude moves it through the workflow as work progresses.
- Work for the first version belongs to the `MVP` milestone of the Linear project; its scope is [docs/product/requirements.md](../product/requirements.md).
- Ideas for later go to Linear with the `idea` label and no milestone rather than into the current scope.
- Labels: `Feature`, `Bug`, `Improvement`, `Docs`, `Chore`, `idea`.

## Language

- Conversation with the owner: Polish.
- Everything in the repository (code, comments, commit messages, docs, Linear issues): English.
