---
name: study-atelier-pr-review
description: Review a study-atelier pull request against the repo's own living docs (CLAUDE.md, docs/guidelines, ADRs, product and architecture docs) plus code correctness.
---

# study-atelier PR review

Review a pull request in the study-atelier repository. The project's rules live in the repository and are still changing, so **never review from memory or from this file's examples**: read the current docs every time and judge the PR against what they say now.

## 1. Gather the PR

- Get the PR metadata, diff, commits and changed files (GitHub MCP `pull_request_read`, or `git fetch` + `git diff <base>...<head>`).
- Note: base branch, head branch name, title, description, every commit message, linked Linear issue (ATL-n).

## 2. Read the rules, from the right branch

Read from the PR's **base** branch (the rules the PR must follow) and from the **head** branch (the PR may itself change the rules). If the PR changes a rule, review the rest of the PR against the new rule and say so explicitly.

Read, in this order, whatever exists:

1. `CLAUDE.md` at the repo root, and every file it links to.
2. Everything in `docs/guidelines/`.
3. `docs/decisions/README.md` (the ADR index), then the full text of every ADR whose topic the diff touches (stack, backend, hosting, images, database, auth, tracking, workflow...). Note each one's status.
4. `docs/product/` (vision, requirements, glossary) when the PR adds or changes app behaviour or domain terms.
5. `docs/architecture/` when the PR changes structure, adds a container/component, or touches deployment.
6. Any `.github/pull_request_template.md` or other repo-local review/contributing rules.

If a file the checklist below expects is missing, don't invent the rule; mention the gap only if it matters for this PR.

## 3. Check the PR

Turn the docs into concrete checks. Typical areas (verify each against the current text, they are examples, not the rules):

**Process and hygiene**

- Target branch and branch name match the branching model in the git-workflow guideline.
- PR title and every commit message follow the commit convention (type, scope, imperative lowercase description, issue reference) as currently written.
- PR description covers what the guidelines require (what, why, docs/ADRs touched).
- One issue per PR; the PR doesn't bundle unrelated work or jump ahead of the agreed pace/scope described in the working agreement.
- Language rules (repo content in English).

**No personal data in the repository**

- Docs, ADRs, guidelines, code and comments refer to people by role ("the owner"), never by name.
- No personal fields such as a "Deciders" list in ADRs, no e-mail addresses, phone numbers or other personal details.
- The repository's own name and URL are allowed.

**Docs kept in sync**

- Behaviour, architecture or rule changes update the matching docs in the same PR (use the "where things go" table in the documentation guideline).
- A new decision comes with a new ADR from the template, correctly numbered, with a valid status, and added to the ADR index.
- Accepted ADRs are not rewritten; a changed decision supersedes the old ADR and updates its status.
- New domain terms appear in the glossary; diagrams follow the documented format.
- Links between docs resolve (check relative paths actually exist on the head branch).

**Consistency with decisions**

- The change does not contradict an accepted ADR (e.g. adds a component, service, dependency or cost the ADRs rule out) and does not build on a `proposed` one.
- Anything that needs the owner's explicit approval per the working agreement (external resources, cost, deletions, direct pushes) is flagged, not assumed.

**Code** (once code exists)

- Correctness, edge cases, error handling, tests for new behaviour.
- Security for the actual stack in the ADRs: e.g. no secrets or service-role keys in frontend code, data access protected server-side (row-level security policies for every new table), safe handling of external API data.
- Fits the documented architecture and folder layout; no dead code or leftover debug output.
- Structure and size: `pnpm lint` already fails on file and block sizes, complexity, the folder layout, the dependency directions and cycles, and Supabase outside data files (see "Checked by lint" in the code conventions), so check only what it cannot judge: each new or moved file sits in the right module and layer (`shared`, `catalogue`, a feature module, `shell`), shared code moved down instead of sitting in one feature module, a module's name still says what it holds, `utils/` holds only general helpers named by topic, a split follows what the learner sees rather than technical layers, a page script past about 80 lines moved its logic into the module, and the PR adds nothing to `lint/allowlist.json` or the dependency-cruiser baselines.
- Duplication: the change uses the shared helpers (form state and the form error, the error-message factory, storage, ids) instead of writing its own copy, and moves any copy it touches.

**UI and texts** (when the PR changes views, components or messages)

- Follows `docs/guidelines/ui-patterns.md` for what a linter cannot check: links for navigation and buttons for actions, the form flow, message placement, text roles instead of restyled headings, semantic tokens only, no literal values where a token exists.
- New or changed UI texts follow `docs/product/voice-and-tone.md` and live in the message dictionary.

## 4. Report

- Classify each finding: **blocking** (breaks a documented rule, an accepted ADR, or correctness/security), **should fix**, **nit**.
- For every finding cite the evidence: `file:line` in the diff and the doc rule it violates (`docs/guidelines/git-workflow.md`, `ADR-0005`, ...). A finding with no rule and no concrete failure is a nit at most.
- Separately list **docs gaps**: places where the docs are silent or contradictory and the PR exposed it. Suggest the doc change; don't treat it as the PR's fault.
- End with a verdict: ready for the owner's review / needs changes, with the blocking items.
- Write the summary in the language of the conversation with the owner (Polish). Anything posted on GitHub (review comments) is in English.

## Boundaries

- Never approve, merge, or push to someone else's branch. The owner approves and merges every PR.
- Post comments on GitHub only when asked; otherwise deliver the review in chat.
- If the PR is your own, still review it honestly and fix blocking findings before handing it to the owner.
