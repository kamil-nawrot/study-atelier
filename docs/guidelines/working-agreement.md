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

## Working with the owner

These rules come from the owner's corrections in earlier sessions ([ADR-0250](../decisions/0250-keep-the-rules-of-working-with-the-owner-in-the-working-agreement.md)).

- **Scenarios before a decision.** A rule that orders, groups or lays out the owner's data is checked on the real data first (a read-only query, see [Decisions](#decisions)). A rule with limits, counts or time is shown as what the learner sees, step by step, in two or three realistic scenarios. A technical design is walked through a table of scenarios that includes the cases it does not handle, names every arbitrary value as arbitrary and states the real gain at today's data size.
- **A new module starts with doubt.** An idea for a new module gets a spike issue that opens with an adversarial discussion: the strongest objections, each with a question for the owner, about the value, the overlap with existing modules and the cost. Every mechanism added later in the design, Claude's own included, is challenged the same way. Before the spike's ADR, every agreed rule is checked against the code (where the data is counted, which ids and orders exist, ties, empty states, time zones).
- **Facts are checked in the code.** Every claim about how the app works, in a proposed text, a design question, a prototype or a bug report, is checked in the code, the database constraints and the real data first, not inferred from types.
- **Texts before building.** A new or reworked screen gets all its texts proposed before it is built; the owner usually rewrites them. An owner's draft is polished close to its wording and rhythm, and every proposal must read as written in Polish, not translated ([voice-and-tone.md](../product/voice-and-tone.md)).
- **An agreed layout is not changed silently.** When agreed content does not fit an agreed layout, Claude stops and asks with options (change the text, let the part wrap, change the layout).
- **One topic per message.** A question names its Linear issue and does not ride along with a message about another task, and a part of the UI is called by the name the code and the issue use. Mockups needed for a choice go in the message or in a screenshot, since option previews of a question are cut to one line.
- **A learner's bug comes first.** A bug a learner reported is filed as a `Bug` with priority High in the milestone being worked on, explained with options when the fix needs a decision, and built before the work in progress continues.
- **A milestone is read in Linear.** Before saying what is left in a milestone, Claude lists its issues in Linear instead of counting from the conversation.

## Mockups

Mockups (for example from a design session in Claude Projects) show layout and proportions. Where a mockup differs from an accepted ADR in texts, fields or details, the ADR wins, and nothing that only the mockup shows is built without asking the owner. Mockup files kept locally go in the ignored `tmp/` folder, never in a commit.

Instead of a separate mockup, a screen can be prototyped in code on its branch once the owner has agreed its content and texts: the owner runs it locally and asks for changes, screenshots are not needed for this step, and the ADR is written after the owner accepts the result.

In a spike, a design can also be tried as an interactive prototype published as a private Artifact, which the owner opens on a phone and a larger screen and which is changed version by version on the owner's feedback. The prototype stays outside the repository and is linked in the Linear issue. Its data is sample data shaped like the target collection and marked as such. Its images are placeholders, because an Artifact cannot load images from other hosts. The decisions taken on it are recorded in the issue as they are made and then in an ADR. Where the prototype differs from the ADR, the ADR wins.

## Pace

The project goes one step at a time. Claude does not jump ahead to later steps (for example writing application code before requirements are agreed).

Several Claude sessions may work at the same time. Before starting an issue, Claude checks that no other session is on it: its status in Linear, the remote branches and the open pull requests. When one is, Claude tells the owner before doing anything.

Every local Claude session works in its own worktree, set up with `pnpm worktree <branch>` (see [git-workflow.md](git-workflow.md#worktrees)), and never edits files or switches branches in the main checkout, which is the owner's ([ADR-0247](../decisions/0247-work-in-a-worktree-per-session.md)). A cloud session works in its own clone.

## End of a session

When Claude opens a session's pull request, before asking for review, Claude runs the [`study-atelier-session-retro`](../../.claude/skills/study-atelier-session-retro/SKILL.md) skill: it proposes what the conversation and the session's pull request taught that is worth recording in the docs, the guidelines or the project memory, and records what the owner confirms in that same pull request. The owner may merge as soon as CI passes, so the retro does not wait for the review; findings from the review itself are added in a short second round while the pull request is still open.

## Working in a loop

Once the issues of a milestone are agreed, Claude works through them without waiting to be told. Claude merges its own `feature/*` and `bugfix/*` pull requests into `develop` with a squash once `pnpm wait-ci` passes, then moves the issue to Done and removes the worktree; the owner gave this standing approval on 2026-10-29. A pull request that adds or changes UI texts waits for the owner's agreement on the texts, listed in a table, before it is merged. An issue blocked on the owner's decision does not stop the others: Claude asks, and meanwhile takes an unblocked issue in its own worktree. In a milestone of many small polish issues, the checks may run per batch of issues and one pull request may carry several issues, under the branch and title of the leading one with the others listed in its Context.

A small fix the owner asks for in the middle of a session, such as a flaky test, goes on the session's current branch: only its files are committed, the commit names the branch's own issue, and the pull request description gets a line about it. A larger or riskier change gets its own issue; Claude asks when unsure. Small fixes the owner notes in passing while other work goes on go into one open `Bug` issue of the current milestone, and later ones are added to that issue, its branch and its pull request.

## Actions that need the owner's explicit approval

- creating external resources (repositories, cloud projects, accounts, paid services)
- merging release, hotfix and merge-back pull requests, merging any pull request that is not Claude's own (see [Working in a loop](#working-in-a-loop)), and pushing directly to `main` or `develop`
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
