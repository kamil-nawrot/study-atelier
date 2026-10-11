---
name: study-atelier-idea
description: Record an idea for a later version of study-atelier as a Linear issue with the idea label, no milestone, and the standard short description.
---

# study-atelier idea

Use this whenever the owner mentions an idea for a later version, or work turns up something worth doing that is outside the current scope. Read the Tracking section of [`docs/guidelines/working-agreement.md`](../../../docs/guidelines/working-agreement.md) first: it holds the current rules for milestones and labels.

## 1. Check for duplicates

Search the Linear project **study-atelier** (team `ATL`) for issues with the `idea` label and for similar titles. If the idea already exists, add the new details to that issue instead of creating another one, and tell the owner which issue it is.

## 2. Create the issue

- Team `Study Atelier`, project `study-atelier`.
- Label `idea` only. Add a type label (`Feature`, `Improvement`, `Chore`, ...) only when it is obvious.
- No milestone, status `Backlog`, no priority, no assignee.
- Title: a short noun phrase or imperative in English, describing the outcome for the learner, for example `More than one image per artwork`. No trailing period.

## 3. Description

Use exactly this template, in English, even when the owner spoke in Polish:

```markdown
## Idea

<What the idea is and what it gives the learner, in 1-3 sentences. Include the owner's examples.>

## Today

<How the app handles this now, or in the MVP, in one sentence. Write `Not covered.` when nothing does.>

## Source

<Where the idea came from: the owner, a thread, a document or a related issue, with a link when there is one.>
```

- Keep it short: record the idea, do not design it. No requirements, estimates or solutions the owner did not mention.
- Link related issues (`relatedTo`) when the idea builds on or competes with another one.

## 4. Report back

Tell the owner the issue key and title in one line. Do not move the idea into the current scope; that is the owner's decision.
